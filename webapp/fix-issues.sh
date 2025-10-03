#!/bin/bash

# AuraFlow Quick Fix Script
# Resolves common issues with service workers and caching

echo "🔧 AuraFlow Quick Fix Script"
echo "=============================="
echo ""

# Check if we're in the right directory
if [ ! -f "index.html" ]; then
    echo "❌ Error: Please run this script from the webapp directory"
    echo "   cd webapp && ./fix-issues.sh"
    exit 1
fi

echo "✓ Running from webapp directory"
echo ""

# Check if required files exist
echo "📁 Checking required files..."
required_files=("index.html" "app.js" "core-logic.js" "web-platform-services.js" "service-worker.js" "style.css" "manifest.json")

for file in "${required_files[@]}"; do
    if [ -f "$file" ]; then
        echo "  ✓ $file"
    else
        echo "  ❌ $file - MISSING!"
    fi
done

echo ""

# Check for syntax errors in JavaScript files
echo "🔍 Checking for syntax errors..."
for jsfile in app.js core-logic.js web-platform-services.js service-worker.js; do
    if command -v node &> /dev/null; then
        if node -c "$jsfile" 2>/dev/null; then
            echo "  ✓ $jsfile - No syntax errors"
        else
            echo "  ❌ $jsfile - SYNTAX ERROR!"
            node -c "$jsfile"
        fi
    else
        echo "  ⚠️  Node.js not found, skipping syntax check"
        break
    fi
done

echo ""

# Provide instructions
echo "📋 Next Steps:"
echo ""
echo "1. Clear browser cache:"
echo "   - Open DevTools (F12)"
echo "   - Go to Application tab"
echo "   - Click 'Clear storage'"
echo "   - Check all boxes and click 'Clear site data'"
echo ""
echo "2. Start the server (if not running):"
echo "   npx serve webapp"
echo ""
echo "3. Open diagnostic page:"
echo "   http://localhost:3000/diagnostic.html"
echo ""
echo "4. If service worker issues persist:"
echo "   - Open browser console (F12)"
echo "   - Run: navigator.serviceWorker.getRegistrations().then(r => r.forEach(reg => reg.unregister()))"
echo "   - Reload the page"
echo ""
echo "5. Make sure backend is running:"
echo "   cd battle-of-the-bots && npm start"
echo ""

# Check if backend is running
echo "🔌 Checking backend connection..."
if command -v curl &> /dev/null; then
    if curl -s http://localhost:3000/api/health > /dev/null 2>&1; then
        echo "  ✓ Backend is running on port 3000"
    else
        echo "  ❌ Backend is not responding"
        echo "     Start it with: cd battle-of-the-bots && npm start"
    fi
else
    echo "  ⚠️  curl not found, skipping backend check"
fi

echo ""
echo "✅ Fix script complete!"
echo ""
echo "If issues persist, check:"
echo "  - webapp/TROUBLESHOOTING.md"
echo "  - http://localhost:3000/diagnostic.html"
