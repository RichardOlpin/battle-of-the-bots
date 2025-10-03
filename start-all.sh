#!/bin/bash

# AuraFlow Complete Startup Script
# Starts backend and webapp together

echo "🚀 Starting AuraFlow..."
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if port 3000 is in use
echo "Checking port 3000..."
if lsof -i :3000 > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Port 3000 is already in use${NC}"
    echo "Finding process..."
    PID=$(lsof -t -i :3000)
    echo "Process ID: $PID"
    echo -e "${YELLOW}Killing process $PID...${NC}"
    kill $PID 2>/dev/null
    sleep 2
    echo -e "${GREEN}✓ Port 3000 is now free${NC}"
else
    echo -e "${GREEN}✓ Port 3000 is available${NC}"
fi

echo ""
echo "======================================"
echo "  Starting Backend Server"
echo "======================================"
echo ""

# Start backend in background
cd battle-of-the-bots
npm start &
BACKEND_PID=$!

echo -e "${BLUE}Backend PID: $BACKEND_PID${NC}"
echo "Waiting for backend to start..."
sleep 3

# Check if backend started successfully
if ps -p $BACKEND_PID > /dev/null; then
    echo -e "${GREEN}✓ Backend is running${NC}"
else
    echo -e "${RED}✗ Backend failed to start${NC}"
    exit 1
fi

echo ""
echo "======================================"
echo "  Starting Webapp Server"
echo "======================================"
echo ""

# Go back to root and start webapp on port 5000
cd ..
npx serve webapp -l 5000 &
WEBAPP_PID=$!

echo -e "${BLUE}Webapp PID: $WEBAPP_PID${NC}"
echo "Waiting for webapp to start..."
sleep 3

# Check if webapp started successfully
if ps -p $WEBAPP_PID > /dev/null; then
    echo -e "${GREEN}✓ Webapp is running${NC}"
else
    echo -e "${RED}✗ Webapp failed to start${NC}"
    kill $BACKEND_PID 2>/dev/null
    exit 1
fi

echo ""
echo "======================================"
echo "  ✅ AuraFlow is Running!"
echo "======================================"
echo ""
echo -e "${GREEN}Backend:${NC} http://localhost:3000/api/health"
echo -e "${GREEN}Webapp:${NC}  http://localhost:5000 (or check output above)"
echo ""
echo -e "${BLUE}📋 Next Steps:${NC}"
echo "1. Open webapp: http://localhost:5000"
echo "2. Open diagnostic: http://localhost:5000/diagnostic.html"
echo "3. Load Chrome extension from: auraflow-extension/"
echo ""
echo -e "${YELLOW}To stop all servers:${NC}"
echo "  kill $BACKEND_PID $WEBAPP_PID"
echo ""
echo "Or press Ctrl+C to stop this script (servers will keep running)"
echo ""

# Save PIDs to file for easy cleanup
echo "$BACKEND_PID" > .backend.pid
echo "$WEBAPP_PID" > .webapp.pid

echo "PIDs saved to .backend.pid and .webapp.pid"
echo ""

# Keep script running
wait