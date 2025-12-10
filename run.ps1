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
# Function: Install local Python if missing
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

    Write-Host "Python installed locally at $LocalPythonDir."
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
# Function: Create venv if missing
# -------------------------
function Ensure-Venv {
    if (-not (Test-Path $VenvDir)) {
        Write-Host "Creating virtual environment..."
        & "$PythonExe" -m venv $VenvDir
        Write-Host "Virtual environment created."
    }
}

# -------------------------
# Function: Install dependencies
# -------------------------
function Install-Dependencies {
    Ensure-Venv
    Write-Host "Installing/upgrading pip and packages..."
    & "$VenvDir\Scripts\python.exe" -m pip install --upgrade pip
    & "$VenvDir\Scripts\python.exe" -m pip install flask requests pywebview
    Write-Host "Dependencies installed."
    Pause
}

# -------------------------
# Function: Rebuild venv
# -------------------------
function Rebuild-Venv {
    if (Test-Path $VenvDir) {
        Write-Host "Deleting existing virtual environment..."
        Remove-Item -Recurse -Force $VenvDir
    }
    Write-Host "Creating new virtual environment..."
    & "$PythonExe" -m venv $VenvDir
    Install-Dependencies
}

# -------------------------
# Function: Run the app
# -------------------------
function Run-App {
    Ensure-Venv
    if (-not (Test-Path "$VenvDir\Scripts\python.exe")) {
        Write-Host "venv missing! Rebuilding..."
        Rebuild-Venv
    }
    & "$VenvDir\Scripts\python.exe" "$ProjectDir\run_app.py"
    Pause
}

# -------------------------
# Menu loop
# -------------------------
while ($true) {
    Clear-Host
    Write-Host "-------------------------------------"
    Write-Host "            APP MENU"
    Write-Host "-------------------------------------"
    Write-Host "1. Run App"
    Write-Host "2. Install/Repair Dependencies"
    Write-Host "3. Rebuild Virtual Environment"
    Write-Host "4. Exit"
    Write-Host "-------------------------------------"
    $choice = Read-Host "Choose 1-4"

    switch ($choice) {
        "1" { Run-App }
        "2" { Install-Dependencies }
        "3" { Rebuild-Venv }
        "4" { break }
        default { Write-Host "Invalid choice. Try again."; Pause }
    }
}
