#!/bin/bash

# ChatIQ MVP - Quick Start Script
# This script starts all three components of the project locally

echo "🚀 Starting ChatIQ MVP project locally..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check if Node.js is installed
if ! command_exists node; then
    echo -e "${RED}❌ Node.js is not installed. Please install Node.js first.${NC}"
    exit 1
fi

# Check if npm is installed
if ! command_exists npm; then
    echo -e "${RED}❌ npm is not installed. Please install npm first.${NC}"
    exit 1
fi

echo -e "${BLUE}📦 Installing dependencies...${NC}"

# Install dependencies for all components
echo "Installing API Server dependencies..."
cd api-server && npm install
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Failed to install API Server dependencies${NC}"
    exit 1
fi

echo "Installing Admin Panel dependencies..."
cd ../admin-panel && npm install
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Failed to install Admin Panel dependencies${NC}"
    exit 1
fi

echo "Installing Widget CDN dependencies..."
cd ../widget-cdn && npm install
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Failed to install Widget CDN dependencies${NC}"
    exit 1
fi

cd ..

echo -e "${GREEN}✅ Dependencies installed successfully!${NC}"
echo -e "${BLUE}🏃 Starting all services...${NC}"

# Create logs directory if it doesn't exist
mkdir -p logs

# Function to start a service in background and create a log file
start_service() {
    local service_name=$1
    local service_dir=$2
    local service_command=$3
    local log_file="logs/${service_name}.log"
    
    echo -e "${YELLOW}🔄 Starting ${service_name}...${NC}"
    
    cd "$service_dir"
    nohup $service_command > "../$log_file" 2>&1 &
    local pid=$!
    cd ..
    
    echo "$pid" > "logs/${service_name}.pid"
    echo -e "${GREEN}✅ ${service_name} started (PID: $pid)${NC}"
    echo -e "${BLUE}📝 Logs: $log_file${NC}"
}

# Start all services
start_service "api-server" "api-server" "npm run start:dev"
start_service "admin-panel" "admin-panel" "npm run dev"
start_service "widget-cdn" "widget-cdn" "npm run dev"

echo ""
echo -e "${GREEN}🎉 All services started successfully!${NC}"
echo ""
echo -e "${BLUE}📍 Service URLs:${NC}"
echo -e "   • API Server:     ${YELLOW}http://localhost:3000${NC}"
echo -e "   • Admin Panel:    ${YELLOW}http://localhost:3001${NC}"
echo -e "   • Widget CDN:     ${YELLOW}http://localhost:3002${NC}"
echo ""
echo -e "${BLUE}📋 Management commands:${NC}"
echo -e "   • Stop all services:  ${YELLOW}./stop.sh${NC}"
echo -e "   • View logs:         ${YELLOW}tail -f logs/[service-name].log${NC}"
echo -e "   • Check status:      ${YELLOW}./status.sh${NC}"
echo ""
echo -e "${GREEN}✨ Happy coding! ✨${NC}"
