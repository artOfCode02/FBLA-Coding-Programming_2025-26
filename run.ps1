python -m venv venv
.\venv\Scripts\Activate.ps1

# Check if packages are installed
$pipCheck = pip show flask,requests,webview 2>$null

if (-Not $pipCheck) {
    Write-Host "Required packages are not present, installing..."
    pip install flask requests webview
}
else {
    Write-Host "Required packages are installed."
}

python run_app.py
