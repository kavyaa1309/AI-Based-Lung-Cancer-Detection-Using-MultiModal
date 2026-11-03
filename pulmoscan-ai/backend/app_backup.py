"""FastAPI server:  uvicorn app:app --port 8000

POST /api/analyze  (multipart: `ct` and/or `xray` image files)  ->  study-level result JSON
GET  /api/health   ->  which trained models are loaded + their held-out test metrics
"""
from __future__ import annotations

import os
from pathlib import Path

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from common import MODALITIES, load_image
from model import Predictor
from pipeline import build_response

MODEL_DIR = Path(os.environ.get("MODEL_DIR", Path(__file__).parent / "models"))
MAX_BYTES = 30 * 1024 * 1024

app = FastAPI(title="Lung AI Vision API")
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=os.environ.get("CORS_ORIGIN_REGEX", r"https?://(localhost|127\.0\.0\.1)(:\d+)?"),
    allow_methods=["*"],
    allow_headers=["*"],
)

_predictors: dict[str, Predictor] = {}


def get_predictor(modality: str) -> Predictor:
    if modality not in _predictors:
        ckpt = MODEL_DIR / f"{modality}.pt"
        if not ckpt.exists():
            raise HTTPException(
                status_code=503,
                detail=(
                    f"No trained {modality.upper()} model found at {ckpt}. "
                    + (
                        "Double-click 1_train_model.bat in the project folder (or run: python prepare_local.py && python train.py --modality ct inside backend)."
                        if modality == "ct"
                        else "Only the CT model is trained from your dataset - upload a CT slice, or train an X-ray model "
                        "with an X-ray dataset (see backend/README.md)."
                    )
                ),
            )
        _predictors[modality] = Predictor(ckpt)
    return _predictors[modality]


@app.get("/api/health")
def health():
    status = {}
    for m in MODALITIES:
        ckpt = MODEL_DIR / f"{m}.pt"
        status[m] = {"trained": ckpt.exists()}
        if ckpt.exists():
            p = get_predictor(m)
            status[m]["test_metrics"] = p.metrics.get("test")
    return {"ok": True, "models": status}


@app.post("/api/analyze")
def analyze(ct: UploadFile | None = File(None), xray: UploadFile | None = File(None)):
    uploads = {"ct": ct, "xray": xray}
    per_image = {}
    for slot, f in uploads.items():
        if f is None:
            continue
        raw = f.file.read(MAX_BYTES + 1)
        if len(raw) > MAX_BYTES:
            raise HTTPException(413, f"{slot} file is larger than {MAX_BYTES // 2**20} MB")
        try:
            img = load_image(raw, slot)
        except ValueError as exc:
            raise HTTPException(400, f"{slot}: {exc}")
        out = get_predictor(slot).analyze(img)
        per_image[slot] = {"prob": out["prob"], "cam": out["cam"], "size": img.size}

    if not per_image:
        raise HTTPException(400, "Upload at least one image (ct and/or xray).")
    return build_response(per_image)
