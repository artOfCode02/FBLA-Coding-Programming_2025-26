#!/bin/sh

python3 -m venv venv
source venv/bin/activate

if [ ! pip show "flask requests webview" &>/dev/null ]; then
  echo "Required packages are not present, installing..."
  pip install flask requests webview
else
  echo "Required packages are installed."
fi

python3 run_app.py