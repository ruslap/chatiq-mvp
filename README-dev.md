# ChatIQ MVP - Local Development Setup

## Quick Start

### 🚀 Start all services
```bash
./start.sh
```

### 🛑 Stop all services
```bash
./stop.sh
```

### 📊 Check service status
```bash
./status.sh
```

## Services

| Service | Technology | Port | URL |
|---------|------------|------|-----|
| API Server | NestJS | 3000 | http://localhost:3000 |
| Admin Panel | Next.js | 3001 | http://localhost:3001 |
| Widget CDN | Static | 3002 | http://localhost:3002 |

## Manual Start (Alternative)

If you prefer to start services manually:

```bash
# Terminal 1 - API Server
cd api-server
npm run start:dev

# Terminal 2 - Admin Panel  
cd admin-panel
npm run dev

# Terminal 3 - Widget CDN
cd widget-cdn
npm run dev
```

## Logs

All logs are stored in the `logs/` directory:
- `logs/api-server.log` - API server logs
- `logs/admin-panel.log` - Admin panel logs
- `logs/widget-cdn.log` - Widget CDN logs

View logs in real-time:
```bash
tail -f logs/api-server.log
tail -f logs/admin-panel.log
tail -f logs/widget-cdn.log
```

## Requirements

- Node.js (v18 or higher)
- npm
- Git

## Project Structure

```
chatiq-mvp/
├── api-server/     # NestJS backend API
├── admin-panel/    # Next.js admin interface
├── widget-cdn/     # Static widget files
├── logs/           # Service logs
├── start.sh        # Start all services
├── stop.sh         # Stop all services
└── status.sh       # Check service status
```
