@echo off
title CRIS Wagon Defect Detection System Runner
cls
echo ========================================================
echo   CRIS WAGON DEFECT DETECTION SYSTEM - ONE-CLICK RUNNER
echo ========================================================
echo.
python run.py
if errorlevel 1 (
    echo.
    echo Execution failed or python was not found in PATH.
    pause
)
