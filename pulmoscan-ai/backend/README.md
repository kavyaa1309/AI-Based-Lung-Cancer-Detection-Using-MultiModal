# Backend - CT / X-ray classifier

One ImageNet-pretrained ResNet-18 per modality (`ct`, `xray`). A CT upload uses `models/ct.pt`, an X-ray upload uses
`models/xray.pt`. If both are uploaded the study probability is the mean; the UI warns when they disagree.
Only the **CT** model is trained from the dataset you provided. Uploading an X-ray without an X-ray model returns a
clear error (nothing is invented).

## Train on your dataset
```bash
pip install -r requirements.txt
python prepare_local.py        # dataset/ -> data/ct/{cancerous,non_cancerous}
python train.py --modality ct  # -> models/ct.pt + models/ct_metrics.json
uvicorn app:app --port 8000
```
Use another dataset by passing `--src "path"`; any folder tree whose folders are named like *Cancerous* / *Non-Cancerous* works.

## What was found in the supplied dataset (and fixed)
1. **Test leakage** - 188 of the 190 images in `test/` are exact copies of `train/` images. Scores on that split would be fake.
   `prepare_local.py` pools everything, drops exact duplicates (362 unique images remain: 238 cancerous / 124 non-cancerous) and
   `train.py` makes a fresh 70/15/15 stratified split.
2. **Text shortcut** - cancerous images carry burned-in hospital / patient text, non-cancerous ones don't. `common.mask_ct_body`
   blanks everything outside the body (text, scanner table) for both training and inference.
3. **Colour shortcut** - all 85 false-colour (viridis) images are cancerous. `common.decolorize_ct` converts them back to grey.
4. Contrast is auto-stretched and training uses scale / shift / rotation / contrast augmentation.

## Caveats
* Even after cleaning, cancerous and non-cancerous slices come from different scanners / window settings (a plain linear model on 40x40 pixels
  already scores ~92 % balanced accuracy on the held-out part), and adjacent slices of the same patient can land on both sides of the split
  (no patient IDs). **Expect the printed test accuracy to overstate performance on scans from other hospitals.**
* Grad-CAM is a coarse "where the model looked" map, not a tumour segmentation; zone text is a heuristic.
* Research demo only - never for clinical decisions.
