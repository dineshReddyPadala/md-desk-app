# MD Desk – Customer Web

React-based customer-facing web app for MD Desk. Customers can register, raise complaints, track status, send messages to MD, view products, and find dealers.

## Tech Stack

- **React** 18 with **TypeScript**
- **Vite** 5 (build and dev server)
- **Material UI (MUI)** 6 – components and theming
- **React Query (TanStack Query)** 5 – server state and caching
- **Axios** – HTTP client with interceptors
- **React Router** 6 – routing and protected routes

## Project Structure

```
customer-web/
├── public/
├── src/
│   ├── api/
│   │   ├── client.ts        # Axios instance, auth header, 401 logout
│   │   └── endpoints.ts     # API functions (auth, complaints, messages, products, dealers, upload)
│   ├── hooks/
│   │   └── useAuth.ts       # Auth state, register, login, logout, me
│   ├── layouts/
│   │   └── Layout.tsx       # App bar, drawer nav, outlet
│   ├── pages/
│   │   ├── LoginPage.tsx
│   │   ├── RegisterPage.tsx
│   │   ├── DashboardPage.tsx
│   │   ├── RaiseComplaintPage.tsx
│   │   ├── TrackComplaintPage.tsx
│   │   ├── MessageMDPage.tsx
│   │   ├── ProductsPage.tsx
│   │   └── DealerLocatorPage.tsx
│   ├── App.tsx              # Routes, private route wrapper
│   ├── main.tsx             # React root, QueryClient, Router, Theme
│   └── theme.ts             # MUI theme
├── index.html
├── vite.config.ts
├── tsconfig.json
├── package.json
└── .env.example
```

## Setup

### Prerequisites

- Node.js 18+
- Backend API running (see [server/README.md](../server/README.md))

### Installation

```bash
cd customer-web
npm install
```

### Environment

Copy `.env.example` to `.env` and set the API base URL:

```env
VITE_API_URL=http://localhost:3000/api/v1
```

For production, set `VITE_API_URL` to your deployed API URL.

### Run

```bash
npm run dev
```

App runs at **http://localhost:5174**.  
Users must **register** (or log in) to raise complaints and track them.

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start Vite dev server (port 5174). |
| `npm run build` | TypeScript check + production build. |
| `npm run preview` | Serve production build locally. |
| `npm run lint` | Run ESLint. |

## Pages & Features

| Route | Page | Description |
|-------|------|-------------|
| `/login` | Login | Email/password; link to register. |
| `/register` | Register | Name, email, password, optional phone/city; creates customer account. |
| `/dashboard` | Dashboard | Shortcuts to Raise Complaint, Track, Message MD. |
| `/raise-complaint` | Raise complaint | Form: name, phone, city, product used, project location, description, priority, file input (photos). On success shows complaint ID and link to track. |
| `/track` | Track complaint | Input complaint ID (e.g. MD-20250313-XXXX); shows status and stepper (Received → Under review → In progress → Resolved). |
| `/message-md` | Message MD | Subject and message; submit sends to admin; success message shown. |
| `/products` | Products | List of products (name, description) from API. |
| `/dealers` | Dealer locator | City filter and list of dealers (name, city, phone, coordinates note). Map can be added via maps package. |

## Auth & API

- **Register:** `POST /auth/register`; **Login:** `POST /auth/login`. Token stored in `localStorage`.
- **Axios:** `api` in `src/api/client.ts` adds `Authorization: Bearer <token>` and on `401` clears token and redirects to `/login`.
- **Protected routes:** All routes except `/login` and `/register` require auth via `PrivateRoute`.
- **useAuth:** Exposes `token`, `user`, `register`, `login`, `logout`, `isLoading`.

## Complaints & Upload

- **Create complaint:** `RaiseComplaintPage` builds `FormData` with fields and `photos` (files); `POST /complaints` with multipart. Backend returns `complaint_id` for tracking.
- **Track:** `GET /complaints/track/:complaintId` returns the complaint for the logged-in user; status shown in a stepper.

## Build & Deploy

- **Build:** `npm run build` → output in `dist/`.
- **Preview:** `npm run preview` to test the build.
- Deploy `dist/` to any static host. Set `VITE_API_URL` for the build environment.
