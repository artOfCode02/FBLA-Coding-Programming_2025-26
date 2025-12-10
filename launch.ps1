# Stop on errors
$ErrorActionPreference = "Stop"

# -------------------------
# Paths
# -------------------------
$ProjectDir = $PSScriptRoot
$LocalPythonDir = "$ProjectDir\PythonUser"
$PythonExe = "$LocalPythonDir\python.exe"
$PythonZip = "$ProjectDir\python_embed.zip"
$PythonURL = "https://www.python.org/ftp/python/3.12.3/python-3.12.3-embed-amd64.zip"
$VenvDir = "$ProjectDir\venv"

# -------------------------
# Function: Install Python locally
# -------------------------
function Install-Python {
    Write-Host "Python not found. Downloading local Python..."
    Invoke-WebRequest -Uri $PythonURL -OutFile $PythonZip
    Write-Host "Extracting Python..."
    Expand-Archive -Path $PythonZip -DestinationPath $LocalPythonDir -Force
    Remove-Item $PythonZip

    Write-Host "Installing pip..."
    Invoke-WebRequest -Uri "https://bootstrap.pypa.io/get-pip.py" -OutFile "$LocalPythonDir\get-pip.py"
    & "$PythonExe" "$LocalPythonDir\get-pip.py"
    Remove-Item "$LocalPythonDir\get-pip.py"

    Write-Host "Python installed locally at $LocalPythonDir"
}

# -------------------------
# Ensure Python exists
# -------------------------
if (-not (Test-Path $PythonExe)) {
    Install-Python
} else {
    Write-Host "Python found at $PythonExe"
}

# -------------------------
# Create venv if missing
# -------------------------
if (-not (Test-Path $VenvDir)) {
    Write-Host "Creating virtual environment..."
    & "$PythonExe" -m venv --copies $VenvDir
    & "$VenvDir\Scripts\python.exe" -m ensurepip --upgrade
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
