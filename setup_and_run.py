import os
import sys
import subprocess

venv_dir = "venv"

# -----------------------------
# Create virtual environment
# -----------------------------
if not os.path.exists(venv_dir):
    print("Creating virtual environment...")
    subprocess.check_call([sys.executable, "-m", "venv", venv_dir])
else:
    print("Virtual environment already exists.")

# -----------------------------
# Activate virtual environment
# -----------------------------
if os.name == "nt":  # Windows
    activate_script = os.path.join(venv_dir, "Scripts", "activate")
else:  # macOS / Linux
    activate_script = os.path.join(venv_dir, "bin", "activate")

print(f"Activating virtual environment: {activate_script}")
# Note: subprocess calls below use the venv python directly

python_exe = os.path.join(
    venv_dir,
    "Scripts" if os.name == "nt" else "bin",
    "python.exe" if os.name == "nt" else "python"
)

# -----------------------------
# Install dependencies
# -----------------------------
print("Installing dependencies...")
subprocess.check_call([python_exe, "-m", "pip", "install", "--upgrade", "pip"])
subprocess.check_call([python_exe, "-m", "pip", "install", "flask", "requests", "pyqt5", "pyqtwebengine", "PyQt6-Webengine"])

print("Dependencies installed.")

# -----------------------------
# Run the app
# -----------------------------
print("Running the app...")
subprocess.check_call([python_exe, "run_app.py"])
