from PyQt6.QtWidgets import QApplication
from PyQt6.QtWebEngineWidgets import QWebEngineView
from PyQt6.QtCore import QUrl, QTimer

import os
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

# Delete businesses cache file
def delete_businesses_cache():
    try:
        if 'businesses_cache.json' in os.listdir():
            os.remove('businesses_cache.json')
            print("Deleted businesses_cache.json")
    except Exception as e:
        print(f"Error deleting businesses cache: {e}")

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
    delete_businesses_cache()
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
    view.setWindowTitle("FBLA Coding & Programming 2025-26")
    view.showMaximized()
    
    # Qt timer runs on main thread to process commands from Flask
    timer = QTimer()
    timer.timeout.connect(lambda: process_commands(view))
    timer.start(50)  # Check every 50 ms

    # Ensure cleanup on exit
    Qapp.aboutToQuit.connect(lambda: perform_cleanup(view))

    sys.exit(Qapp.exec())

if __name__ == "__main__":
    main()


