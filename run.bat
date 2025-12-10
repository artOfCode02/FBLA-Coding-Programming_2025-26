@echo off
setlocal enabledelayedexpansion

:: =========================================
:: Setup directories
:: =========================================
set PYDIR=%USERPROFILE%\PythonUser
set PYEXE=%PYDIR%\python.exe
set PYURL=https://www.python.org/ftp/python/3.12.3/python-3.12.3-embed-amd64.zip
set PYZIP=python_embed.zip

:: =========================================
:: Check for local Python (no admin)
:: =========================================
if not exist "%PYEXE%" (
    echo Local Python not found. Downloading...
    powershell -ExecutionPolicy Bypass -Command ^
        "Invoke-WebRequest '%PYURL%' -OutFile '%PYZIP%'"

    echo Extracting...
    powershell -ExecutionPolicy Bypass -Command ^
        "Expand-Archive '%PYZIP%' '%PYDIR%' -Force"

    del "%PYZIP%"

    echo Installing pip...
    powershell -ExecutionPolicy Bypass -Command ^
        "Invoke-WebRequest 'https://bootstrap.pypa.io/get-pip.py' -OutFile '%PYDIR%\get-pip.py'"

    "%PYEXE%" "%PYDIR%\get-pip.py"
)

:: =========================================
:: Ensure venv exists
:: =========================================
if not exist "venv" (
    echo Creating virtual environment...
    "%PYEXE%" -m venv venv
)

:: =========================================
:: MENU LOOP
:: =========================================
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

:: =========================================
:: Install dependencies
:: =========================================
:INSTALL
call venv\Scripts\activate.bat

echo Installing required packages...
pip install flask requests pywebview

pause
goto MENU

:: =========================================
:: Rebuild venv
:: =========================================
:REBUILD
echo Rebuilding venv...
rmdir /s /q venv

"%PYEXE%" -m venv venv
call venv\Scripts\activate.bat
pip install flask requests pywebview

pause
goto MENU

:: =========================================
:: Run ap
