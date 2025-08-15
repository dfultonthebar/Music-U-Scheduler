#!/bin/bash
cd "$(dirname "$0")"

echo "Starting Music U Scheduler..."
echo "Backend: http://localhost:8080"
echo "Frontend: http://localhost:3000"
echo "API Docs: http://localhost:8080/docs"
echo ""
echo "Press Ctrl+C to stop all services"

# Function to kill background processes on exit
cleanup() {
    echo "Stopping services..."
    kill $BACKEND_PID 2>/dev/null || true
    kill $FRONTEND_PID 2>/dev/null || true
    exit 0
}
trap cleanup SIGINT SIGTERM

# Start backend
echo "Starting backend..."
./start-backend.sh &
BACKEND_PID=$!

# Wait for backend to start
sleep 5

# Start frontend
echo "Starting frontend..."
./start-frontend.sh &
FRONTEND_PID=$!

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID
