@echo off
REM LAKBAI Backend Startup Script for Windows

echo 🚀 Starting LAKBAI Backend API...

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python is not installed. Please install Python 3.8+ first.
    pause
    exit /b 1
)

REM Check if virtual environment exists, create if it doesn't
if not exist "venv" (
    echo 📦 Creating virtual environment...
    python -m venv venv
)

REM Activate virtual environment
echo 🔧 Activating virtual environment...
call venv\Scripts\activate.bat

REM Install requirements
echo 📚 Installing requirements...
pip install -r requirements.txt

REM Start the FastAPI server
echo 🌐 Starting FastAPI server on http://localhost:8000
echo 📖 API documentation available at http://localhost:8000/docs
uvicorn main:app --host 0.0.0.0 --port 8000 --reload

pause