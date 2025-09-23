#!/bin/bash

echo "========================================"
echo "    Suri - Development Mode"
echo "========================================"
echo

# Check if we're in the correct directory
if [ ! -d "backend" ]; then
    echo "Error: backend directory not found. Please run this script from the project root."
    exit 1
fi

if [ ! -d "desktop" ]; then
    echo "Error: desktop directory not found. Please run this script from the project root."
    exit 1
fi

echo "Starting development servers..."
echo

# Function to cleanup background processes
cleanup() {
    echo
    echo "Stopping development servers..."
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null
    fi
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Start backend in background
echo "Starting Python backend..."
cd backend
python run.py &
BACKEND_PID=$!
cd ..

# Wait a moment for backend to start
sleep 3

# Start frontend (this will block)
echo "Starting Electron frontend..."
cd desktop
pnpm dev

# If we get here, frontend was stopped
cleanup