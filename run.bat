@echo off
setlocal enabledelayedexpansion

set PYDIR=%USERPROFILE%\PythonUser
set PYEXE=%PYDIR%\python.exe
set PYURL=https://www.python.org/ftp/python/3.12.3/python-3.12.3-embed-amd64.zip
set PYZIP=python_embed.zip

:: ============================================================
:: CHECK LOCAL PYTHON (NO ADMIN)
:: ============================================================
if not exist "%PYEXE%" (
    echo Local Python not found.
    echo Downloading embeddable Python (no admin needed)...
    powershell -Command "Invoke-WebRequest '%PYURL%' -OutFile '%PYZIP%'"

    echo Extracting Python...
    powershell -Command "Expand-Archive '%PYZIP%' '%PYDIR%' -Force"

    del "%PYZIP%"

    echo Fixing Python config so pip works...
    echo import runpy > "%PYDIR%\pydistutils.cfg"
    echo runpy.run_module("pip", run_name="__main__") >> "%PYDIR%\pydistutils.cfg"

    :: Add pip bootstrap
    powershell -Command "Invoke-WebRequest 'https://bootstrap.pypa.io/get-pip.py' -OutFile '%PYDIR%\get-pip.py'"
    "%PYEXE%" "%PYDIR%\get-pip.py"
)

:: ============================================================
:: ENSURE VENV EXISTS
:: ============================================================
if not exist "venv" (
    echo Creating virtual environment...
    "%PYEXE%" -m venv venv
)

:: ============================================================
:: MENU
:: ============================================================
:MENU
cls
echo --------------------------------------------
echo           APP LAUNCHER MENU
echo --------------------------------------------
echo 1. Run App
echo 2. Reinstall Dependencies
echo 3. Rebuild Virtual Environment
echo 4. Exit
echo --------------------------------------------
set /p choice="Select option (1-4): "

if "%choice%"=="1" goto RUN_APP
if "%choice%"=="2" goto INSTALL_DEPS
if "%choice%"=="3" goto REBUILD_VENV
if "%choice%"=="4" exit /b

goto MENU


:: ============================================================
:: INSTALL DEPENDENCIES (NO ADMIN)
:: ============================================================
:INSTALL_DEPS
echo Activating environment...
call venv\Scripts\activate.bat

set NEED=0

pip show flask >nul 2>&1 || set NEED=1
pip show requests >nul 2>&1 || set NEED=1
pip show pywebview >nul 2>&1 || set NEED=1

if %NEED%==1 (
    echo Installing dependencies...
    pip install flask requests pywebview
) else (
    echo Dependencies already installed.
)

timeout /t 2 >nul
goto MENU


:: ============================================================
:: REBUILD VENV
:: ============================================================
:REBUILD_VENV
echo Deleting venv...
rmdir /s /q venv

echo Creating venv...
"%PYEXE%" -m venv venv

call venv\Scripts\activate.bat

echo Installing dependencies...
pip install flask requests pywebview

echo Done.
timeout /t 2 >nul
goto MENU


:: ============================================================
:: RUN APP
:: ============================================================
:RUN_APP
echo Activating environment...
call venv\Scripts\activate.bat

echo Running app...
python run_app.py
goto MENU
