# MD Desk – Web & Flutter Customer App Alignment

This document defines how the **customer-web** (React) and **flutter_customer** (Flutter) apps stay aligned for UI/UX and functionality.

---

## 1. Brand & Theme

| Element | Value |
|--------|--------|
| **Primary** | `#0097d7` (blue) |
| **Secondary** | `#f37336` (orange) |
| **Auth screen background** | Gradient: `135deg, #0097d7 0%, #0080b8 50%, #f37336 100%` |
| **App name** | MD Desk |
| **Logo** | Techno Paints logo (e.g. `TP-logo-1-1024x164-1.webp`) on auth screens where applicable |

- Web: `customer-web/src/theme.ts` and inline gradient on Login/Register.
- Flutter: `ThemeData` in `main.dart` with `ColorScheme` and same gradient on login/register screens.

---

## 2. Routes / Screens (Must Match)

| Route | Screen | Description |
|-------|--------|-------------|
| `/login` | Login | Email or phone + password |
| `/register` | Register | 2-step: send OTP → enter OTP + password + details |
| `/dashboard` | Dashboard | Home with 5 action cards |
| `/raise-complaint` | Raise Complaint | Form + photo upload, returns complaint ID |
| `/track` | Track Complaint | Enter complaint ID, show status timeline |
| `/message-md` | Message MD | Send message + list of messages with admin replies |
| `/products` | Products | List products (search optional) |
| `/dealers` | Dealer Locator | List dealers, filter by city |

- Web: React Router under `Layout` (drawer + app bar).
- Flutter: GoRouter with a shell (drawer + app bar) for all authenticated routes.

---

## 3. Auth

### Login
- **Field**: Single field “Email or phone” (accepts email or phone number).
- **API**: `POST /api/v1/auth/login` with either `{ email, password }` or `{ phone, password }`.
- **UI**: Gradient background, card layout, “Don’t have an account? Register” link.

### Register
- **Flow**: Two steps: (1) Name + Email → Send OTP; (2) OTP + Password + Confirm + optional Phone, City → Register.
- **APIs**: `POST /api/v1/auth/send-otp` (body: `{ email }`), then `POST /api/v1/auth/register` with `name, email, otp, password, confirmPassword, phone?, city?`.
- **UI**: Same gradient as login, “Already have an account? Sign In” link.

---

## 4. Authenticated Layout (Shell)

- **App bar**: Title “MD Desk”, menu (drawer toggle), notifications (web), profile/logout.
- **Drawer**: Same 6 items on both platforms:
  - Dashboard  
  - Raise Complaint  
  - Track Complaint  
  - Message MD  
  - Products  
  - Dealer Locator  
- **Logout**: Clears token and redirects to `/login`.

Web already has notifications and profile menu; Flutter can add them when backend is ready.

---

## 5. Dashboard

- **Exactly 5 cards**, same order and copy:
  1. **Raise Complaint** – “Submit a new complaint with photos” → `/raise-complaint`
  2. **Track Complaint** – “Check status with your complaint ID” → `/track`
  3. **Message MD** – “Send suggestions or feedback” → `/message-md`
  4. **Products** – “Product information” → `/products`
  5. **Dealer Locator** – “Find dealers by city” → `/dealers`

- Each card: icon, title, short subtitle, primary action (button or tap).

---

## 6. Feature Parity

### Raise Complaint
- **Fields**: Name, Phone, City, Product (dropdown from `/products`), Project location, Description, Priority (low/medium/high), Attachments (photos/PDF).
- **API**: `POST /api/v1/complaints` as `multipart/form-data`; response includes `complaint_id`.
- **After submit**: Show success with complaint ID and link/button to Track.

### Track Complaint
- **Input**: Complaint ID (e.g. MD-20250313-XXXX).
- **API**: `GET /api/v1/complaints/track/:complaintId` (auth required).
- **Display**: Status timeline (RECEIVED → UNDER_REVIEW → IN_PROGRESS → RESOLVED), description, product, location, attachments (images/files).

### Message MD
- **Form**: Subject, Message → `POST /api/v1/messages`.
- **List**: “My messages” from `GET /api/v1/messages/my`; each item shows subject, message, admin reply (if any), repliedAt.

### Products
- **API**: `GET /api/v1/products` (no auth or with auth per backend).
- **UI**: Grid/list of name, description, optional image; optional search.

### Dealer Locator
- **API**: `GET /api/v1/dealers?city=` (optional city filter).
- **UI**: Filter by city, list of name, city, phone, optional image.

---

## 7. API Base URL

- **Web**: From env (e.g. Vite `VITE_API_URL`).
- **Flutter**: From env (e.g. `.env` + flutter_dotenv) or build config; same base path `/api/v1` and same endpoints.

---

## 8. Checklist for New Features

When adding a feature:
- [ ] Same route/screen name on web and Flutter.
- [ ] Same API endpoint and request/response shape.
- [ ] Same copy (titles, subtitles, buttons) where applicable.
- [ ] Brand colors and gradient used on auth and primary actions.
- [ ] Dashboard card added on **both** apps if it’s a main action.
