@echo off
setlocal enabledelayedexpansion

:: ----------------------------
:: Project-local Python folder
:: ----------------------------
set PYDIR=%CD%\PythonUser
set PYEXE=%PYDIR%\python.exe
set PYZIP=python_embed.zip
set PYURL=https://www.python.org/ftp/python/3.12.3/python-3.12.3-embed-amd64.zip

:: ----------------------------
:: Download Python if missing
:: ----------------------------
if not exist "%PYEXE%" (
    echo Downloading Python (no admin required)...
    powershell -Command "Invoke-WebRequest '%PYURL%' -OutFile '%PYZIP%'"

    echo Extracting Python...
    powershell -Command "Expand-Archive '%PYZIP%' '%PYDIR%' -Force"

    del "%PYZIP%"

    echo Installing pip...
    powershell -Command "Invoke-WebRequest 'https://bootstrap.pypa.io/get-pip.py' -OutFile '%PYDIR%\get-pip.py'"
    "%PYEXE%" "%PYDIR%\get-pip.py"
)

:: ----------------------------
:: Create venv if missing
:: ----------------------------
if not exist "venv" (
    echo Creating virtual environment...
    "%PYEXE%" -m venv venv
)

:: ----------------------------
:: MENU LOOP
:: ----------------------------
:MENU
cls
echo -------------------------------
echo         APP MENU
echo -------------------------------
echo 1. Run App
echo 2. Install/Repair Dependencies
echo 3. Rebuild Virtual Environment
echo 4. Exit
echo -------------------------------
set /p choice=Choose 1-4:

if "%choice%"=="1" goto RUN
if "%choice%"=="2" goto INSTALL
if "%choice%"=="3" goto REBUILD
if "%choice%"=="4" exit /b

goto MENU

:: ----------------------------
:: Run App
:: ----------------------------
:RUN
if not exist "venv\Scripts\activate.bat" (
    echo ERROR: venv missing! Rebuilding...
    goto REBUILD
)
call venv\Scripts\activate.bat
python run_app.py
pause
goto MENU

:: ----------------------------
:: Install/Repair Dependencies
:: ----------------------------
:INSTALL
call venv\Scripts\activate.bat
pip install --upgrade pip
pip install flask requests pywebview
pause
goto MENU

:: ----------------------------
:: Rebuild venv
:: ----------------------------
:REBUILD
echo Rebuilding virtual environment...
rmdir /s /q venv
"%PYEXE%" -m venv venv
call venv\Scripts\activate.bat
pip install --upgrade pip
pip install flask requests pywebview
pause
goto MENU
