#!/bin/bash

# AuraFlow Restart Script
# Stops everything and starts fresh

echo "🔄 Restarting AuraFlow..."
echo ""

# Stop everything first
./stop-all.sh

echo ""
echo "Waiting 2 seconds..."
sleep 2

# Start everything
./start-all.sh
