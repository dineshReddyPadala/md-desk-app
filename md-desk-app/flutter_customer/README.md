# MD Desk – Flutter Customer App

Flutter customer app for MD Desk. Scaffold with auth (login/register), navigation, and placeholder screens for complaints, tracking, messages, products, and dealer locator. Ready to be wired to the same backend API as the customer web app.

## Tech Stack

- **Flutter** 3.x (SDK ^3.5.0)
- **go_router** – Declarative routing
- **provider** – State management (e.g. auth)
- **http** – HTTP client for API calls
- **shared_preferences** – Persist JWT

## Project Structure

```
flutter_customer/
├── lib/
│   ├── main.dart              # App entry, Provider, GoRouter config
│   ├── api/
│   │   └── client.dart        # ApiClient (get/post, Bearer token, error handling)
│   ├── auth_provider.dart     # Token, user, login, register, clearToken
│   └── screens/
│       ├── login_screen.dart
│       ├── register_screen.dart
│       ├── dashboard_screen.dart
│       ├── raise_complaint_screen.dart
│       ├── track_complaint_screen.dart
│       ├── message_md_screen.dart
│       ├── products_screen.dart
│       └── dealer_locator_screen.dart
├── pubspec.yaml
└── README.md
```

## Setup

### Prerequisites

- Flutter SDK 3.5+ (`flutter doctor`)
- Android Studio / Xcode for device/emulator (or Chrome for web)

### Installation

```bash
cd flutter_customer
flutter pub get
```

### API Base URL

Edit `lib/auth_provider.dart` and set `_baseUrl` to your API base (e.g. `http://localhost:3000/api/v1` for local, or your deployed API URL). For device/emulator, use your machine’s IP instead of `localhost` if the API runs on the host.

### Run

```bash
flutter run
```

Choose a device/emulator when prompted. For web: `flutter run -d chrome`.

## Routes

| Route | Screen | Description |
|-------|--------|-------------|
| `/login` | Login | Email/password; calls `AuthProvider.login`; navigates to `/dashboard`. |
| `/register` | Register | Name, email, password, phone, city; calls `AuthProvider.register`; navigates to `/dashboard`. |
| `/dashboard` | Dashboard | List of actions: Raise Complaint, Track, Message MD, Products, Dealer Locator; logout in app bar. |
| `/raise-complaint` | Raise complaint | Placeholder; integrate multipart form + `POST /complaints` using `AuthProvider.token`. |
| `/track` | Track complaint | Placeholder; integrate `GET /complaints/track/:complaintId` and status timeline. |
| `/message-md` | Message MD | Placeholder; integrate `POST /messages` with subject and message. |
| `/products` | Products | Placeholder; integrate `GET /products`. |
| `/dealers` | Dealer locator | Placeholder; integrate `GET /dealers?city=`; optional map using `location_lat`/`location_long`. |

## Auth

- **AuthProvider** (in `lib/auth_provider.dart`): Holds `token`, `user`; methods `login`, `register`, `clearToken`. Token is saved with `SharedPreferences` and applied to API requests via `ApiClient`.
- **ApiClient** (in `lib/api/client.dart`): `baseUrl`, optional `token`; `get(path)`, `post(path, body)`; sets `Authorization: Bearer` when token is set; throws `ApiException` on non-2xx.

## Integration Notes

1. **Token:** After login/register, set `ApiClient.token = AuthProvider().token` (or pass token into client per request). Ensure the same `ApiClient` (or base URL + token) is used for all authenticated calls.
2. **Complaints:** Use `http.MultipartRequest` or a package like `http_parser`/multipart to send form + files to `POST /complaints`.
3. **Track:** Call `GET /complaints/track/:complaintId` with the user-visible complaint ID; display status steps (RECEIVED → UNDER_REVIEW → IN_PROGRESS → RESOLVED).
4. **Map:** For dealer locator, use `google_maps_flutter` or similar and pass `location_lat`, `location_long` from the dealers API.

## Build

```bash
flutter build apk        # Android
flutter build ios        # iOS (on macOS)
flutter build web        # Web
```

## Documentation

- Main repo: [MD Desk README](../README.md)
- API reference: [Server README](../server/README.md)
- Architecture: [docs/ARCHITECTURE.md](../docs/ARCHITECTURE.md)
