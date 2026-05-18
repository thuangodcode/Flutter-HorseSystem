# Horse Racing Tournament Management System — Web (React)

## Run

```bash
npm install
npm run dev
```

## Login background image

The login/register hero background defaults to `public/login-bg.svg`.

To override it, put your image at:

- `public/login-bg.png`

This file is gitignored by default.

## API hookup

- Dev mode uses MSW to mock endpoints under `/api/*`.
- When your Node.js backend is ready, set `VITE_API_BASE_URL` (e.g. `http://localhost:3000`) and make sure the backend exposes the same routes.

Example:

```bash
# Windows PowerShell
$env:VITE_API_BASE_URL="http://localhost:3000"
npm run dev
```

## Implemented screens (minimal)

- Auth: Login / Register (role-based dev login)
- Common: Dashboard, Tournaments, Races
- Owner: Horses
- Jockey: Invites
- Spectator: Predictions
- Referee: Race Operations, Report (placeholder)
- Admin: User Management, Scheduling (placeholder)
