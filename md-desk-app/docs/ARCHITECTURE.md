# MD Desk – Architecture Overview

## System Overview

MD Desk is a complaint management system with:

- **Backend API** – Single Fastify server exposing REST APIs; microservice-ready modular structure.
- **Admin Dashboard** – Web UI for staff to manage complaints, messages, and view reports.
- **Customer Web** – Web UI for customers to register, raise complaints, track status, and contact MD.
- **Customer Mobile** – Flutter app (scaffold) for the same customer flows on mobile.

```
                    ┌─────────────────┐
                    │   Admin Web     │  (React, port 5173)
                    │   (Dashboard)   │
                    └────────┬────────┘
                             │
                    ┌────────┴────────┐
                    │                 │
             ┌──────┴──────┐   ┌──────┴──────┐
             │ Customer   │   │   Flutter    │
             │ Web (React)│   │ Customer App │
             │ port 5174  │   │              │
             └──────┬──────┘   └──────┬──────┘
                    │                 │
                    └────────┬────────┘
                             │ HTTP/REST + JWT
                    ┌────────┴────────┐
                    │  Fastify Server  │  (port 3000, /api/v1)
                    │  (Node.js)       │
                    └────────┬────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
       ┌──────┴──────┐ ┌─────┴─────┐ ┌─────┴─────┐
       │ PostgreSQL  │ │  AWS S3   │ │  (Cache)  │
       │   (Prisma) │ │ (uploads) │ │ in-memory │
       └────────────┘ └───────────┘ └───────────┘
```

## Backend Architecture

- **Pattern:** Clean, MVC-style: routes → controllers → services → Prisma (data).
- **Modules:** `auth`, `complaints`, `messages`, `dashboard`, `products`, `dealers`, `upload`.
- **Plugins:** Prisma, CORS, multipart, Swagger, optional cache, JWT and role middleware.
- **Config:** Central `src/config`, env via `dotenv`.

## Data Flow

1. **Authentication:** Client sends credentials → server validates → returns JWT. Subsequent requests send `Authorization: Bearer <token>`.
2. **Complaints:** Customer submits form (and optional files) → server uploads files to S3 (if configured) → creates complaint and complaint_media → returns `complaint_id` for tracking.
3. **Admin:** Admin uses dashboard/complaints/messages/reports; all admin routes require JWT with role `ADMIN`.

## Roles & Authorization

| Role     | Capabilities |
|----------|----------------|
| `ADMIN`  | Dashboard, list/update complaints, view/update status, list/reply messages, region/product reports, high-priority list. |
| `CUSTOMER` | Register, login, create complaint, list own complaints, track by complaint ID, send messages, list products, list dealers. |

## Security

- Passwords hashed with bcrypt.
- JWT for session; validate on protected routes via `authenticateJWT`.
- Role checks via `authorizeRole(['ADMIN'])` where needed.
- CORS restricted to configured origins (admin/customer web URLs).

## File Uploads

- Allowed types: jpg, png, pdf.
- Upload flow: `POST /upload` (single file) or multipart on `POST /complaints`; files stored in AWS S3; URLs saved in `complaint_media` (or returned for upload endpoint).

## Caching

- Dashboard summary, region-stats, and product-stats use an in-memory cache with configurable TTL to reduce DB load. Redis can be wired in by replacing the cache plugin.
