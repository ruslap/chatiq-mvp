# Task: Chat Widget (CDN)

## Goal
Create a universal JavaScript chat widget delivered via CDN.

## Requirements
- Single JS file: widget.js
- Hosted via Vercel CDN
- Same file for all websites
- Reads siteId from data-site-id attribute

## Embed example
<script
  src="https://<cdn>.vercel.app/widget.js"
  data-site-id="SITE_ID">
</script>

## Functional requirements
- Read siteId from script tag
- Generate visitorId (localStorage)
- Connect to API via WebSocket
- Send visitor messages
- Receive admin messages
- Minimal UI (bubble + input)

## Technical constraints
- Vanilla JS (no React)
- Shadow DOM preferred
- No build step required

## Deliverables
- public/widget.js
- Working CDN URL
