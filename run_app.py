from PyQt6.QtWidgets import QApplication, QMainWindow, QVBoxLayout, QWidget
from PyQt6.QtWebEngineWidgets import QWebEngineView
from PyQt6.QtCore import QUrl

import sys
import threading
from app import app

def start_flask():
    app.run()

# Run Flask in a background thread
t = threading.Thread(target=start_flask)
t.daemon = True
t.start()

Qapp = QApplication(sys.argv)
view = QWebEngineView()
view.load(QUrl("http://127.0.0.1:5000"))
view.show()
sys.exit(Qapp.exec())
