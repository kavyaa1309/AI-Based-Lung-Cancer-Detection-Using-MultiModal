"""Turn a Grad-CAM map into suspected-nodule regions and an overlay PNG (numpy/OpenCV only)."""
from __future__ import annotations

import base64

import cv2
import numpy as np

MAX_OVERLAY_EDGE = 768


def upsample(cam: np.ndarray, size: int = 224) -> np.ndarray:
    """Smoothly upsample a coarse CAM (e.g. 7x7) to size x size, clipped to [0,1]."""
    up = cv2.resize(cam.astype(np.float32), (size, size), interpolation=cv2.INTER_CUBIC)
    return np.clip(up, 0.0, 1.0)


def describe_location(cx: float, cy: float) -> str:
    """Rough anatomical zone from a normalised centroid (0..1).

    Assumes standard radiological display (patient's right on the image's left)
    and a roughly centred chest. This is a heuristic label, not a measurement.
    """
    zone = "upper" if cy < 1 / 3 else "middle" if cy < 2 / 3 else "lower"
    if 0.42 <= cx <= 0.58:
        return f"{zone} zone, central (hilar/mediastinal)"
    return f"{zone} zone, {'right' if cx < 0.5 else 'left'} lung"


def find_regions(cam: np.ndarray, rel_thresh: float = 0.55, min_area_frac: float = 0.004, top_k: int = 3):
    """cam: HxW float array in [0,1]. Returns up to top_k suspected regions, strongest first."""
    h, w = cam.shape
    mask = (cam >= rel_thresh).astype(np.uint8)
    mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
    n, labels, stats, cents = cv2.connectedComponentsWithStats(mask, connectivity=8)
    regions = []
    for i in range(1, n):
        x, y, bw, bh, area = (int(v) for v in stats[i])
        if area < min_area_frac * h * w:
            continue
        cx, cy = cents[i][0] / w, cents[i][1] / h
        regions.append(
            {
                "box": (x, y, bw, bh),
                "score": float(cam[labels == i].mean()),
                "location": describe_location(cx, cy),
            }
        )
    regions.sort(key=lambda r: r["score"], reverse=True)
    regions = regions[:top_k]
    for k, r in enumerate(regions, start=1):
        r["id"] = k
    return regions


def render_overlay(cam: np.ndarray, regions: list[dict], out_size: tuple[int, int]) -> str:
    """Transparent RGBA PNG (data URL) with the heat layer + numbered boxes.

    It is returned at the ORIGINAL image aspect ratio so the front-end can stack it on top of the
    uploaded image with identical object-fit and get a perfectly aligned overlay.
    out_size = (width, height) of the original image.
    """
    ow, oh = out_size
    scale = min(1.0, MAX_OVERLAY_EDGE / max(ow, oh))
    W, H = max(1, int(ow * scale)), max(1, int(oh * scale))

    heat = cv2.resize(cam.astype(np.float32), (W, H), interpolation=cv2.INTER_CUBIC)
    heat = np.clip(heat, 0, 1)
    color_bgr = cv2.applyColorMap((heat * 255).astype(np.uint8), cv2.COLORMAP_JET)
    alpha = np.where(heat >= 0.35, np.clip(heat, 0, 1) * 0.75, 0.0)  # hide weak activations
    rgba = np.dstack([color_bgr, (alpha * 255).astype(np.uint8)])  # BGRA

    ch, cw = cam.shape
    sx, sy = W / cw, H / ch
    for r in regions:
        x, y, bw, bh = r["box"]
        p1, p2 = (int(x * sx), int(y * sy)), (int((x + bw) * sx), int((y + bh) * sy))
        cv2.rectangle(rgba, p1, p2, (255, 255, 255, 255), 2)
        cv2.putText(rgba, str(r["id"]), (p1[0] + 4, max(p1[1] + 18, 18)), cv2.FONT_HERSHEY_SIMPLEX, 0.6,
                    (255, 255, 255, 255), 2, cv2.LINE_AA)

    ok, buf = cv2.imencode(".png", rgba)
    if not ok:
        raise RuntimeError("Could not encode overlay")
    return "data:image/png;base64," + base64.b64encode(buf.tobytes()).decode()
