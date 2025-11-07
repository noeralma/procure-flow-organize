# Procure Flow Organize

Procure Flow Organize is a full-stack procurement management application. It provides secure authentication, rich data entry and management for procurement records (Pengadaan), and a modern UI built with React, shadcn/ui, and Tailwind CSS. The backend is a Node.js/Express API with TypeScript, MongoDB, JWT-based auth, robust validation, and production-ready middleware.

## Features

- Authentication with register, login, logout, refresh token, and profile.
- Role-based access control and route protection on the frontend.
- Procurement (Pengadaan) management with create, read, update, delete flows.
- Client-side validation using `react-hook-form` and `zod` with consistent error UI.
- Structured API client with `ApiError` preserving status/code/payload.
- CORS, Helmet, rate limiting, and centralized error handling on the backend.
- Backend tests using Jest and Supertest; in-memory MongoDB for test isolation.

## Tech Stack

- Frontend: React 18, Vite 5, TypeScript, shadcn/ui, Tailwind CSS, TanStack Query, react-hook-form, zod, React Router.
- Backend: Node.js, Express, TypeScript, Mongoose, JWT, express-validator/Joi, Helmet, CORS, express-rate-limit.
- Database: MongoDB.

## Monorepo Structure

```
procure-flow-organize/
├── backend/              # Express API (TypeScript)
│   ├── src/              # Server, routes, middleware, models, config
│   ├── tests/            # Jest + Supertest
│   ├── package.json      # Backend scripts
│   └── .env.example      # Backend environment variables
├── src/                  # Frontend React app (Vite)
│   ├── components/       # UI and feature components
│   ├── contexts/         # Auth and Theme providers
│   ├── services/         # API client and data services
│   ├── pages/            # App routes and pages
│   └── types/            # Shared TypeScript types
├── package.json          # Frontend scripts
└── .env.example          # Frontend environment variables
```

## Getting Started

### Prerequisites

- Node.js `>= 18`
- MongoDB running locally or accessible via URI

### Install Dependencies

Run the following in both the project root (frontend) and the `backend/` directory:

```
npm install
```

### Configure Environment Variables

- Frontend: copy `.env.example` to `.env` at the project root and adjust as needed.
- Backend: copy `backend/.env.example` to `backend/.env` and adjust secrets and URIs.

Key variables:

- Frontend `.env`:
  - `VITE_API_URL`: Base URL of the backend (default `http://localhost:5000`).
  - `VITE_NODE_ENV`: Frontend environment (`development`).
  - `VITE_DEBUG_API`: Optional debug flag (`false`).
  - `VITE_API_TIMEOUT`: Optional request timeout in ms (`10000`).

- Backend `.env`:
  - `PORT`: API server port (default `5000`).
  - `NODE_ENV`: `development` | `production` | `test`.
  - `MONGODB_URI`: MongoDB connection string.
  - `MONGODB_TEST_URI`: MongoDB URI for tests.
  - `JWT_SECRET`, `JWT_REFRESH_SECRET`: 32+ char secrets.
  - `JWT_EXPIRES_IN`, `JWT_REFRESH_EXPIRES_IN`: e.g. `7d`, `30d`.
  - `CORS_ORIGIN`: Comma-separated allowed origins. Set to your frontend dev origin, e.g. `http://localhost:8080`.
  - `RATE_LIMIT_WINDOW_MS`, `RATE_LIMIT_MAX_REQUESTS`: Rate limiting.
  - `MAX_FILE_SIZE`, `UPLOAD_PATH`: File upload limits and path.
  - `LOG_LEVEL`: `error` | `warn` | `info` | `debug`.
  - `API_VERSION`, `API_PREFIX`: API routing, defaults to `v1` and `/api`.

Note: The backend also supports multiple origins via comma-separated `CORS_ORIGIN`. Ensure it matches the actual frontend dev port that Vite chooses; if 8080 is occupied, Vite will pick the next available port (e.g., 8081) and log it.

### Run in Development

Start the backend in one terminal:

```
cd backend
npm run dev
```

Start the frontend in another terminal at the project root:

```
npm run dev
```

- Frontend dev server: `http://localhost:8080/` (Vite will choose a nearby port if busy).
- Backend API base: `http://localhost:5000/api/v1`.

### Build & Preview

- Frontend build:

```
npm run build
npm run preview
```

- Backend build and start:

```
cd backend
npm run build
npm run start
```

## Authentication

- Frontend stores `authToken` in `localStorage` on successful login.
- API requests include credentials with `fetch` using `credentials: 'include'` and a `Bearer` token when present.
- Core endpoints (prefix `/api/v1/auth`): `POST /register`, `POST /login`, `POST /logout`, `POST /refresh`, `GET /profile`, `PUT /profile`.
- Backend error handling returns consistent JSON; the frontend wraps errors as `ApiError` with `status`, `code`, and optional `data`.

## Procurement (Pengadaan)

- CRUD endpoints under `/api/v1/pengadaan`.
- Frontend hooks implement data fetching and mutations with TanStack Query.
- Types for Pengadaan are shared on the frontend under `src/types/pengadaan.ts` to align with the backend model.

## Testing

- Backend tests:

```
cd backend
npm test
```

- Uses Jest and Supertest with `mongodb-memory-server` for isolation.
- Frontend currently does not include unit tests; add tests as needed for critical UI and form logic.

## Security & Hardening

- Helmet for secure headers and CSP baseline.
- CORS configured from `CORS_ORIGIN` (supports multiple origins).
- Rate limiting with `express-rate-limit`.
- Centralized error handling and structured responses.
- Production guard ensures required secrets are present.

## API Discovery

- Visit `GET /api` for a JSON overview of available endpoints.
- Basic OpenAPI stub available at `GET /api/openapi.json`.

## Troubleshooting

- Frontend dev server port in use: Vite will auto-select the next available port (e.g., 8081). Update `CORS_ORIGIN` accordingly if you see CORS errors.
- CORS errors: Ensure `CORS_ORIGIN` includes your current frontend origin and that `VITE_API_URL` points to the backend.
- MongoDB connection issues: Verify `MONGODB_URI` and that MongoDB is running.
- Auth failures: Clear `localStorage` token and retry login; check backend logs.

## Contributing

- Use feature branches and conventional commits for clarity (e.g., `feat`, `fix`, `chore`).
- Run `npm run lint` in both frontend and backend before opening a PR.

## License

This project is licensed under the MIT License.
