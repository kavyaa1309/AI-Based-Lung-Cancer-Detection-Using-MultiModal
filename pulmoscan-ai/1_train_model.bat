@echo off
REM One-time setup + training on your dataset (backend\dataset). Takes a few minutes on CPU.
cd /d "%~dp0backend"
if not exist .venv ( python -m venv .venv || goto :err )
call .venv\Scripts\activate.bat || goto :err
python -m pip install --upgrade pip
pip install -r requirements.txt || goto :err
python prepare_local.py || goto :err
python train.py --modality ct || goto :err
echo.
echo Training finished. Model saved to backend\models\ct.pt
echo Now run 2_start_backend.bat and 3_start_frontend.bat
pause
exit /b 0
:err
echo.
echo Something failed - read the message above. (Python 3.10 - 3.12 is recommended for PyTorch.)
pause
exit /b 1
