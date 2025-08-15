#!/bin/bash

case "$1" in
    start)
        echo "Starting Music U Scheduler services..."
        ./start-all.sh
        ;;
    stop)
        echo "Stopping Music U Scheduler services..."
        pkill -f "uvicorn.*main:app" || true
        pkill -f "next.*dev" || true
        echo "Services stopped."
        ;;
    restart)
        echo "Restarting Music U Scheduler services..."
        $0 stop
        sleep 3
        $0 start
        ;;
    status)
        echo "Checking service status..."
        if pgrep -f "uvicorn.*main:app" > /dev/null; then
            echo "✓ Backend is running"
        else
            echo "✗ Backend is not running"
        fi
        
        if pgrep -f "next.*dev" > /dev/null; then
            echo "✓ Frontend is running"
        else
            echo "✗ Frontend is not running"
        fi
        ;;
    *)
        echo "Usage: $0 {start|stop|restart|status}"
        exit 1
        ;;
esac
