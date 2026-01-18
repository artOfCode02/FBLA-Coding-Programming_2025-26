from PyQt6.QtWidgets import QApplication
from PyQt6.QtWebEngineWidgets import QWebEngineView
from PyQt6.QtCore import QUrl

import sys
import threading
from app import app

# Start Flask, used to connect javascript with python
def start_flask():
    app.run()

# Run Flask in a background thread
t = threading.Thread(target=start_flask)
t.daemon = True
t.start()


# Start the application
Qapp = QApplication(sys.argv)
view = QWebEngineView()
view.load(QUrl("http://127.0.0.1:5000"))
view.setWindowTitle("FBLA Coding & Programming 2025-26")
view.showFullScreen()

# Create a separate DevTools window and attach it to the main page.
# This lets you inspect the rendered page. Opened by default so you
# can debug; close or hide as needed.
dev_tools = QWebEngineView()
dev_tools.setWindowTitle("DevTools - FBLA Coding & Programming 2025-26")
view.page().setDevToolsPage(dev_tools.page())
dev_tools.show()
sys.exit(Qapp.exec())


