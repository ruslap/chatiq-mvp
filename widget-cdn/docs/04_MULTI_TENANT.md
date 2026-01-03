# Task: Multi-Tenant Logic

## Goal
Ensure data isolation between different websites.

## Rules
- Each site has unique siteId
- siteId belongs to exactly one user
- Admin sees chats only for owned sites

## Backend logic
- Validate siteId on every request
- Filter chats by siteId
- Prevent cross-site access

## Data model
User
  └─ Site
       └─ Chat
            └─ Message

## Deliverables
- Ownership checks implemented
- Data isolation verified
