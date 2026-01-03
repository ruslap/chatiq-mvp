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
    local pid_file="logs/${service_name}.pid"
    
    if [ -f "$pid_file" ]; then
        local pid=$(cat "$pid_file")
        if kill -0 "$pid" 2>/dev/null; then
            kill "$pid"
            echo -e "${GREEN}✅ ${service_name} stopped (PID: $pid)${NC}"
        else
            echo -e "${YELLOW}⚠️  ${service_name} was not running${NC}"
        fi
        rm "$pid_file"
    else
        echo -e "${YELLOW}⚠️  No PID file found for ${service_name}${NC}"
    fi
}

# Stop all services
stop_service "api-server"
stop_service "admin-panel"
stop_service "widget-cdn"

echo ""
echo -e "${GREEN}🎉 All services stopped!${NC}"
