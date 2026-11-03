"""Convert the downloaded Kaggle folders into the layout train.py expects:

    data/ct/{cancerous,non_cancerous}/*.png
    data/xray/{cancerous,non_cancerous}/*.png

CT   : normal            -> non_cancerous
       adenocarcinoma / large.cell.carcinoma / squamous.cell.carcinoma -> cancerous
X-ray: NIH label contains Nodule or Mass -> cancerous (suspicious lesion)
       label == "No Finding"             -> non_cancerous
       (other findings such as pneumonia are skipped so the negative class is clean)

Exact duplicate files are removed (the CT set contains copies that would otherwise leak between
train and test).
"""
from __future__ import annotations

import argparse
import hashlib
import random
import shutil
from pathlib import Path

from common import IMAGE_EXTS

CT_POSITIVE_PREFIXES = ("adenocarcinoma", "large.cell", "large cell", "large_cell", "squamous")


def md5(path: Path) -> str:
    return hashlib.md5(path.read_bytes()).hexdigest()


def copy_unique(items: list[tuple[Path, str]], out_root: Path) -> dict[str, int]:
    """items = [(src, 'cancerous'|'non_cancerous')]; de-duplicates by file content."""
    seen: dict[str, str] = {}
    counts = {"cancerous": 0, "non_cancerous": 0}
    dups = conflicts = 0
    for src, cls in items:
        h = md5(src)
        if h in seen:
            dups += 1
            conflicts += seen[h] != cls
            continue
        seen[h] = cls
        dst = out_root / cls / f"{h[:16]}{src.suffix.lower()}"
        dst.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(src, dst)
        counts[cls] += 1
    print(f"  removed {dups} exact duplicate files ({conflicts} had conflicting labels; first label kept)")
    return counts


def prepare_ct(raw: Path, out: Path):
    items, skipped = [], 0
    for p in sorted(raw.rglob("*")):
        if p.suffix.lower() not in IMAGE_EXTS:
            continue
        parts = [x.lower() for x in p.relative_to(raw).parts[:-1]]
        if any(x.startswith("normal") for x in parts):
            items.append((p, "non_cancerous"))
        elif any(x.startswith(CT_POSITIVE_PREFIXES) for x in parts):
            items.append((p, "cancerous"))
        else:
            skipped += 1
    print(f"CT: found {len(items)} labelled images ({skipped} skipped: unknown folder)")
    return items


def prepare_xray(raw: Path, max_neg_ratio: float, seed: int):
    import pandas as pd

    csvs = []
    for c in raw.rglob("*.csv"):
        cols = pd.read_csv(c, nrows=1).columns
        if "Image Index" in cols and "Finding Labels" in cols:
            csvs.append(c)
    if not csvs:
        raise SystemExit(f"No NIH label CSV (with 'Image Index' and 'Finding Labels') found under {raw}")
    df = pd.read_csv(csvs[0])
    index = {p.name: p for p in raw.rglob("*") if p.suffix.lower() in IMAGE_EXTS}

    pos, neg = [], []
    for name, labels in zip(df["Image Index"], df["Finding Labels"]):
        if name not in index:
            continue
        tags = str(labels).split("|")
        if "Nodule" in tags or "Mass" in tags:
            pos.append((index[name], "cancerous"))
        elif tags == ["No Finding"]:
            neg.append((index[name], "non_cancerous"))
    random.Random(seed).shuffle(neg)
    neg = neg[: int(max_neg_ratio * max(len(pos), 1))]
    print(f"X-ray: {len(pos)} nodule/mass images, {len(neg)} 'No Finding' images (cap ratio {max_neg_ratio}:1)")
    return pos + neg


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--raw-dir", default="raw")
    ap.add_argument("--data-dir", default="data")
    ap.add_argument("--only", choices=["ct", "xray"])
    ap.add_argument("--max-neg-ratio", type=float, default=3.0, help="X-ray: max non-cancerous per cancerous image")
    ap.add_argument("--seed", type=int, default=42)
    args = ap.parse_args()

    for mod in ("ct", "xray"):
        if args.only and mod != args.only:
            continue
        raw = Path(args.raw_dir) / mod
        if not raw.is_dir():
            print(f"[skip] {raw} not found (run download_dataset.py)")
            continue
        out = Path(args.data_dir) / mod
        if out.exists():
            shutil.rmtree(out)
        items = prepare_ct(raw, out) if mod == "ct" else prepare_xray(raw, args.max_neg_ratio, args.seed)
        counts = copy_unique(items, out)
        print(f"  -> {out}: {counts}\n")
    print("Next: python train.py --modality ct   (and/or --modality xray)")


if __name__ == "__main__":
    main()
