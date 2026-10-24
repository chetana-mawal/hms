# Run Guide

This project has a React frontend and an Express API. The backend stores data in memory, so MongoDB or any other database is not required. Data is cleared whenever the backend process restarts.

## Requirements

- Node.js and npm

## Start the backend

Open a terminal in the project folder and run:

```powershell
cd backend
npm install
npm start
```

The API listens on `http://localhost:5000`. Leave this terminal running.

## Start the frontend

Open a second terminal in the project folder and run:

```powershell
cd frontend
npm install
npm run dev
```

Open the local URL printed by Vite. The frontend uses the backend API at `http://localhost:5000`.

## Development mode

Run `npm run dev` instead of `npm start` in the backend directory to restart the API automatically when backend files change.

## Data and authentication

Rooms, users, customers, bookings, and payments exist only for the lifetime of the backend process. Restarting it clears the data and invalidates existing login tokens. Set `JWT_SECRET` in `backend/.env` to a long, random secret so tokens remain valid for the lifetime of the running process.

## Demo login

In development (when `NODE_ENV` is not `production`), the backend creates these demo accounts at startup:

| Role | Email | Password |
| --- | --- | --- |
| Admin | `admin@havenhouse.demo` | `HavenAdmin!2026` |
| Customer | `guest@havenhouse.demo` | `HavenGuest!2026` |

Use the administrator account to add rooms, then sign in as the customer to try browsing and booking. These are public demo credentials, not production secrets. Demo accounts are not created when `NODE_ENV=production`.

## Administrator setup

Set a private administrator setup key in `backend/.env` before creating the first administrator:

```env
JWT_SECRET=replace-with-a-long-random-secret
ADMIN_SETUP_KEY=replace-with-a-different-private-random-key
```

Start the backend and frontend, choose **Create an account**, then select **Set up an administrator account** and enter the configured key. Keep this key private; registrations without the valid key can only create customer accounts. If no setup key is configured, administrator registration is disabled.

## Roles and access

- **Admin:** manage rooms, view and manage all bookings, and create reservations for guests.
- **Staff:** manage rooms and all bookings; room deletion is reserved for admins.
- **Customer:** browse rooms, book available rooms, view only their own bookings, and cancel their pending or confirmed stays.

These permissions are enforced by the API as well as reflected in the frontend. New customer accounts receive their own guest profile automatically. Guest records and payment operations are restricted to hotel staff and administrators.
