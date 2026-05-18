# Horse Racing Tournament Management System — Mobile (Expo React Native)

## Run

```bash
npm install
npm run start
```

## API hookup

- If `EXPO_PUBLIC_API_BASE_URL` is **not** set, the app uses in-app mock data.
- When your Node.js backend is ready, set `EXPO_PUBLIC_API_BASE_URL` (e.g. `http://localhost:3000`) and expose the same routes.

Example:

```bash
# Windows PowerShell
$env:EXPO_PUBLIC_API_BASE_URL="http://localhost:3000"
npm run start
```

## Implemented screens (minimal)

- Auth: Login / Register (role-based dev login)
- Home: role-based navigation
- Common: Tournaments, Races
- Owner: Horses
- Jockey: Invites
- Spectator: Predictions
- Referee: Race Operations, Report (placeholder)
- Admin: User Management, Scheduling (placeholder)
