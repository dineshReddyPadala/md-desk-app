# MD Desk App

Production-ready full-stack complaint management system.

## Documentation

| Document | Description |
|----------|-------------|
| [**docs/README.md**](docs/README.md) | Documentation index and links to all project docs |
| [**docs/ARCHITECTURE.md**](docs/ARCHITECTURE.md) | System architecture, data flow, and security |
| [**server/README.md**](server/README.md) | Backend API: setup, structure, full API reference |
| [**admin-web/README.md**](admin-web/README.md) | Admin dashboard: setup, pages, and features |
| [**customer-web/README.md**](customer-web/README.md) | Customer web app: setup, pages, and features |
| [**flutter_customer/README.md**](flutter_customer/README.md) | Flutter customer app: setup, routes, and integration |

## Tech Stack

- **Backend:** Node.js, Fastify, PostgreSQL, Prisma, JWT auth, AWS S3
- **Admin Web:** React, TypeScript, Material UI, React Query, Axios
- **Customer Web:** React, TypeScript, Material UI, React Query
- **Mobile:** Flutter (customer app scaffold)

## Project Structure

```
md-desk-app/
├── server/                 # Fastify API
├── admin-web/              # React admin dashboard (port 5173)
├── customer-web/            # React customer app (port 5174)
├── flutter_customer/        # Flutter customer app
├── .env                    # Environment variables (copy from server/.env.example)
└── README.md
```

## Prerequisites

- Node.js 18+
- PostgreSQL 14+
- (Optional) AWS account for S3 uploads
- (Optional) Flutter SDK for mobile app

## Installation & Run

### 1. Environment

Copy env and set values:

```bash
cd md-desk-app
cp server/.env.example .env   # or copy from existing .env
# Edit .env: DATABASE_URL, JWT_SECRET, AWS_* if using S3
```

### 2. Backend (Server)

```bash
cd server
npm install
npx prisma generate
npx prisma migrate deploy    # or: npx prisma migrate dev
npm run db:seed              # optional: admin user admin@mddesk.com / admin123
npm run dev                  # http://localhost:3000, API at /api/v1
```

- Health: `GET http://localhost:3000/health`
- Swagger: `http://localhost:3000/docs`

### 3. Admin Web

```bash
cd admin-web
npm install
cp .env.example .env         # set VITE_API_URL=http://localhost:3000/api/v1
npm run dev                  # http://localhost:5173
```

Login: use admin user from seed (e.g. `admin@mddesk.com` / `admin123`) or create admin in DB.

### 4. Customer Web

```bash
cd customer-web
npm install
cp .env.example .env         # set VITE_API_URL=http://localhost:3000/api/v1
npm run dev                  # http://localhost:5174
```

Register a customer account from the app.

### 5. Flutter Customer App

```bash
cd flutter_customer
flutter pub get
flutter run                  # requires Flutter SDK and device/emulator
```

Update API base URL in `lib/auth_provider.dart` (`_baseUrl`) for your environment.

## API Summary

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/register` | Customer registration |
| POST | `/api/v1/auth/login` | Login |
| GET | `/api/v1/auth/me` | Current user (JWT) |
| POST | `/api/v1/complaints` | Create complaint (multipart or JSON) |
| GET | `/api/v1/complaints/my` | My complaints (customer) |
| GET | `/api/v1/complaints/track/:complaintId` | Track by complaint ID |
| GET | `/api/v1/complaints/:id` | Get complaint by id |
| GET | `/api/v1/admin/complaints` | List all (admin, pagination/filters) |
| GET | `/api/v1/admin/complaints/high-priority` | High priority list |
| PUT | `/api/v1/admin/complaints/:id/status` | Update status |
| POST | `/api/v1/upload` | Upload file (S3) |
| POST | `/api/v1/messages` | Send message (customer) |
| GET | `/api/v1/messages/admin` | List messages (admin) |
| GET | `/api/v1/messages/admin/:id` | Get message |
| POST | `/api/v1/messages/admin/:id/reply` | Reply to message |
| GET | `/api/v1/admin/dashboard/summary` | Dashboard counts |
| GET | `/api/v1/admin/dashboard/region-stats` | Complaints by city |
| GET | `/api/v1/admin/dashboard/product-stats` | Complaints by product |
| GET | `/api/v1/products` | List products |
| GET | `/api/v1/dealers` | List dealers (?city= optional) |

## Database

PostgreSQL. Schema and migrations in `server/prisma/`. Entities: User, Complaint, ComplaintMedia, Message, Product, Dealer, AdminResponse.

## Roles

- **admin:** Dashboard, complaints, messages, reports, status updates
- **customer:** Register, login, raise complaint, track, message MD, products, dealers

## File Uploads

Accepted: jpg, png, pdf. Set `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `AWS_S3_BUCKET` in `.env` for S3. Without S3, upload endpoints will fail unless you add a local storage fallback.
