#!/bin/bash

# AuraFlow Stop Script
# Stops all running servers

echo "🛑 Stopping AuraFlow servers..."
echo ""

# Check for PID files
if [ -f .backend.pid ]; then
    BACKEND_PID=$(cat .backend.pid)
    echo "Stopping backend (PID: $BACKEND_PID)..."
    kill $BACKEND_PID 2>/dev/null
    rm .backend.pid
    echo "✓ Backend stopped"
else
    echo "⚠️  No backend PID file found"
fi

if [ -f .webapp.pid ]; then
    WEBAPP_PID=$(cat .webapp.pid)
    echo "Stopping webapp (PID: $WEBAPP_PID)..."
    kill $WEBAPP_PID 2>/dev/null
    rm .webapp.pid
    echo "✓ Webapp stopped"
else
    echo "⚠️  No webapp PID file found"
fi

# Also kill any remaining processes on port 3000
echo ""
echo "Checking for any remaining processes on port 3000..."
if lsof -i :3000 > /dev/null 2>&1; then
    PID=$(lsof -t -i :3000)
    echo "Found process $PID on port 3000, killing..."
    kill $PID 2>/dev/null
    echo "✓ Cleaned up port 3000"
else
    echo "✓ Port 3000 is clear"
fi

echo ""
echo "✅ All servers stopped"
