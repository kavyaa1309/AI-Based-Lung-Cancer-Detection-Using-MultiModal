"""Shared helpers (no torch dependency, so they are cheap to import and test)."""
from __future__ import annotations

import io
from pathlib import Path

import numpy as np
from PIL import Image, ImageOps

MODALITIES = ("ct", "xray")
CLASS_NAMES = ["non_cancerous", "cancerous"]  # index 0 = non-cancerous, 1 = cancerous
IMAGE_EXTS = {".png", ".jpg", ".jpeg", ".bmp", ".tif", ".tiff", ".webp"}


# --------------------------------------------------------------------------- #
# Image loading
# --------------------------------------------------------------------------- #
def _is_dicom(raw: bytes, name: str = "") -> bool:
    return raw[128:132] == b"DICM" or name.lower().endswith(".dcm")


def _dicom_to_pil(raw: bytes, modality: str) -> Image.Image:
    try:
        import pydicom
    except ImportError as exc:  # pragma: no cover
        raise ValueError("DICOM upload needs `pip install pydicom`.") from exc

    ds = pydicom.dcmread(io.BytesIO(raw), force=True)
    arr = ds.pixel_array.astype(np.float32)
    if arr.ndim == 3 and arr.shape[-1] not in (3, 4):  # multi-frame -> middle slice
        arr = arr[arr.shape[0] // 2]
    if arr.ndim == 3:  # already colour
        arr = arr.mean(axis=-1)

    arr = arr * float(getattr(ds, "RescaleSlope", 1) or 1) + float(getattr(ds, "RescaleIntercept", 0) or 0)

    if modality == "ct":  # standard lung window (C -600, W 1500)
        lo, hi = -600 - 750, -600 + 750
    else:
        lo, hi = float(np.percentile(arr, 0.5)), float(np.percentile(arr, 99.5))
    arr = np.clip((arr - lo) / max(hi - lo, 1e-6), 0, 1)
    if str(getattr(ds, "PhotometricInterpretation", "")) == "MONOCHROME1":
        arr = 1.0 - arr
    return Image.fromarray((arr * 255).astype(np.uint8)).convert("RGB")


_VIRIDIS_TREE = None


def decolorize_ct(img: Image.Image) -> Image.Image:
    """Turn a false-colour (viridis) CT slice back into plain grey intensity.

    Some CT exports are colour-mapped. If only one class contains such images the network can learn
    "colourful = cancer". Every pixel is mapped to the nearest viridis colour -> its 0..255 intensity.
    Normal grey-scale slices are returned unchanged.
    """
    global _VIRIDIS_TREE
    import cv2
    from scipy.spatial import cKDTree

    rgb = np.asarray(img.convert("RGB"))
    a = rgb.astype(np.int16)
    if np.abs(a[..., 0] - a[..., 1]).mean() <= 2 and np.abs(a[..., 1] - a[..., 2]).mean() <= 2:
        return img.convert("RGB")  # already grey
    if _VIRIDIS_TREE is None:
        lut = cv2.applyColorMap(np.arange(256, dtype=np.uint8).reshape(256, 1), cv2.COLORMAP_VIRIDIS)
        _VIRIDIS_TREE = cKDTree(lut.reshape(256, 3)[:, ::-1].astype(np.float32))  # BGR -> RGB
    _, idx = _VIRIDIS_TREE.query(rgb.reshape(-1, 3).astype(np.float32))
    gray = idx.reshape(rgb.shape[:2]).astype(np.uint8)
    return Image.fromarray(gray).convert("RGB")


def mask_ct_body(img: Image.Image) -> Image.Image:
    """Blank everything outside the patient's body on a CT slice (same size out as in).

    Many CT exports carry burned-in text (hospital / patient name / date / slice info) and the scanner
    table. If those differ between the cancerous and non-cancerous training images, a network happily
    learns "which text is in the corner" instead of "is there a tumour" and then fails on new scans.
    Thin strokes (text, table line) are removed by a morphological opening, small leftovers are dropped,
    and the convex hull of the remaining large pieces (the body incl. the lungs) is kept. Image size is
    unchanged, so Grad-CAM overlays still line up with the original picture.
    """
    import cv2

    gray = np.asarray(img.convert("L"))
    h, w = gray.shape
    _, binary = cv2.threshold(gray, 35, 255, cv2.THRESH_BINARY)
    k = max(7, int(round(min(h, w) * 0.02)))  # ~10 px on 512 px images: wider than any text stroke
    opened = cv2.morphologyEx(binary, cv2.MORPH_OPEN, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (k, k)))
    n, labels, stats, _ = cv2.connectedComponentsWithStats(opened, connectivity=8)
    keep = [i for i in range(1, n) if stats[i, cv2.CC_STAT_AREA] >= 0.015 * h * w]
    if not keep:  # nothing found (unusual window / not a CT) -> leave the image alone
        return img
    pts = cv2.findNonZero(np.isin(labels, keep).astype(np.uint8))
    hull = cv2.convexHull(pts)
    mask = np.zeros((h, w), np.uint8)
    cv2.fillConvexPoly(mask, hull, 1)
    if mask.mean() > 0.9 or mask.mean() < 0.05:  # mask covers everything / nothing -> not usable
        return img
    mask = cv2.dilate(mask, np.ones((7, 7), np.uint8)).astype(bool)
    rgb = np.asarray(img.convert("RGB")).copy()
    rgb[~mask] = 0
    return Image.fromarray(rgb)

def validate_medical_image(img: Image.Image, modality: str) -> None:
    """Reject unreadable, blank, tiny, or extremely low-contrast images."""

    import cv2

    if modality not in MODALITIES:
        raise ValueError("Choose CT or X-ray as the image type.")

    gray = np.asarray(img.convert("L"))
    h, w = gray.shape

    if h < 128 or w < 128:
        raise ValueError(
            "Image resolution is too small. Upload a clearer medical scan."
        )

    if float(gray.std()) < 12:
        raise ValueError(
            "Image quality is insufficient or the image is blank. Upload another scan."
        )

    edges = cv2.Canny(gray, 50, 150)
    if float(np.count_nonzero(edges)) / edges.size < 0.001:
        raise ValueError(
            "Image details could not be detected. Upload a clear medical scan."
        )

def load_image(source: bytes | str | Path, modality: str = "xray") -> Image.Image:
    """Load PNG/JPG/DICOM into an RGB PIL image (CT slices also get text/table removed)."""
    img = _load_raw(source, modality)
    if modality != "ct":
        return img
    # grey-ify -> drop text/table -> stretch contrast so different window levels look alike
    return ImageOps.autocontrast(mask_ct_body(decolorize_ct(img)), cutoff=1)


def _load_raw(source: bytes | str | Path, modality: str = "xray") -> Image.Image:
    if isinstance(source, (str, Path)):
        path = Path(source)
        raw, name = path.read_bytes(), path.name
    else:
        raw, name = source, ""
    if _is_dicom(raw, name):
        return _dicom_to_pil(raw, modality)
    try:
        img = Image.open(io.BytesIO(raw))
        img.load()
    except Exception as exc:
        raise ValueError("File is not a readable image (use PNG, JPG or DICOM).") from exc
    if img.mode in ("I;16", "I"):  # 16-bit grayscale PNG/TIFF
        a = np.asarray(img, dtype=np.float32)
        a = (a - a.min()) / max(a.max() - a.min(), 1e-6)
        img = Image.fromarray((a * 255).astype(np.uint8))
    return img.convert("RGB")


# --------------------------------------------------------------------------- #
# Dataset listing + splitting
# --------------------------------------------------------------------------- #
def list_samples(data_dir: str | Path, modality: str) -> tuple[list[str], list[int]]:
    """Read data/<modality>/{non_cancerous,cancerous}/* -> (paths, labels)."""
    root = Path(data_dir) / modality
    paths: list[str] = []
    labels: list[int] = []
    for idx, cls in enumerate(CLASS_NAMES):
        folder = root / cls
        if not folder.is_dir():
            raise FileNotFoundError(
                f"Missing folder {folder}. Run download_dataset.py and prepare_dataset.py first (see README)."
            )
        files = sorted(p for p in folder.rglob("*") if p.suffix.lower() in IMAGE_EXTS)
        paths += [str(p) for p in files]
        labels += [idx] * len(files)
    return paths, labels


def stratified_split(paths, labels, val=0.15, test=0.15, seed=42):
    """70/15/15 stratified split. Returns dict of (paths, labels) for train/val/test."""
    from sklearn.model_selection import train_test_split

    counts = np.bincount(labels, minlength=2)
    if counts.min() < 10:
        raise ValueError(f"Need at least 10 images per class, got {dict(zip(CLASS_NAMES, counts.tolist()))}.")
    p_tr, p_rest, y_tr, y_rest = train_test_split(
        paths, labels, test_size=val + test, stratify=labels, random_state=seed
    )
    p_va, p_te, y_va, y_te = train_test_split(
        p_rest, y_rest, test_size=test / (val + test), stratify=y_rest, random_state=seed
    )
    return {"train": (p_tr, y_tr), "val": (p_va, y_va), "test": (p_te, y_te)}
