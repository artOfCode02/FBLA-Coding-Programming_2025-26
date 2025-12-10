@echo off

REM Create virtual environment if it doesn't exist
if not exist "venv" (
    python -m venv venv
)

REM Activate the virtual environment
call venv\Scripts\activate.bat

REM Check for required packages
pip show flask >nul 2>&1
set HAS_FLASK=%ERRORLEVEL%

pip show requests >nul 2>&1
set HAS_REQUESTS=%ERRORLEVEL%

pip show pywebview >nul 2>&1
set HAS_WEBVIEW=%ERRORLEVEL%

if %HAS_FLASK% neq 0 (
    set NEED_INSTALL=1
)
if %HAS_REQUESTS% neq 0 (
    set NEED_INSTALL=1
)
if %HAS_WEBVIEW% neq 0 (
    set NEED_INSTALL=1
)

if defined NEED_INSTALL (
    echo Required packages are not present, installing...
    pip install flask requests pywebview
) else (
    echo Required packages are installed.
)

REM Run your app
python run_app.py
