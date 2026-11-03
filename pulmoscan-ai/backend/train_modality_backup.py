
from pathlib import Path
import random
import json
import copy

import torch
from torch import nn
from torch.utils.data import DataLoader, random_split
from torchvision import datasets, transforms, models

# Dataset folders
DATA_DIR = Path("data")
MODEL_DIR = Path("models")
MODEL_DIR.mkdir(exist_ok=True)

IMAGE_SIZE = 224
BATCH_SIZE = 16
EPOCHS = 5
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

# Parent folders define modality labels:
# data/ct = 0, data/xray = 1
dataset = datasets.ImageFolder(
    root=str(DATA_DIR),
    transform=transform,
    is_valid_file=lambda p: Path(p).suffix.lower()
    in {".png", ".jpg", ".jpeg", ".bmp", ".tif", ".tiff", ".webp"},
)

# Keep only the CT and X-ray folders.
allowed = {"ct", "xray"}
samples = [
    (path, label)
    for path, label in dataset.samples
    if Path(path).parent.parent.name.lower() in allowed
]

if not samples:
    raise RuntimeError(
        "No images found. Expected data/ct and data/xray folders."
    )

# Rebuild a dataset with modality-level labels.
from PIL import Image

class ModalityDataset(torch.utils.data.Dataset):
    def __init__(self, samples):
        self.samples = samples

    def __len__(self):
        return len(self.samples)

    def __getitem__(self, index):
        path, _ = self.samples[index]
        image = Image.open(path).convert("L")
        image = transform(image)
        label = 0 if Path(path).parent.parent.name.lower() == "ct" else 1
        return image, label

modality_dataset = ModalityDataset(samples)

# Split into train, validation, and test sets.
n = len(modality_dataset)
n_train = int(n * 0.70)
n_val = int(n * 0.15)
n_test = n - n_train - n_val

train_set, val_set, test_set = random_split(
    modality_dataset,
    [n_train, n_val, n_test],
    generator=torch.Generator().manual_seed(SEED),
)

train_loader = DataLoader(train_set, batch_size=BATCH_SIZE, shuffle=True)
val_loader = DataLoader(val_set, batch_size=BATCH_SIZE)
test_loader = DataLoader(test_set, batch_size=BATCH_SIZE)

# Train a separate binary modality classifier.
model = models.resnet18(weights=None)
model.fc = nn.Linear(model.fc.in_features, 2)
model.to(device)

criterion = nn.CrossEntropyLoss()
optimizer = torch.optim.Adam(model.parameters(), lr=0.0005)

best_val_acc = 0.0
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
    correct = 0
    total = 0

    with torch.no_grad():
        for images, labels in val_loader:
            outputs = model(images.to(device))
            predictions = outputs.argmax(dim=1)
            correct += (predictions.cpu() == labels).sum().item()
            total += labels.size(0)

    val_acc = correct / total if total else 0.0
    avg_loss = total_loss / len(train_set)

    print(
        f"Epoch {epoch + 1}/{EPOCHS} "
        f"loss={avg_loss:.4f} val_accuracy={val_acc:.4f}"
    )

    if val_acc > best_val_acc:
        best_val_acc = val_acc
        best_state = copy.deepcopy(model.state_dict())

model.load_state_dict(best_state)
model.eval()

correct = 0
total = 0

with torch.no_grad():
    for images, labels in test_loader:
        predictions = model(images.to(device)).argmax(dim=1)
        correct += (predictions.cpu() == labels).sum().item()
        total += labels.size(0)

test_acc = correct / total if total else 0.0

torch.save({
    "state_dict": model.state_dict(),
    "classes": ["ct", "xray"],
    "image_size": IMAGE_SIZE,
}, MODEL_DIR / "modality.pt")

metrics = {
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
