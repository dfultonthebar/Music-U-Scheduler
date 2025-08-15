#!/bin/bash

# Music-U-Scheduler Launch Script
# This script starts the FastAPI application with proper environment setup

set -e  # Exit on any error

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "Starting Music-U-Scheduler..."

# Check if virtual environment exists
if [ ! -d "music-u-env" ]; then
    echo "Error: Virtual environment 'music-u-env' not found!"
    echo "Please run the installation script first."
    exit 1
fi

# Check if PostgreSQL is running
if ! pgrep -x "postgres" > /dev/null; then
    echo "PostgreSQL is not running. Attempting to start..."
    sudo service postgresql start
    if [ $? -ne 0 ]; then
        echo "Error: Failed to start PostgreSQL. Please start it manually:"
        echo "sudo service postgresql start"
        exit 1
    fi
    echo "PostgreSQL started successfully."
fi

# Activate virtual environment
echo "Activating virtual environment..."
source music-u-env/bin/activate

# Check if required dependencies are installed
echo "Checking dependencies..."
python -c "import fastapi, uvicorn, sqlalchemy" 2>/dev/null
if [ $? -ne 0 ]; then
    echo "Error: Required dependencies not found. Installing..."
    pip install -r requirements.txt
fi

# Find an available port (default 8000, fallback to 8001, 8002, etc.)
PORT=8000
while netstat -tlnp 2>/dev/null | grep -q ":$PORT "; do
    echo "Port $PORT is already in use, trying $((PORT+1))..."
    PORT=$((PORT+1))
    if [ $PORT -gt 8010 ]; then
        echo "Error: No available ports found between 8000-8010"
        exit 1
    fi
done

echo "Starting FastAPI server on port $PORT..."
echo "Access the application at: http://localhost:$PORT"
echo "API documentation at: http://localhost:$PORT/docs"
echo "Press Ctrl+C to stop the server"
echo ""

# Start the FastAPI application
exec python -m uvicorn app.main:app --reload --host 0.0.0.0 --port $PORT
