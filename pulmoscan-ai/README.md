# PulmoScan AI

Lung-cancer screening demo: upload a chest **CT slice** (and/or a chest X-ray) and get
*Lung Cancer Detected* / *No Cancer Detected (Non-Cancerous)*, a confidence value, and - only when cancer is
flagged - a Grad-CAM heat-map with numbered suspected regions.

* Front-end: React + TanStack Start + Tailwind (Vite)
* Back-end: Python, FastAPI, PyTorch (ResNet-18 transfer learning) in `backend/`
* Your training data lives in `backend/dataset/Lung Cancer Dataset/`

## Run it (Windows)
1. Install **Python 3.10-3.12** and **Node.js 20+**.
2. Double-click `1_train_model.bat` (once). It installs the Python packages, prepares your dataset and trains the CT model
   -> `backend/models/ct.pt`. Read the test numbers it prints at the end.
3. Double-click `2_start_backend.bat` (leave open).
4. Double-click `3_start_frontend.bat` (leave open) and open http://localhost:5173.

Manual equivalent:
```bash
cd backend && python -m venv .venv && .venv\Scripts\activate
pip install -r requirements.txt
python prepare_local.py && python train.py --modality ct
uvicorn app:app --port 8000          # terminal 1
npm install && npm run dev           # terminal 2, project root
```

## Important
Research demo, **not a medical device**. See `backend/README.md` for how the data is cleaned and why the reported
accuracy on this dataset is optimistic.
