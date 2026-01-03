# Security Notes (MVP)

## Scope
Basic protection only. Advanced security is out of scope.

---

## Widget Security
- widget.js is public
- siteId is not secret
- No sensitive data in widget

---

## API Security
- Validate siteId exists
- Reject unknown siteId
- Rate-limit messages per visitor

---

## Admin Security
- JWT authentication
- Admin can access only owned siteIds
- Backend validates ownership on every request

---

## WebSocket Rules
- Admin socket must authenticate
- Visitor socket is anonymous
- Rooms separated by siteId

---

## Data Isolation
- Every query filtered by siteId
- Never trust client-provided chatId alone

---

## Explicit Non-Goals (MVP)
- No encryption beyond HTTPS
- No IP whitelisting
- No advanced bot protection

---

## Future Improvements
- Domain validation
- Signed widget tokens
- Abuse detection
- Audit logs
