# CRIS Wagon Defect Detection System 🚂

An AI-Powered Railway Wagon Defect Inspection Service developed for the **Centre for Railway Information Systems (CRIS)** / Indian Railways. Integrates a custom PyTorch YOLO object detection model (`wagon_defect_best.pt`) for real-time wagon inspection, surface rust detection, dent identification, and structural damage analysis.

---

## ⚡ Quick Start / Run Pipeline

You can run the entire project (Backend API + Web Interface) directly using any of the following commands:

### Method 1: Python Launcher (Cross-Platform)
```bash
python run.py
```

### Method 2: Windows Batch Script
Double-click `run.bat` or run in PowerShell / Command Prompt:
```cmd
.\run.bat
```

### Method 3: Linux / macOS Shell Script
```bash
chmod +x run.sh
./run.sh
```

### Method 4: Direct FastAPI / Uvicorn Server
```bash
python main.py
```

---

## 🌐 System Access & Endpoints

When launched via the run pipeline, the server hosts both the **Web Interface** and **REST APIs** on port `8000`:

| Interface / Resource | URL | Description |
| :--- | :--- | :--- |
| **Main Inspection UI** | [http://localhost:8000](http://localhost:8000) | Single/Batch Image Upload and AI Inference |
| **Statistics Dashboard** | [http://localhost:8000/dashboard.html](http://localhost:8000/dashboard.html) | System Analytics and Defect Distribution |
| **Inspection History** | [http://localhost:8000/history.html](http://localhost:8000/history.html) | Persistent Log of Past Inspections |
| **Swagger API Docs** | [http://localhost:8000/docs](http://localhost:8000/docs) | Interactive API Documentation & Testing |
| **System Status Endpoint** | [http://localhost:8000/api-status](http://localhost:8000/api-status) | Backend and Model Health Status |

---

## 📦 Project Architecture

```
ui1/
├── run.py                 # Automated execution pipeline script
├── run.bat                # One-click Windows runner
├── run.sh                 # One-click Linux/macOS runner
├── main.py                # FastAPI server (API endpoints + Static Web UI serving)
├── requirements.txt       # Python dependencies manifest
├── wagon_defect_best.pt   # PyTorch YOLO defect detection weights (40.5 MB)
├── index.html             # Main Upload & Inspection UI
├── result.html            # Inspection Analysis & Bounding Box Viewer
├── dashboard.html         # System Statistics & Charts
├── history.html           # Historical Inspection Log UI
├── history_db.json        # Persistent JSON Database
├── css/                   # Enterprise UI Stylesheets
├── js/                    # Application Controllers & API Clients
├── assets/                # System Logos & Static Media
└── outputs/               # Saved & Annotated Inspection Images
```

---

## 🔧 Features & Capabilities

1. **AI-Powered Object Detection**: Uses `wagon_defect_best.pt` to detect defects such as **Rust**, **Dents**, and **Structural Damage**.
2. **Built-in Fallback Engine**: If PyTorch/YOLO model is absent or initializing, automatically switches to PIL-based bounding box visualization.
3. **Unified Single-Port Hosting**: Serves the rich frontend web application and high-performance FastAPI backend from a single unified port (`8000`).
4. **Auto Browser Launch**: Automatically opens the web application in your default browser upon startup.
5. **Persistence**: Saves inspection records and annotated output images locally for historical querying and statistical analysis.
