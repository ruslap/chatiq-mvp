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

# Function to check service status
check_service() {
    local service_name=$1
    local pid_file="logs/${service_name}.pid"
    
    if [ -f "$pid_file" ]; then
        local pid=$(cat "$pid_file")
        if kill -0 "$pid" 2>/dev/null; then
            echo -e "${GREEN}✅ ${service_name} is running (PID: $pid)${NC}"
            return 0
        else
            echo -e "${RED}❌ ${service_name} is not running (stale PID file)${NC}"
            return 1
        fi
    else
        echo -e "${RED}❌ ${service_name} is not running${NC}"
        return 1
    fi
}

# Check all services
api_running=false
admin_running=false
widget_running=false

if check_service "api-server"; then
    api_running=true
fi

if check_service "admin-panel"; then
    admin_running=true
fi

if check_service "widget-cdn"; then
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
