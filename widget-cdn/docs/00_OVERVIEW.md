# MVP Online Chat Widget — Overview

## Goal
Build an MVP of an online chat widget similar to JivoSite.

## Scope (MVP only)
- JS chat widget via <script>
- Admin panel for operators
- Real-time messaging (WebSocket)
- Multi-tenant (one server, many sites)
- Text chat only

## Out of scope
- AI
- CRM
- Omnichannel
- Billing
- Automation

## Architecture
Client (Website Widget)
→ API Server (NestJS + WebSocket)
→ Admin Panel (Next.js)

## Definition of Done
- Widget can be embedded on any website
- Messages appear in admin panel in real time
- Admin replies appear on website
- Each site sees only its own chats
