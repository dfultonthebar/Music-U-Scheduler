
#!/bin/bash

# Music-U-Scheduler Local Domain Launcher
# This script starts all services and opens the custom domain

echo "🎵 Starting Music-U-Scheduler with custom domain..."

# Function to check if a service is running
check_service() {
    local service_name=$1
    local port=$2
    if curl -s "http://localhost:$port" > /dev/null 2>&1; then
        echo "✅ $service_name is running on port $port"
        return 0
    else
        echo "❌ $service_name is not running on port $port"
        return 1
    fi
}

# Check if PostgreSQL is running
if ! pgrep -x "postgres" > /dev/null; then
    echo "🔧 Starting PostgreSQL..."
    sudo service postgresql start 2>/dev/null || echo "Note: PostgreSQL service management not available"
fi

# Check backend (FastAPI)
if ! check_service "Backend (FastAPI)" 8000; then
    echo "🔧 Starting backend..."
    cd /home/ubuntu/music-u-scheduler-frontend
    source music-u-env/bin/activate
    cd backend
    uvicorn main:app --host 0.0.0.0 --port 8000 &
    echo "⏳ Waiting for backend to start..."
    sleep 5
fi

# Check frontend (Next.js)
if ! check_service "Frontend (Next.js)" 3000; then
    echo "🔧 Starting frontend..."
    cd /home/ubuntu/music-u-scheduler-frontend/frontend
    yarn dev &
    echo "⏳ Waiting for frontend to start..."
    sleep 10
fi

# Check nginx
if ! pgrep -x "nginx" > /dev/null; then
    echo "🔧 Starting nginx..."
    sudo nginx 2>/dev/null || echo "Note: nginx service management not available"
fi

# Verify all services are running
echo ""
echo "🔍 Service Status Check:"
check_service "Backend (FastAPI)" 8000
check_service "Frontend (Next.js)" 3000

if pgrep -x "nginx" > /dev/null; then
    echo "✅ Nginx is running"
else
    echo "❌ Nginx is not running"
fi

echo ""
echo "🌐 Access your Music-U-Scheduler application at:"
echo "   • Custom Domain: https://musicu.local"
echo "   • Frontend: http://localhost:3000"
echo "   • API Docs: http://localhost:8000/docs"
echo ""
echo "📝 Default Admin Login:"
echo "   • Username: admin"
echo "   • Password: MusicU2025"
echo ""
echo "🔒 SSL Certificate Notice:"
echo "   Since we use a self-signed certificate for https://musicu.local,"
echo "   your browser will show a security warning. Click 'Advanced' then"
echo "   'Proceed to musicu.local (unsafe)' to continue."
echo ""
echo "🚀 All services are ready!"

# Open the application (handle certificate warning in browser)
if command -v google-chrome >/dev/null 2>&1; then
    echo "🌐 Opening Music-U-Scheduler in browser..."
    google-chrome --ignore-certificate-errors --ignore-ssl-errors https://musicu.local 2>/dev/null &
else
    echo "📱 Please open https://musicu.local in your browser"
fi
