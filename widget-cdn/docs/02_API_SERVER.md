# Task: API Server (NestJS)

## Goal
Build a backend server handling real-time chat communication.

## Stack
- NestJS
- Socket.IO
- PostgreSQL
- Prisma
- JWT Auth

## WebSocket events
- visitor:join
- visitor:message
- admin:join
- admin:message

## Data handling
- Accept siteId + visitorId from widget
- Route messages to correct admin
- Persist messages in database

## Non-functional requirements
- CORS enabled
- Basic validation
- Clear logging for debugging

## Deliverables
- NestJS project
- WebSocket Gateway
- Message routing logic
