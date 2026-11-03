"""FastAPI server:  uvicorn app:app --port 8000

POST /api/analyze  (multipart: `ct` and/or `xray` image files)  ->  study-level result JSON
GET  /api/health   ->  which trained models are loaded + their held-out test metrics
"""
from __future__ import annotations

import os
from pathlib import Path

from fastapi import FastAPI, File, HTTPException, UploadFile
from pydantic import BaseModel
import database
from fastapi.middleware.cors import CORSMiddleware

from common import MODALITIES, load_image, validate_medical_image
from model import Predictor
from pipeline import build_response
import torch
from torch import nn
from torchvision import models, transforms
from PIL import Image

MODEL_DIR = Path(os.environ.get("MODEL_DIR", Path(__file__).parent / "models"))
MAX_BYTES = 30 * 1024 * 1024
MODALITY_MODEL_PATH = MODEL_DIR / "modality.pt"
MODALITY_IMAGE_SIZE = 224
class PatientLogin(BaseModel):
    patient_id: str
    name: str
    age: int
    sex: str

app = FastAPI(title="Lung AI Vision API")
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=os.environ.get("CORS_ORIGIN_REGEX", r"https?://(localhost|127\.0\.0\.1)(:\d+)?"),
    allow_methods=["*"],
    allow_headers=["*"],
)

_predictors: dict[str, Predictor] = {}
_modality_model = None

_modality_transform = transforms.Compose([
    transforms.Grayscale(num_output_channels=3),
    transforms.Resize((MODALITY_IMAGE_SIZE, MODALITY_IMAGE_SIZE)),
    transforms.ToTensor(),
    transforms.Normalize(
        mean=[0.485, 0.456, 0.406],
        std=[0.229, 0.224, 0.225],
    ),
])


def get_modality_model():
    global _modality_model

    if _modality_model is None:
        if not MODALITY_MODEL_PATH.exists():
            raise HTTPException(
                status_code=503,
                detail="Image-type validation model is missing.",
            )

        checkpoint = torch.load(
            MODALITY_MODEL_PATH,
            map_location="cpu",
            weights_only=True,
        )

        model = models.resnet18(weights=None)
        model.fc = nn.Linear(model.fc.in_features, 3)
        model.load_state_dict(checkpoint["state_dict"])
        model.eval()
        _modality_model = model

    return _modality_model

def check_image_modality(img: Image.Image, expected_modality: str):
    model = get_modality_model()
    tensor = _modality_transform(img).unsqueeze(0)

    with torch.no_grad():
        probabilities = torch.softmax(model(tensor), dim=1)[0]

    predicted_index = int(probabilities.argmax().item())
    classes = ["ct", "xray", "invalid"]

    if predicted_index >= len(classes):
        raise HTTPException(
            status_code=400,
            detail="Incorrect image. Please upload a valid CT scan or chest X-ray.",
        )

    predicted_modality = classes[predicted_index]
    confidence = float(probabilities[predicted_index].item())

    if predicted_modality == "invalid":
        raise HTTPException(
            status_code=400,
            detail="Incorrect image. Please upload a valid CT scan or chest X-ray.",
        )

    if confidence < 0.90:
        raise HTTPException(
            status_code=400,
            detail="Image type could not be verified. Please upload a clear CT scan or chest X-ray.",
        )

    if predicted_modality != expected_modality:
        expected_name = "CT scan" if expected_modality == "ct" else "chest X-ray"
        uploaded_name = "CT scan" if predicted_modality == "ct" else "chest X-ray"

        raise HTTPException(
            status_code=400,
            detail=(
                f"Incorrect image type: this appears to be a {uploaded_name}, "
                f"but the selected section requires a {expected_name}. "
                "Please upload the correct image."
            ),
        )


    # Avoid making a decision when the classifier is uncertain.
    if confidence < 0.90:
        raise HTTPException(
            status_code=400,
            detail=(
                "Image type could not be verified confidently. "
                "Please upload a clear CT scan or chest X-ray."
            ),
        )

    if predicted_modality != expected_modality:
        expected_name = "CT scan" if expected_modality == "ct" else "chest X-ray"
        uploaded_name = "CT scan" if predicted_modality == "ct" else "chest X-ray"

        raise HTTPException(
            status_code=400,
            detail=(
                f"Incorrect image type: this appears to be a {uploaded_name}, "
                f"but the selected section requires a {expected_name}. "
                f"Please upload the correct image."
            ),
        )
database.init_database()


@app.post("/api/patient/login")
def patient_login(data: PatientLogin):
    patient_id = data.patient_id.strip().upper()

    if not database.validate_patient_id(patient_id):
        raise HTTPException(
            status_code=400,
            detail="Invalid Patient ID. Patient ID must be in the format PUM001."
        )

    patient = database.verify_patient(
        patient_id,
        data.name,
        data.age,
        data.sex
    )

    if patient is None:
        raise HTTPException(
            status_code=401,
            detail="Patient details do not match the registered Patient ID."
        )

    return {
        "success": True,
        "message": "Patient verified successfully.",
        "patient": patient
    }


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
            validate_medical_image(img, slot)
            check_image_modality(img, slot)
        except ValueError as exc:
            raise HTTPException(400, f"{slot}: {exc}")

        out = get_predictor(slot).analyze(img)
        per_image[slot] = {
            "prob": out["prob"],
            "cam": out["cam"],
            "size": img.size,
        }

    if not per_image:
        raise HTTPException(400, "Upload at least one image (ct and/or xray).")
    return build_response(per_image)
