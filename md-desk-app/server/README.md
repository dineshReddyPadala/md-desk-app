# MD Desk – Server (Backend API)

Node.js backend for the MD Desk complaint management system. Built with **Fastify**, **Prisma** (PostgreSQL), and **JWT** authentication.

## Tech Stack

- **Runtime:** Node.js 18+
- **Framework:** Fastify 4.x
- **Database:** PostgreSQL 14+, Prisma ORM
- **Auth:** JWT (jsonwebtoken), bcrypt
- **File storage:** AWS S3 (aws-sdk)
- **Docs:** Swagger (OpenAPI) via @fastify/swagger and @fastify/swagger-ui

## Project Structure

```
server/
├── prisma/
│   ├── schema.prisma      # Data models and migrations
│   ├── seed.js            # Seed script (admin user, sample products)
│   └── migrations/        # SQL migrations
├── src/
│   ├── app.js             # Application entry, plugin registration
│   ├── config/            # Environment and app config
│   ├── plugins/           # Fastify plugins (prisma, swagger, cache)
│   ├── middleware/        # authenticateJWT, authorizeRole, errorHandler
│   ├── routes/            # Route registration (prefixes, admin routes)
│   ├── modules/           # Feature modules (MVC-style)
│   │   ├── auth/
│   │   ├── complaints/
│   │   ├── messages/
│   │   ├── dashboard/
│   │   ├── products/
│   │   ├── dealers/
│   │   └── upload/
│   ├── services/          # Shared services (e.g. S3)
│   └── utils/             # Logger and helpers
├── package.json
├── nodemon.json
└── .env.example
```

## Setup

### Prerequisites

- Node.js 18+
- PostgreSQL 14+ (running and reachable)
- (Optional) AWS account and S3 bucket for file uploads

### Installation

```bash
cd server
npm install
```

### Environment

Create or copy `.env` in the **repository root** (or in `server/` and load it from `app.js`). Example variables (see `server/.env.example`):

| Variable | Description |
|----------|-------------|
| `NODE_ENV` | `development` or `production` |
| `PORT` | Server port (default `3000`) |
| `API_PREFIX` | API path prefix (default `/api/v1`) |
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Secret for signing JWTs (use a strong value in production) |
| `JWT_EXPIRES_IN` | Token expiry (e.g. `7d`) |
| `AWS_ACCESS_KEY_ID` | AWS key (for S3) |
| `AWS_SECRET_ACCESS_KEY` | AWS secret |
| `AWS_REGION` | e.g. `us-east-1` |
| `AWS_S3_BUCKET` | Bucket name for uploads |
| `ADMIN_WEB_URL` | Allowed CORS origin for admin (e.g. `http://localhost:5173`) |
| `CUSTOMER_WEB_URL` | Allowed CORS origin for customer (e.g. `http://localhost:5174`) |
| `LOG_LEVEL` | Log level (e.g. `info`) |

### Database

```bash
npx prisma generate
npx prisma migrate deploy    # Apply migrations
# or for development with new migrations:
npx prisma migrate dev --name your_migration_name
```

### Seed (optional)

Creates an admin user and sample products:

```bash
npm run db:seed
```

Default admin: **admin@mddesk.com** / **admin123** (change in production.)

### Run

```bash
npm run dev    # Nodemon, watches src and prisma
# or
npm start      # node src/app.js
```

- **Base URL:** `http://localhost:3000`
- **API base:** `http://localhost:3000/api/v1`
- **Health:** `GET http://localhost:3000/health`
- **Swagger UI:** `http://localhost:3000/docs`

## API Reference

All API paths below are relative to the base URL + `API_PREFIX` (e.g. `http://localhost:3000/api/v1`).  
Protected routes require header: `Authorization: Bearer <JWT>`.

### Authentication

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/auth/register` | No | Customer registration. Body: `name`, `email`, `password`; optional: `phone`, `city`. Returns `user` and `token`. |
| POST | `/auth/login` | No | Login. Body: `email`, `password`. Returns `user` and `token`. |
| GET | `/auth/me` | JWT | Current user profile. |

### Complaints (Customer)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/complaints` | JWT | Create complaint. Body (JSON or multipart): `name`, `phone`, `city`, `product_used`, `project_location`, `description`, `priority` (high/medium/low). Optional: `photos` (files). Returns `complaint_id`, `id`. |
| GET | `/complaints/my` | JWT | List current user’s complaints. Query: `page`, `limit`, `status`, `priority`. |
| GET | `/complaints/track/:complaintId` | JWT | Get complaint by human-readable ID (e.g. `MD-20250313-XXXX`) for current user. |
| GET | `/complaints/:id` | JWT | Get complaint by internal `id` (customer sees own only). |

### Complaints (Admin)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/admin/complaints` | JWT + Admin | List all complaints. Query: `page`, `limit`, `status`, `priority`, `city`. |
| GET | `/admin/complaints/high-priority` | JWT + Admin | List high-priority complaints. Query: `page`, `limit`. |
| PUT | `/admin/complaints/:id/status` | JWT + Admin | Update status. Body: `status` (RECEIVED \| UNDER_REVIEW \| IN_PROGRESS \| RESOLVED). |

### Upload

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/upload` | JWT | Upload a single file. Multipart field: `file`. Allowed: jpg, png, pdf. Returns `file_url`, `file_type`. |
| POST | `/upload/multiple` | JWT | Upload multiple files. Returns `files` array with `file_url`, `file_type`. |

### Messages

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/messages` | JWT | Send message to MD. Body: `subject`, `message`. |
| GET | `/messages/admin` | JWT + Admin | List all messages. Query: `page`, `limit`. |
| GET | `/messages/admin/:id` | JWT + Admin | Get message by id. |
| POST | `/messages/admin/:id/reply` | JWT + Admin | Reply to message. Body: `reply`. |

### Dashboard (Admin)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/admin/dashboard/summary` | JWT + Admin | Counts: `total`, `pending`, `resolved`, `highPriority`. |
| GET | `/admin/dashboard/region-stats` | JWT + Admin | Complaints grouped by city. |
| GET | `/admin/dashboard/product-stats` | JWT + Admin | Complaints grouped by product. |

### Products & Dealers (Public / No auth)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/products` | No | List products. |
| GET | `/dealers` | No | List dealers. Query: `city` (optional filter). |

## Database Schema (Summary)

- **users** – id, name, phone, email, password, role (ADMIN/CUSTOMER), city, timestamps.
- **complaints** – id, complaint_id (unique code), user_id, product_used, project_location, description, priority, status, name/phone/city (optional overrides), timestamps.
- **complaint_media** – id, complaint_id, file_url, file_type.
- **messages** – id, user_id, subject, message, admin_reply, replied_at, created_at.
- **products** – id, name, description.
- **dealers** – id, name, city, phone, location_lat, location_long.
- **admin_responses** – id, complaint_id, message, created_by, created_at.

See `prisma/schema.prisma` for full model and enum definitions.

## Scripts

| Script | Description |
|--------|-------------|
| `npm start` | Run production server. |
| `npm run dev` | Run with nodemon. |
| `npm run db:generate` | Generate Prisma client. |
| `npm run db:migrate` | Run migrations (dev). |
| `npm run db:migrate:prod` | Deploy migrations (production). |
| `npm run db:studio` | Open Prisma Studio. |
| `npm run db:seed` | Run seed script. |

## Error Handling

- Global error handler in `src/middleware/errorHandler.js`.
- Validation errors return `400` with `errors` array.
- Unauthorized/forbidden return `401`/`403` with `message`.
- Server errors return `500` with a generic message in production.

## Adding a New Module

1. Create folder under `src/modules/<name>/` with `*.routes.js`, `*.controller.js`, `*.service.js`, and optionally `*.validation.js`.
2. Register routes in `src/routes/index.js` with the desired prefix and any auth/role hooks.
