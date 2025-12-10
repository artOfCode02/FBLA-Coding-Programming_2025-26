# Stop on errors
$ErrorActionPreference = "Stop"

# -------------------------
# Paths
# -------------------------
$LocalPythonDir = "$PSScriptRoot\PythonUser"
$PythonExe = "$LocalPythonDir\python.exe"
$PythonZip = "$PSScriptRoot\python_embed.zip"
$PythonURL = "https://www.python.org/ftp/python/3.12.3/python-3.12.3-embed-amd64.zip"

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
    Write-Host "Python installed locally."
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
# Create virtual environment if missing
# -------------------------
if (-not (Test-Path "$PSScriptRoot\venv")) {
    Write-Host "Creating virtual environment..."
    & "$PythonExe" -m venv "$PSScriptRoot\venv"
}

# -------------------------
# Function: Install dependencies
# -------------------------
function Install-Dependencies {
    Write-Host "Installing/upgrading pip and packages..."
    & "$PSScriptRoot\venv\Scripts\python.exe" -m pip install --upgrade pip
    & "$PSScriptRoot\venv\Scripts\python.exe" -m pip install flask requests pywebview
    Write-Host "Dependencies installed."
    Pause
}

# -------------------------
# Function: Rebuild venv
# -------------------------
function Rebuild-Venv {
    Write-Host "Rebuilding virtual environment..."
    Remove-Item -Recurse -Force "$PSScriptRoot\venv"
    & "$PythonExe" -m venv "$PSScriptRoot\venv"
    Install-Dependencies
}

# -------------------------
# Function: Run the app
# -------------------------
function Run-App {
    if (-not (Test-Path "$PSScriptRoot\venv\Scripts\python.exe")) {
        Write-Host "venv missing! Rebuilding..."
        Rebuild-Venv
    }
    & "$PSScriptRoot\venv\Scripts\python.exe" "$PSScriptRoot\run_app.py"
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
