"""Fuse per-image model outputs into one study-level result (pure python/numpy, no torch)."""
from __future__ import annotations

import numpy as np

from localize import find_regions, render_overlay, upsample

THRESHOLD = 0.5  # calibrated cancer probability at/above which the study is called cancerous


def build_response(per_image: dict[str, dict]) -> dict:
    """per_image[slot] = {"prob": float, "cam": 7x7-ish np.ndarray, "size": (width, height)}.

    - study probability = mean of the per-image cancer probabilities
    - NON-cancerous study  -> no regions, no heatmaps (nothing is highlighted)
    - cancerous study      -> heatmap + numbered regions only for images that individually look suspicious
    """
    combined = float(np.mean([v["prob"] for v in per_image.values()]))
    cancer = combined >= THRESHOLD
    votes = {v["prob"] >= THRESHOLD for v in per_image.values()}
    discordant = len(votes) > 1  # one modality looks cancerous, the other does not

    images, regions_out = {}, []
    for slot, v in per_image.items():
        flagged = bool(cancer and v["prob"] >= THRESHOLD)
        heat, regs = None, []
        if flagged:
            cam = upsample(v["cam"])
            regs = find_regions(cam)
            heat = render_overlay(cam, regs, v["size"])
        images[slot] = {
            "cancer_probability": round(v["prob"], 4),
            "flagged": flagged,
            "heatmap": heat,
            "regions": [{"id": r["id"], "location": r["location"], "score": round(r["score"], 3)} for r in regs],
        }
        regions_out += [
            {"modality": slot, "id": r["id"], "location": r["location"], "score": round(r["score"], 3)} for r in regs
        ]

    return {
        "label": "cancerous" if cancer else "non_cancerous",
        "prediction": "Lung Cancer Detected" if cancer else "No Cancer Detected (Non-Cancerous)",
        "cancer_probability": round(combined, 4),
        "confidence": round((combined if cancer else 1.0 - combined) * 100, 1),
        "regions": regions_out,
        "images": images,
        "modalities": list(per_image.keys()),
        "discordant": discordant,
    }
