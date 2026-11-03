"""Turn YOUR dataset folder into the layout train.py expects.

    dataset/Lung Cancer Dataset/{train,test}/{Cancerous,Non-Cancerous}/*.jpg
        -->  data/ct/cancerous/*.jpg   and   data/ct/non_cancerous/*.jpg

    python prepare_local.py                       # uses ./dataset
    python prepare_local.py --src "D:/my/folder"  # any folder that has Cancerous / Non-Cancerous sub-folders

Why train + test are pooled and de-duplicated
---------------------------------------------
In the dataset you supplied almost every image in `test/` is a byte-for-byte copy of an image in `train/`
(188 of the 190 test files). Testing on those would report a fake ~100 % accuracy. So all images are pooled,
exact duplicates are dropped, and train.py makes a fresh 70/15/15 stratified split of the *unique* images.
"""
from __future__ import annotations

import argparse
import hashlib
import shutil
from collections import defaultdict
from pathlib import Path

from common import IMAGE_EXTS


def class_of(path: Path, root: Path) -> str | None:
    """Return 'cancerous' / 'non_cancerous' from any folder name on the way down from root."""
    for part in reversed(path.relative_to(root).parts[:-1]):
        p = part.lower().replace("_", "-").replace(" ", "-")
        if p.startswith(("non", "normal", "healthy", "benign", "no-")):
            return "non_cancerous"
        if p.startswith(("cancer", "malignant", "tumor", "tumour", "positive")):
            return "cancerous"
    return None


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--src", default="dataset")
    ap.add_argument("--out", default="data/ct")
    ap.add_argument("--modality-note", default="ct")
    args = ap.parse_args()

    src, out = Path(args.src), Path(args.out)
    if not src.is_dir():
        raise SystemExit(f"Dataset folder not found: {src.resolve()}")

    seen: dict[str, str] = {}
    counts = defaultdict(int)
    dropped_dupes = skipped = conflicts = 0
    if out.exists():
        shutil.rmtree(out)
    for cls in ("cancerous", "non_cancerous"):
        (out / cls).mkdir(parents=True, exist_ok=True)

    for f in sorted(p for p in src.rglob("*") if p.is_file() and p.suffix.lower() in IMAGE_EXTS):
        cls = class_of(f, src)
        if cls is None:
            skipped += 1
            continue
        digest = hashlib.md5(f.read_bytes()).hexdigest()
        if digest in seen:
            dropped_dupes += 1
            if seen[digest] != cls:
                conflicts += 1
            continue
        seen[digest] = cls
        counts[cls] += 1
        shutil.copy2(f, out / cls / f"{cls}_{counts[cls]:04d}{f.suffix.lower()}")

    print(f"cancerous: {counts['cancerous']}   non_cancerous: {counts['non_cancerous']}")
    print(f"exact duplicates removed: {dropped_dupes}   (label conflicts among them: {conflicts})   unlabeled files skipped: {skipped}")
    if min(counts["cancerous"], counts["non_cancerous"]) < 10:
        raise SystemExit("Need at least 10 images in each class - check the folder names.")
    print(f"ready -> {out.resolve()}\nnext: python train.py --modality ct")


if __name__ == "__main__":
    main()
