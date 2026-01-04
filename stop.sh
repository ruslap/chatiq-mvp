#!/bin/bash

# ChatIQ MVP - Stop Script
# This script stops all running services

echo "🛑 Stopping ChatIQ MVP services..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to stop a service
stop_service() {
    local service_name=$1
    local port=$2
    local pid_file="logs/${service_name}.pid"

    # First, kill all processes on the port (this gets child processes)
    local pids_on_port=$(lsof -ti :$port 2>/dev/null)
    if [ -n "$pids_on_port" ]; then
        echo "$pids_on_port" | xargs kill 2>/dev/null
        sleep 0.5
        # Force kill if still alive
        echo "$pids_on_port" | xargs kill -9 2>/dev/null
        echo -e "${GREEN}✅ ${service_name} stopped (Port: $port)${NC}"
    fi

    # Then clean up PID file and its process if different
    if [ -f "$pid_file" ]; then
        local pid=$(cat "$pid_file")
        if kill -0 "$pid" 2>/dev/null; then
            # Kill main process and its children
            pkill -9 -P "$pid" 2>/dev/null
            kill -9 "$pid" 2>/dev/null
        fi
        rm "$pid_file"
    fi

    # Final check - if port still in use, force kill
    local remaining=$(lsof -ti :$port 2>/dev/null)
    if [ -n "$remaining" ]; then
        echo "$remaining" | xargs kill -9 2>/dev/null
        echo -e "${YELLOW}⚠️  Force killed remaining processes on port $port${NC}"
    fi
}

# Stop all services (service_name, port)
stop_service "api-server" 3000
stop_service "admin-panel" 3001
stop_service "widget-cdn" 3002

# Clean up any remaining Next.js processes (zombie hunters!)
echo ""
echo -n "Checking for zombie processes... "
ZOMBIES=$(pgrep -f "next-server|webpack-loaders" 2>/dev/null || true)
if [ -n "$ZOMBIES" ]; then
    echo "$ZOMBIES" | xargs kill -9 2>/dev/null
    echo -e "${YELLOW}⚠️  Killed zombie Next.js processes${NC}"
else
    echo -e "${GREEN}none found${NC}"
fi

echo ""
echo -e "${GREEN}🎉 All services stopped!${NC}"
