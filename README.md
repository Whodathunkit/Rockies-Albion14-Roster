# Rockies Albion 14 | Team Portal & Match Center

React + Vite + Tailwind CSS rewrite of the Calgary Rockies FC Albion 14 Boys U13 team portal.

## Features
- **Family & Player Portal**: Passcode protection gate (`albion14`, `1414`, or `rockies14`).
- **Spectator & Coach Modes**: PIN-protected coach mode (`1414` or `albion14`) for match controls, scorekeeping, scheduling, and standings editing.
- **Active Team Roster**: 12 active players, staff contacts, player profiles with photo lightbox, highlights, and custom video highlight attachments.
- **Live Match Center**: Real-time score tracker, match timer with periods, shootout tracker, match stats comparison bars, play-by-play events timeline, and past match history.
- **Season Fixtures & Training**: Complete 38-event authentic CMSA schedule with uniform guide, filters, and opposition record lookups from league standings.
- **CMSA League Standings**: Official Boys U13 Tier 2 table with coach editing and AI screenshot scanner.
- **Team Season Honors**: Golden Boot, Playmaker, Defensive Heroics, and MOTM leaderboards.
- **Firebase Real-Time Sync**: Real-time data sync with Firestore and offline fallback.

## Development
```bash
npm run dev
```
Dev server runs on port 3000.
