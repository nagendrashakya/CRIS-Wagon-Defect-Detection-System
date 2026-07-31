"""
CRIS Wagon Defect Detection System - Automated Run Pipeline
-----------------------------------------------------------
This script verifies system requirements, checks model weight files,
launches the unified FastAPI backend & Web Frontend server, and automatically
opens the interactive web interface in your default browser.
"""

import os
import sys
import time
import threading
import webbrowser
import subprocess

HOST = "0.0.0.0"
PORT = 8000
BASE_URL = f"http://localhost:{PORT}"

REQUIRED_PACKAGES = [
    ("fastapi", "fastapi"),
    ("uvicorn", "uvicorn"),
    ("PIL", "pillow"),
    ("pydantic", "pydantic"),
    ("multipart", "python-multipart"),
]

OPTIONAL_PACKAGES = [
    ("torch", "torch"),
    ("ultralytics", "ultralytics"),
]

def print_banner():
    print("=" * 68)
    print(" CRIS WAGON DEFECT DETECTION SYSTEM - RUN PIPELINE")
    print(" Centre for Railway Information Systems (CRIS) - AI Inspection")
    print("=" * 68)

def check_and_install_dependencies():
    print("\nStep 1: Checking Python environment dependencies...")
    missing_required = []
    
    for module_name, pip_name in REQUIRED_PACKAGES:
        try:
            __import__(module_name)
            print(f"  [+] {pip_name} is installed.")
        except ImportError:
            print(f"  [x] {pip_name} is MISSING.")
            missing_required.append(pip_name)
            
    for module_name, pip_name in OPTIONAL_PACKAGES:
        try:
            __import__(module_name)
            print(f"  [+] {pip_name} (AI Inference) is installed.")
        except ImportError:
            print(f"  [!] {pip_name} is missing. (App will run using built-in fallback annotation engine)")

    if missing_required:
        print(f"\n[*] Installing missing required packages: {', '.join(missing_required)}...")
        req_file = os.path.join(os.path.dirname(__file__), "requirements.txt")
        if os.path.exists(req_file):
            subprocess.check_call([sys.executable, "-m", "pip", "install", "-r", req_file])
        else:
            subprocess.check_call([sys.executable, "-m", "pip", "install"] + missing_required)
        print("  [+] All required packages installed successfully!")

def check_model():
    print("\nStep 2: Checking AI Detection Model...")
    base_dir = os.path.dirname(os.path.abspath(__file__))
    model_path = os.path.join(base_dir, "wagon_defect_best.pt")
    
    if os.path.exists(model_path):
        size_mb = os.path.getsize(model_path) / (1024 * 1024)
        print(f"  [+] Model found: 'wagon_defect_best.pt' ({size_mb:.1f} MB)")
    else:
        print("  [!] 'wagon_defect_best.pt' not found. AI fallback engine will generate annotated results.")

def open_browser():
    time.sleep(2.0)
    print(f"\nOpening web application in browser at {BASE_URL} ...")
    try:
        webbrowser.open(BASE_URL)
    except Exception as e:
        print(f"  Note: Could not open browser automatically ({e}). Please visit {BASE_URL} manually.")

def start_server():
    print("\nStep 3: Launching CRIS Web Application & Backend Server...")
    print(f"  - Web Interface:      {BASE_URL}")
    print(f"  - Statistics UI:      {BASE_URL}/dashboard.html")
    print(f"  - Inspection History: {BASE_URL}/history.html")
    print(f"  - Swagger API Docs:   {BASE_URL}/docs")
    print(f"  - System API Status:  {BASE_URL}/api-status")
    print("\nPress Ctrl+C to stop the server at any time.\n")
    print("-" * 68)

    # Launch browser thread
    threading.Thread(target=open_browser, daemon=True).start()

    # Start Uvicorn Server
    import uvicorn
    uvicorn.run("main:app", host=HOST, port=PORT, reload=True)

if __name__ == "__main__":
    print_banner()
    check_and_install_dependencies()
    check_model()
    start_server()
