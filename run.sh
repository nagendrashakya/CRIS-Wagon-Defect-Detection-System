#!/bin/bash
echo "========================================================"
echo "  CRIS WAGON DEFECT DETECTION SYSTEM - ONE-CLICK RUNNER"
echo "========================================================"
echo ""
if command -v python3 &>/dev/null; then
    python3 run.py
elif command -v python &>/dev/null; then
    python run.py
else
    echo "Python is not installed or not in PATH."
    exit 1
fi
