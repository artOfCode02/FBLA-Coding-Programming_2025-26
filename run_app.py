from PyQt6.QtWidgets import *
from PyQt6.QtWebEngineWidgets import *
from PyQt6.QtCore import *
from PyQt6.QtGui import *


import sys
import threading
import queue

from flask import jsonify
from app import app


command_queue = queue.Queue()

def process_commands(view):
    while not command_queue.empty():
        command = command_queue.get()

        if command == 'open_dev_tools':
            print("Processing command: open_dev_tools")
            open_dev_tools(view)

        command_queue.task_done()
    

# Start Flask, used to connect javascript with python
def start_flask():
    app.run()

##########################--- DEBUG ---##################################
def open_dev_tools(view):
    # Create a separate DevTools window and attach it to the main page.
    # This lets you inspect the rendered page.
    try:     
        print("Opening DevTools...")

        #if hasattr(view, 'dev_tools') and view.dev_tools is not None:
        #    # DevTools already open; just raise and focus it
        #    view.dev_tools.raise_()
        #    view.dev_tools.activateWindow()
        #    return

        dev_tools = QWebEngineView()
        dev_tools.setWindowTitle("DevTools - FBLA Coding & Programming 2025-26")
        view.page().setDevToolsPage(dev_tools.page())
        dev_tools.show()
        dev_tools.width = 800
        dev_tools.height = 600
        view.dev_tools = dev_tools  # Store reference to avoid garbage collection
        print("DevTools opened.")
        
    except Exception as e:
        print(f"Error opening DevTools: {e}")

# This fetches the command from Flask and sends it in the main GUI thread
@app.route("/open-dev-tools")
def run_open_dev_tools():
    try:
        print("Received request to open DevTools.")
        command_queue.put('open_dev_tools') # Send command to main thread
        return jsonify({"success": True, "message": "DevTools opened."}), 200
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500
############################################################################


# Close dev tools window on exit
def close_dev_tools(view):
    try:
        if hasattr(view, 'dev_tools') and view.dev_tools is not None:
            view.dev_tools.close()
            print("Closed DevTools window.")
    except Exception as e:
        print(f"Error closing DevTools: {e}")

# Cleanup function to be called on exit
def perform_cleanup(view):
    close_dev_tools(view)


# Main thread function
def main():
    # Run Flask in a background thread
    t = threading.Thread(target=start_flask)
    t.daemon = True
    t.start()

    # Start the application
    Qapp = QApplication(sys.argv)
    view = QWebEngineView()
    view.load(QUrl("http://127.0.0.1:5000"))

    # Build a simple navigation bar (non-editable URL display)
    main_window = QWidget()
    main_layout = QVBoxLayout()

    nav_bar = QWidget()
    nav_layout = QHBoxLayout()

    back_btn = QPushButton("◀")
    forward_btn = QPushButton("▶")
    reload_btn = QPushButton("⟳")
    devtools_btn = QPushButton("DevTools")

    # Set styles for buttons
    buttons = [back_btn, forward_btn, reload_btn, devtools_btn]
    for btn in buttons:
        btn.setStyleSheet("""QPushButton {
                                padding: 4px 8px; 
                                background: #555; 
                                color: #fff; 
                                border: none; 
                                border-radius: 3px;
                                width: 60px;
                            }
                            QPushButton:hover {
                                background: #777;
                            }
                            QPushButton:pressed {
                                background: #333;
                            }""")

    

    url_label = QLabel()
    initial_url = "http://127.0.0.1:5000"
    url_label.setStyleSheet("""QLabel {
                                padding: 2px; 
                                background: #fff; 
                                border: 1px solid #ccc;
                            }""")

    # store the full URL and display an elided version in the label
    full_url = [initial_url]

    def update_url_label():
        text = full_url[0] or ''
        fm = QFontMetrics(url_label.font())
        avail = max(20, url_label.width() - 20)
        try:
            elided = fm.elidedText(text, Qt.TextElideMode.ElideRight, avail)
        except Exception:
            # fallback in case of API differences
            elided = fm.elidedText(text, Qt.ElideRight, avail)
        url_label.setText(elided)

    # Layout behavior: make URL label expand to fill remaining space
    nav_layout.addWidget(back_btn)
    nav_layout.addWidget(forward_btn)
    nav_layout.addWidget(reload_btn)
    # URL label should occupy remaining horizontal space and be one line high
    url_label.setSizePolicy(QSizePolicy.Policy.Expanding, QSizePolicy.Policy.Fixed)
    fm = url_label.fontMetrics()
    url_label.setFixedHeight(fm.height() + 8)
    nav_layout.addWidget(url_label, 1)
    nav_layout.addWidget(devtools_btn)
    nav_bar.setLayout(nav_layout)

    # Slightly grey out the nav area to indicate immutability
    url_label.setStyleSheet("background-color: #a3a3a3; color: #333; padding: 1px;")
    
    # Tighten nav layout spacing and fix nav bar height so it stays small
    nav_layout.setContentsMargins(2, 2, 2, 2)
    nav_layout.setSpacing(6)
    nav_bar.setSizePolicy(QSizePolicy.Policy.Expanding, QSizePolicy.Policy.Fixed)
    nav_bar.setFixedHeight(fm.height() + 12)

    main_layout.addWidget(nav_bar, 0)
    main_layout.addWidget(view, 1)
    main_layout.setStretch(0, 0)
    main_layout.setStretch(1, 1)
    main_window.setLayout(main_layout)
    main_window.setWindowTitle("FBLA Coding & Programming 2025-26")

    # Wire up navigation controls
    back_btn.clicked.connect(lambda: view.back())
    forward_btn.clicked.connect(lambda: view.forward())
    reload_btn.clicked.connect(lambda: view.reload())
    devtools_btn.clicked.connect(lambda: open_dev_tools(view))

    # Update the URL label when navigation happens (keep full URL and elide for display)
    def on_url_changed(qurl):
        try:
            full_url[0] = qurl.toString()
        except Exception:
            full_url[0] = str(qurl)
        update_url_label()

    view.urlChanged.connect(on_url_changed)

    # Update elided label when window is resized so text re-elides to new width
    def on_resize(event):
        try:
            update_url_label()
        except Exception:
            pass
        return QWidget.resizeEvent(main_window, event)

    main_window.resizeEvent = on_resize

    # initialize displayed (elided) URL
    try:
        update_url_label()
    except Exception:
        url_label.setText(full_url[0])

    main_window.showMaximized()

    #Make window backgound dark color
    main_window.setStyleSheet("background-color: #2b2b2b; color: #fff;")
    
    # Qt timer runs on main thread to process commands from Flask
    timer = QTimer()
    timer.timeout.connect(lambda: process_commands(view))
    timer.start(50)  # Check every 50 ms

    # Ensure cleanup on exit
    Qapp.aboutToQuit.connect(lambda: perform_cleanup(view))

    sys.exit(Qapp.exec())

if __name__ == "__main__":
    main()


