import threading
import webview
from app import app

def start_flask():
    app.run()

# Run Flask in a background thread
t = threading.Thread(target=start_flask)
t.daemon = True
t.start()

# Open desktop window showing your website
webview.create_window("Local Review App", "http://127.0.0.1:5000")
webview.start()