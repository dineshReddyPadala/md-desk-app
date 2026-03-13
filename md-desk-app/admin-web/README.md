# MD Desk – Admin Web (Dashboard)

React-based admin dashboard for MD Desk. Used by staff to manage complaints, view reports, and respond to customer messages.

## Tech Stack

- **React** 18 with **TypeScript**
- **Vite** 5 (build and dev server)
- **Material UI (MUI)** 6 – components and theming
- **React Query (TanStack Query)** 5 – server state and caching
- **Axios** – HTTP client with interceptors
- **React Router** 6 – routing and protected routes

## Project Structure

```
admin-web/
├── public/
├── src/
│   ├── api/
│   │   ├── client.ts        # Axios instance, auth header, 401 logout
│   │   └── endpoints.ts     # API functions (auth, dashboard, complaints, messages)
│   ├── hooks/
│   │   └── useAuth.ts       # Auth state, login, logout, me
│   ├── layouts/
│   │   └── Layout.tsx       # App bar, drawer nav, outlet
│   ├── pages/
│   │   ├── LoginPage.tsx
│   │   ├── DashboardPage.tsx
│   │   ├── ComplaintsPage.tsx
│   │   ├── ComplaintDetailPage.tsx
│   │   ├── MessagesPage.tsx
│   │   └── ReportsPage.tsx
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
cd admin-web
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

App runs at **http://localhost:5173**.  
Default admin login (after seed): **admin@mddesk.com** / **admin123**.

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start Vite dev server (port 5173). |
| `npm run build` | TypeScript check + production build. |
| `npm run preview` | Serve production build locally. |
| `npm run lint` | Run ESLint. |

## Pages & Features

| Route | Page | Description |
|-------|------|-------------|
| `/login` | Login | Email/password; stores JWT in localStorage; redirects to dashboard. |
| `/dashboard` | Dashboard | Summary cards (total, pending, resolved, high priority); region and product bar charts; high-priority alert. |
| `/complaints` | Complaints | Table of all complaints with filters (city, status, priority), pagination, priority/status chips, “Open” to detail. |
| `/complaints/:id` | Complaint detail | Customer info, description, product/location, media (images/links), status dropdown and Update button. |
| `/messages` | Messages | Table of customer messages; “View / Reply” opens dialog with message body and reply form (or shows existing reply). |
| `/reports` | Reports | Region-wise and product-wise complaint tables. |

## Auth & API

- **Login:** `POST /auth/login`; on success, token is stored in `localStorage` and used for all API calls.
- **Axios:** `api` in `src/api/client.ts` adds `Authorization: Bearer <token>` and on `401` clears token and redirects to `/login`.
- **Protected routes:** Wrapped in `PrivateRoute`; unauthenticated users are redirected to `/login`.
- **useAuth:** Exposes `token`, `user`, `login`, `logout`, `isLoading`; optionally calls `/auth/me` when token exists.

## Theming

- MUI theme in `src/theme.ts` (primary blue, standard palette).
- Layout uses AppBar + Drawer; active nav item highlighted with primary color.

## Build & Deploy

- **Build:** `npm run build` → output in `dist/`.
- **Preview:** `npm run preview` to test the build.
- Deploy `dist/` to any static host (e.g. Nginx, Vercel, Netlify). Ensure `VITE_API_URL` is set for the build environment.
