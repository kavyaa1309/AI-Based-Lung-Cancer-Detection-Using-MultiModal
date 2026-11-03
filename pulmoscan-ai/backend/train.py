"""Train a cancerous / non-cancerous classifier for one modality.

    python train.py --modality ct
    python train.py --modality xray

Expects data/<modality>/{non_cancerous,cancerous}/  (created by prepare_dataset.py).
Writes models/<modality>.pt and models/<modality>_metrics.json.
"""
from __future__ import annotations

import argparse
import copy
import json
import os
import time
from pathlib import Path

import numpy as np
import torch
import torch.nn as nn
from sklearn.metrics import confusion_matrix, roc_auc_score
from torch.utils.data import DataLoader, Dataset

from common import CLASS_NAMES, MODALITIES, list_samples, load_image, stratified_split
from model import build_model, eval_transform, get_device, train_transform


class ImageDataset(Dataset):
    def __init__(self, paths, labels, transform, modality):
        self.paths, self.labels, self.transform, self.modality = paths, labels, transform, modality

    def __len__(self):
        return len(self.paths)

    def __getitem__(self, i):
        img = load_image(self.paths[i], self.modality)
        return self.transform(img), self.labels[i]


@torch.no_grad()
def collect_logits(model, loader, device):
    model.eval()
    logits, ys = [], []
    for x, y in loader:
        logits.append(model(x.to(device)).cpu())
        ys.append(y)
    return torch.cat(logits), torch.cat(ys)


def fit_temperature(logits: torch.Tensor, y: torch.Tensor) -> float:
    """Temperature scaling on the validation set so the reported confidence is calibrated."""
    log_t = torch.zeros(1, requires_grad=True)
    opt = torch.optim.LBFGS([log_t], lr=0.1, max_iter=100)
    nll = nn.CrossEntropyLoss()

    def closure():
        opt.zero_grad()
        loss = nll(logits / log_t.exp(), y)
        loss.backward()
        return loss

    opt.step(closure)
    return float(log_t.exp().clamp(0.05, 20.0))


def evaluate(logits, y, temperature, threshold=0.5) -> dict:
    prob = torch.softmax(logits / temperature, dim=1)[:, 1].numpy()
    y = y.numpy()
    pred = (prob >= threshold).astype(int)
    tn, fp, fn, tp = confusion_matrix(y, pred, labels=[0, 1]).ravel()
    return {
        "n": int(len(y)),
        "accuracy": float((tp + tn) / len(y)),
        "sensitivity_cancer_recall": float(tp / max(tp + fn, 1)),
        "specificity_non_cancer_recall": float(tn / max(tn + fp, 1)),
        "precision_cancer": float(tp / max(tp + fp, 1)),
        "auc": float(roc_auc_score(y, prob)) if len(set(y.tolist())) == 2 else None,
        "confusion_matrix": {"true_non_cancer_pred_non_cancer": int(tn), "true_non_cancer_pred_cancer": int(fp),
                             "true_cancer_pred_non_cancer": int(fn), "true_cancer_pred_cancer": int(tp)},
    }


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--modality", choices=MODALITIES, required=True)
    ap.add_argument("--data-dir", default="data")
    ap.add_argument("--out-dir", default="models")
    ap.add_argument("--arch", default="resnet18", choices=["resnet18", "resnet50"])
    ap.add_argument("--img-size", type=int, default=224)
    ap.add_argument("--epochs", type=int, default=25)
    ap.add_argument("--batch-size", type=int, default=32)
    ap.add_argument("--lr", type=float, default=3e-4)
    ap.add_argument("--patience", type=int, default=6, help="early-stop after this many epochs without improvement")
    ap.add_argument("--workers", type=int, default=0 if os.name == "nt" else 2,
                    help="0 is fastest to start on Windows")
    ap.add_argument("--seed", type=int, default=42)
    args = ap.parse_args()

    torch.manual_seed(args.seed)
    np.random.seed(args.seed)
    device = get_device()
    print(f"device: {device}")

    paths, labels = list_samples(args.data_dir, args.modality)
    counts = np.bincount(labels, minlength=2)
    print(f"{args.modality}: {dict(zip(CLASS_NAMES, counts.tolist()))} images")
    split = stratified_split(paths, labels, seed=args.seed)
    for k, (p, y) in split.items():
        print(f"  {k}: {len(p)} images  {dict(zip(CLASS_NAMES, np.bincount(y, minlength=2).tolist()))}")

    def loader(name, tfm, shuffle):
        ds = ImageDataset(*split[name], tfm, args.modality)
        return DataLoader(ds, batch_size=args.batch_size, shuffle=shuffle, num_workers=args.workers,
                          pin_memory=device.type == "cuda")

    train_dl = loader("train", train_transform(args.img_size), True)
    val_dl = loader("val", eval_transform(args.img_size), False)
    test_dl = loader("test", eval_transform(args.img_size), False)

    model = build_model(args.arch).to(device)
    ytr = np.array(split["train"][1])
    class_w = torch.tensor(len(ytr) / (2.0 * np.bincount(ytr, minlength=2)), dtype=torch.float32).to(device)
    criterion = nn.CrossEntropyLoss(weight=class_w)  # keeps the smaller class from being ignored
    optim = torch.optim.AdamW(model.parameters(), lr=args.lr, weight_decay=1e-4)
    sched = torch.optim.lr_scheduler.CosineAnnealingLR(optim, T_max=args.epochs)

    best_score, best_state, bad = -1.0, None, 0
    for epoch in range(1, args.epochs + 1):
        t0 = time.time()
        model.train()
        run_loss = 0.0
        for x, y in train_dl:
            x, y = x.to(device), y.to(device)
            optim.zero_grad()
            loss = criterion(model(x), y)
            loss.backward()
            optim.step()
            run_loss += loss.item() * len(y)
        sched.step()

        v_logits, v_y = collect_logits(model, val_dl, device)
        vm = evaluate(v_logits, v_y, 1.0)
        # balanced accuracy: rewards catching cancer AND correctly clearing non-cancer
        score = 0.5 * (vm["sensitivity_cancer_recall"] + vm["specificity_non_cancer_recall"])
        print(f"epoch {epoch:02d}  loss {run_loss / len(ytr):.4f}  val bal-acc {score:.3f}  "
              f"sens {vm['sensitivity_cancer_recall']:.3f}  spec {vm['specificity_non_cancer_recall']:.3f}  "
              f"({time.time() - t0:.0f}s)")
        if score > best_score:
            best_score, best_state, bad = score, copy.deepcopy(model.state_dict()), 0
        else:
            bad += 1
            if bad >= args.patience:
                print("early stopping")
                break

    model.load_state_dict(best_state)
    v_logits, v_y = collect_logits(model, val_dl, device)
    temperature = fit_temperature(v_logits, v_y)
    t_logits, t_y = collect_logits(model, test_dl, device)
    test = evaluate(t_logits, t_y, temperature)
    val = evaluate(v_logits, v_y, temperature)

    print("\n=== held-out TEST set (never used for training or model selection) ===")
    print(json.dumps(test, indent=2))

    metrics = json.loads(json.dumps({"val": val, "test": test, "temperature": temperature,
                                     "class_counts": dict(zip(CLASS_NAMES, counts.tolist()))}))
    out = Path(args.out_dir)
    out.mkdir(parents=True, exist_ok=True)
    torch.save(
        {"state_dict": {k: v.cpu() for k, v in model.state_dict().items()}, "arch": args.arch,
         "img_size": args.img_size, "temperature": temperature, "class_names": CLASS_NAMES, "metrics": metrics},
        out / f"{args.modality}.pt",
    )
    (out / f"{args.modality}_metrics.json").write_text(json.dumps(metrics, indent=2))
    print(f"\nsaved {out / (args.modality + '.pt')}")


if __name__ == "__main__":
    main()
