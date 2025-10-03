#!/bin/bash

# Check if servers are running

echo "🔍 Checking AuraFlow Servers..."
echo ""

# Check backend (port 3000)
echo "Backend (port 3000):"
if lsof -i :3000 > /dev/null 2>&1; then
    echo "✅ Backend is running"
    curl -s http://localhost:3000/api/health | head -1
else
    echo "❌ Backend is NOT running"
    echo "   Start with: cd battle-of-the-bots && npm start"
fi

echo ""

# Check webapp (port 5000)
echo "Webapp (port 5000):"
if lsof -i :5000 > /dev/null 2>&1; then
    echo "✅ Webapp is running"
    echo "   URL: http://localhost:5000"
else
    echo "❌ Webapp is NOT running"
    echo "   Start with: npx serve webapp"
fi

echo ""
echo "================================"

# Summary
BACKEND_RUNNING=$(lsof -i :3000 > /dev/null 2>&1 && echo "yes" || echo "no")
WEBAPP_RUNNING=$(lsof -i :5000 > /dev/null 2>&1 && echo "yes" || echo "no")

if [ "$BACKEND_RUNNING" = "yes" ] && [ "$WEBAPP_RUNNING" = "yes" ]; then
    echo "✅ Both servers are running!"
    echo ""
    echo "Test authentication:"
    echo "  http://localhost:5000"
elif [ "$BACKEND_RUNNING" = "yes" ]; then
    echo "⚠️  Backend is running but webapp is not"
    echo ""
    echo "Start webapp:"
    echo "  npx serve webapp"
elif [ "$WEBAPP_RUNNING" = "yes" ]; then
    echo "⚠️  Webapp is running but backend is not"
    echo ""
    echo "Start backend:"
    echo "  cd battle-of-the-bots && npm start"
else
    echo "❌ Neither server is running"
    echo ""
    echo "Start both:"
    echo "  ./start-all.sh"
fi

echo ""
