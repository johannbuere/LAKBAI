#!/bin/bash

# LAKBAI Backend Startup Script
echo "🚀 Starting LAKBAI Backend API..."

# Check if Python is installed
if ! command -v python &> /dev/null; then
    echo "❌ Python is not installed. Please install Python 3.8+ first."
    exit 1
fi

# Check if virtual environment exists, create if it doesn't
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python -m venv venv
fi

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source venv/bin/activate

# Install requirements
echo "📚 Installing requirements..."
pip install -r requirements.txt

# Start the FastAPI server
echo "🌐 Starting FastAPI server on http://localhost:8000"
echo "📖 API documentation available at http://localhost:8000/docs"
uvicorn main:app --host 0.0.0.0 --port 8000 --reload