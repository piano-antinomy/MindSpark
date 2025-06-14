#!/bin/bash

echo "🚀 Starting MindSpark Learning Platform..."
echo "======================================"

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3.7+ to continue."
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 14+ to continue."
    exit 1
fi

# Function to handle cleanup
cleanup() {
    echo ""
    echo "🛑 Shutting down MindSpark..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit 0
}

# Set up signal handlers for graceful shutdown
trap cleanup SIGINT SIGTERM

echo "📦 Installing dependencies..."

# Install backend dependencies
echo "Installing Python dependencies..."
cd backend
if [ ! -d "venv" ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv venv
fi

source venv/bin/activate
pip install -r requirements.txt > /dev/null 2>&1

# Install frontend dependencies
echo "Installing Node.js dependencies..."
cd ../website
npm install > /dev/null 2>&1

echo "✅ Dependencies installed successfully!"
echo ""

# Start backend server
echo "🐍 Starting Python Flask backend server..."
cd ../backend
source venv/bin/activate
python app.py &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 3

# Start frontend server
echo "🌐 Starting Node.js frontend server..."
cd ../website
npm start &
FRONTEND_PID=$!

# Wait a moment for frontend to start
sleep 3

# Get local IP address
LOCAL_IP=$(ifconfig | grep -Eo 'inet (addr:)?([0-9]*\.){3}[0-9]*' | grep -Eo '([0-9]*\.){3}[0-9]*' | grep -v '127.0.0.1' | head -1)
if [ -z "$LOCAL_IP" ]; then
    LOCAL_IP=$(hostname -I | awk '{print $1}' 2>/dev/null)
fi
if [ -z "$LOCAL_IP" ]; then
    LOCAL_IP="localhost"
fi

echo ""
echo "🎉 MindSpark Learning Platform is running!"
echo "=========================================="
echo "🌐 Local access:"
echo "   Frontend:    http://localhost:3000"
echo "   Backend API: http://localhost:4092"
echo ""
echo "📱 Network access (other devices):"
echo "   Frontend:    http://$LOCAL_IP:3000"
echo "   Backend API: http://$LOCAL_IP:4092"
echo ""
echo "📚 Test Credentials:"
echo "   Username: student1  |  Password: password123"
echo "   Username: demo      |  Password: demo123"
echo ""
echo "💡 Share the network URL with other devices on your network!"
echo "Press Ctrl+C to stop both servers"
echo ""

# Wait for user to stop the servers
wait 