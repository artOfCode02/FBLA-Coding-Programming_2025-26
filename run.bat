@echo off
setlocal enabledelayedexpansion

:: ==========================================================
::  COLOR SETUP
:: ==========================================================
for /F "tokens=1,2 delims==" %%a in ('"prompt $H & for %%b in (1) do rem"') do (
  set "BS=%%a"
)

set GREEN=[32m
set RED=[31m
set YELLOW=[33m
set CYAN=[36m
set RESET=[0m

cls

:: ==========================================================
::  CHECK PYTHON
:: ==========================================================
:CHECK_PYTHON
python --version >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo.
    echo Python not found. Downloading Python installer...
    powershell -Command "Invoke-WebRequest 'https://www.python.org/ftp/python/3.12.3/python-3.12.3-amd64.exe' -OutFile 'python_installer.exe'"
    echo Running Python installer...
    start /wait python_installer.exe /quiet InstallAllUsers=1 PrependPath=1 Include_test=0
    del python_installer.exe

    echo.
    echo Checking Python again...
    python --version >nul 2>&1
    if %ERRORLEVEL% neq 0 (
        echo Failed to install Python. Please install manually.
        pause
        exit /b
    )
)

:: ==========================================================
::  CHECK VENV
:: ==========================================================
if not exist "venv" (
    echo Creating virtual environment...
    python -m venv venv
)

:: ==========================================================
::  MENU
:: ==========================================================
:MENU
cls
echo --------------------------------------------------
echo               APP LAUNCHER MENU
echo --------------------------------------------------
echo 1. Run App
echo 2. Reinstall Dependencies
echo 3. Rebuild Virtual Environment
echo 4. Exit
echo --------------------------------------------------
set /p choice="Select option (1-4): "

if "%choice%"=="1" goto RUN_APP
if "%choice%"=="2" goto INSTALL_DEPENDENCIES
if "%choice%"=="3" goto REBUILD_VENV
if "%choice%"=="4" exit /b

goto MENU


:: ==========================================================
::  INSTALL DEPENDENCIES
:: ==========================================================
:INSTALL_DEPENDENCIES
echo.
echo Activating virtual environment...
call venv\Scripts\activate.bat

set NEED_INSTALL=

pip show flask >nul 2>&1 || set NEED_INSTALL=1
pip show requests >nul 2>&1 || set NEED_INSTALL=1
pip show pywebview >nul 2>&1 || set NEED_INSTALL=1

if defined NEED_INSTALL (
    echo Installing required packages...
    pip install flask requests pywebview
) else (
    echo All packages already installed.
)

timeout /t 2 >nul
goto MENU


:: ==========================================================
::  REBUILD VENV (full reset)
:: ==========================================================
:REBUILD_VENV
echo.
echo Deleting old virtual environment...
rmdir /s /q venv

echo Creating new virtual environment...
python -m venv venv

echo Installing packages...
call venv\Scripts\activate.bat
pip install flask requests pywebview

echo Done rebuilding environment.
timeout /t 2 >nul
goto MENU


:: ==========================================================
::  RUN APP
:: ==========================================================
:RUN_APP
echo.
echo Activating virtual environment...
call venv\Scripts\activate.bat

echo Running app...
python run_app.py
goto MENU
