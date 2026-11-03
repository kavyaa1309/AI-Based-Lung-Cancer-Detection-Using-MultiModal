
from pathlib import Path
import random
import json
import copy

import torch
from torch import nn
from torch.utils.data import DataLoader, random_split
from torchvision import transforms, models
from PIL import Image

DATA_DIR = Path("data")
MODEL_DIR = Path("models")
MODEL_DIR.mkdir(exist_ok=True)

IMAGE_SIZE = 224
BATCH_SIZE = 8
EPOCHS = 8
SEED = 42

random.seed(SEED)
torch.manual_seed(SEED)
device = torch.device("cpu")

transform = transforms.Compose([
    transforms.Grayscale(num_output_channels=3),
    transforms.Resize((IMAGE_SIZE, IMAGE_SIZE)),
    transforms.ToTensor(),
    transforms.Normalize(
        mean=[0.485, 0.456, 0.406],
        std=[0.229, 0.224, 0.225],
    ),
])

extensions = {".png", ".jpg", ".jpeg", ".bmp", ".tif", ".tiff", ".webp"}

class ModalityDataset(torch.utils.data.Dataset):
    def __init__(self, samples):
        self.samples = samples

    def __len__(self):
        return len(self.samples)

    def __getitem__(self, index):
        path, label = self.samples[index]
        with Image.open(path) as im:
            image = transform(im.convert("RGB"))
        return image, label

# Labels: CT=0, X-ray=1, invalid image=2.
samples = []

for folder, label in [("ct", 0), ("xray", 1)]:
    root = DATA_DIR / folder
    if not root.exists():
        raise RuntimeError(f"Missing dataset folder: {root}")

    for path in root.rglob("*"):
        if path.is_file() and path.suffix.lower() in extensions:
            samples.append((path, label))

invalid_root = DATA_DIR / "other" / "invalid_images"
if not invalid_root.exists():
    raise RuntimeError(f"Missing invalid image folder: {invalid_root}")

for path in invalid_root.rglob("*"):
    if path.is_file() and path.suffix.lower() in extensions:
        samples.append((path, 2))

if not samples:
    raise RuntimeError("No images found in the dataset folders.")

counts = {
    "ct": sum(label == 0 for _, label in samples),
    "xray": sum(label == 1 for _, label in samples),
    "invalid": sum(label == 2 for _, label in samples),
}
print("Dataset counts:", counts)

# Exclude unreadable files before training.
clean_samples = []
for path, label in samples:
    try:
        with Image.open(path) as im:
            im.verify()
        clean_samples.append((path, label))
    except Exception:
        print("Skipping unreadable image:", path)

samples = clean_samples

if len({label for _, label in samples}) != 3:
    raise RuntimeError("Training requires CT, X-ray, and invalid images.")

# Split while ensuring the small invalid class appears in every split.
by_label = {
    label: [(p, y) for p, y in samples if y == label]
    for label in range(3)
}
train_samples, val_samples, test_samples = [], [], []

for label, items in by_label.items():
    random.Random(SEED + label).shuffle(items)
    n = len(items)
    if n < 5:
        raise RuntimeError(
            f"Class {label} needs at least 5 images; found {n}."
        )

    n_test = max(1, round(n * 0.15))
    n_val = max(1, round(n * 0.15))
    n_train = n - n_val - n_test

    train_samples.extend(items[:n_train])
    val_samples.extend(items[n_train:n_train + n_val])
    test_samples.extend(items[n_train + n_val:])

train_set = ModalityDataset(train_samples)
val_set = ModalityDataset(val_samples)
test_set = ModalityDataset(test_samples)

train_loader = DataLoader(train_set, batch_size=BATCH_SIZE, shuffle=True)
val_loader = DataLoader(val_set, batch_size=BATCH_SIZE)
test_loader = DataLoader(test_set, batch_size=BATCH_SIZE)

model = models.resnet18(weights=None)
model.fc = nn.Linear(model.fc.in_features, 3)
model.to(device)

criterion = nn.CrossEntropyLoss()
optimizer = torch.optim.Adam(model.parameters(), lr=0.0003)

best_val_acc = -1.0
best_state = copy.deepcopy(model.state_dict())

for epoch in range(EPOCHS):
    model.train()
    total_loss = 0.0

    for images, labels in train_loader:
        images, labels = images.to(device), labels.to(device)
        optimizer.zero_grad()
        outputs = model(images)
        loss = criterion(outputs, labels)
        loss.backward()
        optimizer.step()
        total_loss += loss.item() * images.size(0)

    model.eval()
    correct, total = 0, 0

    with torch.no_grad():
        for images, labels in val_loader:
            predictions = model(images.to(device)).argmax(dim=1)
            correct += (predictions.cpu() == labels).sum().item()
            total += labels.size(0)

    val_acc = correct / total if total else 0.0
    print(
        f"Epoch {epoch + 1}/{EPOCHS} "
        f"loss={total_loss / len(train_set):.4f} "
        f"val_accuracy={val_acc:.4f}"
    )

    if val_acc > best_val_acc:
        best_val_acc = val_acc
        best_state = copy.deepcopy(model.state_dict())

model.load_state_dict(best_state)
model.eval()

correct, total = 0, 0
with torch.no_grad():
    for images, labels in test_loader:
        predictions = model(images.to(device)).argmax(dim=1)
        correct += (predictions.cpu() == labels).sum().item()
        total += labels.size(0)

test_acc = correct / total if total else 0.0

torch.save({
    "state_dict": model.state_dict(),
    "classes": ["ct", "xray", "invalid"],
    "image_size": IMAGE_SIZE,
}, MODEL_DIR / "modality.pt")

metrics = {
    "class_counts": counts,
    "train_images": len(train_set),
    "validation_images": len(val_set),
    "test_images": len(test_set),
    "best_validation_accuracy": best_val_acc,
    "test_accuracy": test_acc,
}

(MODEL_DIR / "modality_metrics.json").write_text(
    json.dumps(metrics, indent=2),
    encoding="utf-8",
)

print("\nTraining complete.")
print(json.dumps(metrics, indent=2))
print("Saved model:", MODEL_DIR / "modality.pt")
