"""Download the public datasets from Kaggle into raw/.

Setup once:  create a Kaggle API token (kaggle.com -> Settings -> API -> Create New Token),
put kaggle.json in ~/.kaggle/ (chmod 600), then:

    python download_dataset.py            # both
    python download_dataset.py --only ct
"""
import argparse
import subprocess
import sys
from pathlib import Path

DATASETS = {
    # 4 classes: adenocarcinoma / large.cell.carcinoma / squamous.cell.carcinoma / normal  (~1,000 CT images)
    "ct": ("mohamedhanyyy/chest-ctscan-images", "raw/ct"),
    # NIH ChestX-ray14 random 5% sample: 5,606 frontal X-rays + labels (Nodule, Mass, No Finding, ...)
    "xray": ("nih-chest-xrays/sample", "raw/xray"),
}

ap = argparse.ArgumentParser()
ap.add_argument("--only", choices=list(DATASETS))
args = ap.parse_args()

for key, (slug, dest) in DATASETS.items():
    if args.only and key != args.only:
        continue
    Path(dest).mkdir(parents=True, exist_ok=True)
    print(f"\n>>> downloading {slug} -> {dest}")
    r = subprocess.run(["kaggle", "datasets", "download", "-d", slug, "-p", dest, "--unzip"])
    if r.returncode != 0:
        sys.exit(f"Download failed for {slug}. Check ~/.kaggle/kaggle.json and that you accepted the dataset terms on kaggle.com.")
print("\nDone. Next: python prepare_dataset.py")
