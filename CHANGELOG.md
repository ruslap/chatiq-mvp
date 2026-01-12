# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added
- Redis infrastructure: `RedisModule` and `RedisService` in `api-server`.
- Redis connectivity verification script: `api-server/scripts/verify-redis.ts`.
- DTOs for request validation across `auth`, `automation`, `chat`, and `sites` modules.
- `lib/api-config.ts` in `admin-panel` for centralized API URL management.
- **Sound notifications**: Added sound effects for new messages in admin panel (similar to chat widget).
- **Sound toggle**: Added sound mute/unmute button in chat view header with persistent localStorage setting.

### Fixed
- **Security**: Added `@UseGuards(AuthGuard('jwt'))` to `ChatController`, `AutomationController`, and `WidgetSettingsController`.
- **Security**: Implemented Tenant Isolation in `AutomationService` (added `siteId` checks to avoid cross-site data leaks).
- **Standards**: Replaced `console.log` with NestJS `Logger` in `ChatGateway`, `AutomationService`, `AuthService`, etc.
- **Standards**: Replaced generic `Error` with specific NestJS Exceptions (`NotFoundException`, `BadRequestException`).
- **Quality**: Removed hardcoded API URLs in `UploadController`, now using `API_URL` environment variable.
- **Quality**: Improved error handling and validation using `class-validator` and DTOs.

### Infrastructure
- Added `dotenv` as a dev dependency in `api-server`.
- Added `REDIS_URL` to environment variables.
