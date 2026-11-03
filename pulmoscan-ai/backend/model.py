"""Model definition, Grad-CAM and the Predictor used by the API (needs torch + torchvision)."""
from __future__ import annotations

import threading
from pathlib import Path

import numpy as np
import torch
import torch.nn as nn
from torchvision import models, transforms

IMAGENET_MEAN = (0.485, 0.456, 0.406)
IMAGENET_STD = (0.229, 0.224, 0.225)


def get_device() -> torch.device:
    if torch.cuda.is_available():
        return torch.device("cuda")
    if getattr(torch.backends, "mps", None) and torch.backends.mps.is_available():
        return torch.device("mps")
    return torch.device("cpu")


def build_model(arch: str = "resnet18", pretrained: bool = True) -> nn.Module:
    """ImageNet-pretrained ResNet with a 2-class head (0 = non_cancerous, 1 = cancerous)."""
    ctors = {
        "resnet18": (models.resnet18, models.ResNet18_Weights.IMAGENET1K_V1),
        "resnet50": (models.resnet50, models.ResNet50_Weights.IMAGENET1K_V2),
    }
    if arch not in ctors:
        raise ValueError(f"arch must be one of {list(ctors)}")
    ctor, weights = ctors[arch]
    try:
        model = ctor(weights=weights if pretrained else None)
    except Exception as exc:  # e.g. no internet for the weight download
        print(f"[warn] could not load ImageNet weights ({exc}); training from scratch (expect lower accuracy).")
        model = ctor(weights=None)
    model.fc = nn.Linear(model.fc.in_features, 2)
    return model


def train_transform(size: int):
    return transforms.Compose(
        [
            transforms.Resize((size, size)),
            # scale/shift/rotation jitter so the model cannot rely on body size or framing
            transforms.RandomAffine(degrees=10, translate=(0.08, 0.08), scale=(0.8, 1.15)),
            transforms.ColorJitter(brightness=0.3, contrast=0.4),
            transforms.ToTensor(),
            transforms.Normalize(IMAGENET_MEAN, IMAGENET_STD),
        ]
    )


def eval_transform(size: int):
    # Plain resize of the WHOLE image (no crop) so the Grad-CAM maps back onto the full picture.
    return transforms.Compose(
        [transforms.Resize((size, size)), transforms.ToTensor(), transforms.Normalize(IMAGENET_MEAN, IMAGENET_STD)]
    )


class GradCAM:
    """Grad-CAM on a conv block. Uses a tensor hook so it also works with in-place ReLUs."""

    def __init__(self, layer: nn.Module):
        self.acts: torch.Tensor | None = None
        self.grads: torch.Tensor | None = None
        layer.register_forward_hook(self._on_forward)

    def _on_forward(self, module, inputs, output):
        self.acts = output.detach()
        if output.requires_grad:
            output.register_hook(lambda g: setattr(self, "grads", g.detach()))

    def compute(self) -> np.ndarray:
        assert self.acts is not None and self.grads is not None, "run forward + backward first"
        weights = self.grads.mean(dim=(2, 3), keepdim=True)
        cam = torch.relu((weights * self.acts).sum(dim=1))[0]
        cam = cam / cam.max() if float(cam.max()) > 0 else torch.zeros_like(cam)
        return cam.cpu().numpy().astype(np.float32)


class Predictor:
    """Loads models/<modality>.pt and returns calibrated cancer probability + Grad-CAM."""

    def __init__(self, ckpt_path: str | Path, device: torch.device | None = None):
        self.device = device or get_device()
        ckpt = torch.load(str(ckpt_path), map_location="cpu", weights_only=True)
        self.arch: str = ckpt["arch"]
        self.size: int = ckpt["img_size"]
        self.temperature: float = float(ckpt.get("temperature", 1.0))
        self.metrics: dict = ckpt.get("metrics", {})
        self.model = build_model(self.arch, pretrained=False)
        self.model.load_state_dict(ckpt["state_dict"])
        self.model.to(self.device).eval()
        self._cam = GradCAM(self.model.layer4[-1])
        self._tfm = eval_transform(self.size)
        self._lock = threading.Lock()  # hooks keep per-call state

    def analyze(self, img) -> dict:
        x = self._tfm(img).unsqueeze(0).to(self.device)
        with self._lock, torch.enable_grad():
            self.model.zero_grad(set_to_none=True)
            logits = self.model(x)
            prob = float(torch.softmax(logits.detach() / self.temperature, dim=1)[0, 1])
            logits[0, 1].backward()  # gradient of the "cancerous" logit
            cam = self._cam.compute()
        return {"prob": prob, "cam": cam}
