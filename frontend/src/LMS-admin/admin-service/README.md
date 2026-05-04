# LMS Backend (Node.js / Express)

Domain-oriented port of the Laravel LMS backend at `../` (Laravel root). Mirrors the existing MySQL schema — no migrations are owned here yet; Laravel remains the source of truth for schema until that changes.

## Stack

- **Express 5** — HTTP layer
- **Sequelize 6** — ORM over the existing `lms` MySQL schema (read/write, no migrations)
- **Zod** — request validation
- **bcrypt** — password hashing, with `$2y$ → $2b$` normalization so Laravel-created hashes verify here
- **jsonwebtoken** — access (15m) + refresh (30d) tokens
- **helmet / cors / compression / morgan** — standard security + ops middleware
- **nodemailer** — SMTP mailing
- **multer** — multipart uploads
- **stripe** — payment processor (optional)

## Folder layout

```
backend/
├── src/
│   ├── config/              # env.js, db.js — env parsing + Sequelize instance
│   ├── models/              # 62 Sequelize models + index.js (associations)
│   ├── modules/             # one folder per domain (routes/controller/service/validators)
│   │   ├── auth/            # fully implemented (register, login, refresh, password reset, email verify)
│   │   ├── blog/ bootcamp/ cart/ category/ certificate/ chat/ ...
│   │   └── index.js         # mounts every module under /api/<name>
│   ├── shared/
│   │   ├── errors/          # AppError (statusCode + details)
│   │   ├── mail/            # nodemailer wrapper
│   │   ├── middleware/      # auth, validate, error
│   │   ├── storage/         # local disk driver (S3 stubbed)
│   │   └── utils/           # hash, jwt, token, slug, pagination, asyncHandler, removeScripts
│   ├── app.js               # express setup: helmet/cors/compression/morgan + static + /api
│   └── server.js            # DB connect + listen + graceful shutdown
├── scripts/scaffold_modules.js  # one-shot module skeleton generator (safe to delete)
├── .env.example
└── package.json
```

## Module anatomy

Every domain folder under `src/modules/` follows the same shape:

```
modules/<domain>/
├── <domain>.routes.js      # express Router — mounts at /api/<domain>
├── <domain>.controller.js  # thin HTTP adapter (async wrappers)
├── <domain>.service.js     # business logic — imports from src/models
└── <domain>.validators.js  # Zod schemas (body / query / params)
```

The **auth** module is fully ported from the Laravel auth controllers; all others are scaffolded stubs marked with `TODO:` and a reference to the Laravel controller(s) they should replicate.

## Running

```bash
cd backend
npm install
cp .env.example .env   # fill DB_*, JWT_*, MAIL_*
npm run dev            # nodemon src/server.js
# or
npm start              # node src/server.js
```

Health check: `GET http://localhost:4000/health`
Auth endpoints: `POST /api/auth/register`, `/api/auth/login`, etc.

## Laravel ↔ Node parity notes

- **Password hashes** — `shared/utils/hash.js` normalizes the `$2y$` prefix (Laravel) to `$2b$` (bcrypt npm). Existing user logins continue working.
- **Device fingerprint** — `base64(user_id + user_agent)`, same as Laravel's `device_ips` usage.
- **Email verification hash** — `sha1(email)`, matching Laravel's signed-route hash.
- **Password reset TTL** — 60 minutes, token stored hashed in `password_reset_tokens`.
- **Rate limits** — 20/15min on credential endpoints, 5/hour on forgot-password.
- **Validation errors** — Zod returns 422 with `{ error, details }`, matching the Laravel 422 shape.
- **Sequelize errors** — `UniqueConstraintError` → 409, `ValidationError` → 422 (see `shared/middleware/error.middleware.js`).

## Porting workflow (for stubbed modules)

1. Open the Laravel controller referenced in the module's `TODO:` comment.
2. Copy each action into the module's `service.js` (pure logic) and `controller.js` (HTTP).
3. Add Zod schemas in `validators.js` matching the Laravel `FormRequest` / inline `validate()`.
4. Wire routes in `<domain>.routes.js`.
5. Models are already registered — just `const { Course } = require('../../models')`.
