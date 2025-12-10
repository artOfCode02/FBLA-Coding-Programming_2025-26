# Stop on errors
$ErrorActionPreference = "Stop"

$ProjectDir = $PSScriptRoot
$VenvDir = "$ProjectDir\venv"

# -------------------------
# Function: Check Python
# -------------------------
function Check-Python {
    try {
        python --version | Out-Null
        return $true
    } catch {
        return $false
    }
}

# -------------------------
# Function: Prompt user to install Python
# -------------------------
function Install-Python {
    Write-Host "Python is not installed or not in PATH."
    Write-Host "Downloading standard Python installer..."
    $InstallerPath = "$ProjectDir\python-installer.exe"
    $PythonURL = "https://www.python.org/ftp/python/3.12.3/python-3.12.3-amd64.exe"
    Invoke-WebRequest -Uri $PythonURL -OutFile $InstallerPath
    Write-Host "`nPlease run the installer:"
    Write-Host "1. Choose 'Install for current user' (no admin needed)."
    Write-Host "2. Check 'Add Python to PATH'."
    Write-Host "Press Enter after installation is complete..."
    Pause
    Remove-Item $InstallerPath
}

# -------------------------
# Ensure Python exists
# -------------------------
if (-not (Check-Python)) {
    Install-Python
    if (-not (Check-Python)) {
        Write-Host "Python still not found in PATH. Exiting."
        Pause
        exit
    }
}

Write-Host "Python detected in PATH."

# -------------------------
# Create venv if missing
# -------------------------
if (-not (Test-Path $VenvDir)) {
    Write-Host "Creating virtual environment..."
    python -m venv $VenvDir
    Write-Host "Virtual environment created at $VenvDir"
}

# -------------------------
# Install dependencies
# -------------------------
Write-Host "Installing dependencies..."
& "$VenvDir\Scripts\python.exe" -m pip install --upgrade pip
& "$VenvDir\Scripts\python.exe" -m pip install flask requests pywebview
Write-Host "Dependencies installed."

# -------------------------
# Run the app
# -------------------------
Write-Host "Launching your app..."
& "$VenvDir\Scripts\python.exe" "$ProjectDir\run_app.py"
Write-Host "App closed."
Pause
