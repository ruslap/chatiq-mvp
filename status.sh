#!/bin/bash

# ChatIQ MVP - Status Script
# This script checks the status of all services

echo "📊 ChatIQ MVP Service Status"
echo "============================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to check if port is in use (using curl for reliability)
check_port() {
    local port=$1
    # Try curl first (more reliable for Next.js)
    curl -s -o /dev/null -m 2 http://localhost:$port 2>/dev/null && return 0
    # Fallback to lsof
    lsof -i :$port -sTCP:LISTEN -t >/dev/null 2>&1 && return 0
    return 1
}

# Function to check service status
check_service() {
    local service_name=$1
    local port=$2
    local pid_file="logs/${service_name}.pid"
    local pid_running=false
    local port_in_use=false

    # Check if port is in use
    if check_port "$port"; then
        port_in_use=true
        local actual_pid=$(lsof -ti :$port 2>/dev/null | head -1)
    fi

    # Check PID file
    if [ -f "$pid_file" ]; then
        local pid=$(cat "$pid_file")
        if kill -0 "$pid" 2>/dev/null; then
            pid_running=true
        fi
    fi

    # Report status
    if [ "$port_in_use" = true ]; then
        if [ "$pid_running" = true ]; then
            echo -e "${GREEN}✅ ${service_name} is running (Port: $port, PID: $pid)${NC}"
        else
            echo -e "${YELLOW}⚠️  ${service_name} is running on port $port (PID: $actual_pid) but PID file is stale${NC}"
        fi
        return 0
    elif [ "$pid_running" = true ]; then
        echo -e "${YELLOW}⚠️  ${service_name} has PID file but port $port is not in use${NC}"
        return 1
    else
        echo -e "${RED}❌ ${service_name} is not running${NC}"
        return 1
    fi
}

# Check all services
api_running=false
admin_running=false
widget_running=false

if check_service "api-server" 3000; then
    api_running=true
fi

if check_service "admin-panel" 3001; then
    admin_running=true
fi

if check_service "widget-cdn" 3002; then
    widget_running=true
fi

echo ""
echo -e "${BLUE}📍 Service URLs:${NC}"
if [ "$api_running" = true ]; then
    echo -e "   • API Server:     ${YELLOW}http://localhost:3000${NC}"
else
    echo -e "   • API Server:     ${RED}Not available${NC}"
fi

if [ "$admin_running" = true ]; then
    echo -e "   • Admin Panel:    ${YELLOW}http://localhost:3001${NC}"
else
    echo -e "   • Admin Panel:    ${RED}Not available${NC}"
fi

if [ "$widget_running" = true ]; then
    echo -e "   • Widget CDN:     ${YELLOW}http://localhost:3002${NC}"
else
    echo -e "   • Widget CDN:     ${RED}Not available${NC}"
fi

echo ""
echo -e "${BLUE}📋 Management commands:${NC}"
echo -e "   • Start services:  ${YELLOW}./start.sh${NC}"
echo -e "   • Stop services:   ${YELLOW}./stop.sh${NC}"
echo -e "   • View logs:       ${YELLOW}tail -f logs/[service-name].log${NC}"
