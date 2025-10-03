#!/bin/bash

# AuraFlow Web App - Local Server Startup Script
# This script starts a local HTTP server for testing the web application

echo "🚀 Starting AuraFlow Web Application Server..."
echo ""

# Check if Python 3 is available
if command -v python3 &> /dev/null; then
    echo "✓ Python 3 found"
    echo "📡 Starting server on http://localhost:8080"
    echo ""
    echo "Press Ctrl+C to stop the server"
    echo ""
    python3 -m http.server 8080
    exit 0
fi

# Check if Python 2 is available
if command -v python &> /dev/null; then
    echo "✓ Python 2 found"
    echo "📡 Starting server on http://localhost:8080"
    echo ""
    echo "Press Ctrl+C to stop the server"
    echo ""
    python -m SimpleHTTPServer 8080
    exit 0
fi

# Check if Node.js is available
if command -v npx &> /dev/null; then
    echo "✓ Node.js found"
    echo "📡 Starting server on http://localhost:8080"
    echo ""
    echo "Press Ctrl+C to stop the server"
    echo ""
    npx serve -p 8080
    exit 0
fi

# No suitable server found
echo "❌ Error: No suitable HTTP server found"
echo ""
echo "Please install one of the following:"
echo "  - Python 3: https://www.python.org/downloads/"
echo "  - Node.js: https://nodejs.org/"
echo ""
echo "Or manually start a server with:"
echo "  python3 -m http.server 8080"
echo "  npx serve -p 8080"
exit 1
