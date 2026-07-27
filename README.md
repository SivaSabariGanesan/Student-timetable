<p align="center">
  <img src="https://capsule-render.vercel.app/api?type=waving&color=0:646CFF,100:339933&height=180&section=header&text=Rajalakshmi%20Timetable%20Portal&fontSize=36&fontColor=ffffff&animation=fadeIn&fontAlignY=38&desc=CSV%20%E2%86%92%20Searchable%2C%20Role-Gated%20Timetable%20System&descAlignY=58&descSize=16" width="100%" alt="header" />
</p>

<p align="center">
  <img src="https://readme-typing-svg.demolab.com?font=Fira+Code&weight=500&size=20&pause=1000&color=339933&center=true&vCenter=true&width=650&lines=React+%2B+Vite+%2B+Tailwind+frontend;Node.js+%2B+Express+%2B+PostgreSQL+backend;3-tier+role-based+auth+with+JWT;CSV+imports+%E2%86%92+searchable+timetables" alt="Typing SVG" />
</p>

<p align="center">
  <img alt="Node" src="https://img.shields.io/badge/Node.js-20%2B-339933?logo=node.js&logoColor=white">
  <img alt="React" src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black">
  <img alt="Vite" src="https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white">
  <img alt="Postgres" src="https://img.shields.io/badge/PostgreSQL-Neon-4169E1?logo=postgresql&logoColor=white">
  <img alt="Redis" src="https://img.shields.io/badge/Redis-Cache-DC382D?logo=redis&logoColor=white">
  <img alt="License" src="https://img.shields.io/badge/License-MIT-informational">
</p>

<p align="center">
  <img src="https://skillicons.dev/icons?i=react,vite,tailwind,nodejs,express,postgres,redis,js&theme=dark" alt="tech stack" />
</p>

---

## Table of contents

- [Stack ](#stack)
- [Project structure](#project-structure)
- [Getting started](#getting-started)
- [Default accounts](#default-accounts)
- [User roles](#user-roles)
- [Pages](#pages)
- [Features](#features)
- [Data model notes](#data-model-notes)
- [Backend scripts](#backend-scripts)
- [Production build](#production-build)
- [Linting](#linting)
- [Roadmap](#roadmap)
- [License](#license)

---

## Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite 8, Tailwind CSS 3, Recharts, React Router 7 |
| Backend | Node.js, Express 4, PostgreSQL (Neon), Redis (cache invalidation) |
| Auth | bcrypt password hashing, JWT session tokens (httpOnly cookies), 3-tier role system |

---

## Project structure

```
Student-timetable/
├── backend/                  Node.js + Express API
│   └── src/
│       ├── config/           Database + env config
│       ├── controllers/      auth, users, students, rooms, faculty, …
│       ├── middleware/        authenticate, authorize (role hierarchy)
│       ├── routes/           REST route definitions
│       ├── scripts/          seed.js, createSuperuser.js, reimport_all.py, import scripts
│       └── services/         store builder (CSV → DB → JSON)
├── public/data/              CSV source files
│   ├── student_selections_all_depts.csv
│   ├── theory_schedule.csv
│   └── lab_schedule.csv
└── src/                      React frontend
    ├── components/           Navbar, TimetableGrid, FilterPanel, …
    ├── context/              AuthContext, DataContext, ThemeContext
    ├── pages/                Dashboard, StudentSearch, RoomSearch, …
    ├── services/             api.js, dataStore.js, csvLoader.js
    └── utils/                time.js, colors.js
```

---

## Getting started

### Prerequisites

- Node.js 20+
- Python 3.10+ (only needed for the `reimport_all.py` repair/migration script)
- A PostgreSQL database (configured for [Neon](https://neon.tech) serverless Postgres)
- Redis (used for cache invalidation on data re-imports)

### 1. Backend setup

```bash
cd backend
npm install
```

Create `backend/.env` (copy from `backend/env.example`):

```env
DATABASE_URL=postgresql://<user>:<password>@<host>/<db>?sslmode=require
JWT_SECRET=a-long-random-secret-string
PORT=3001
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
REDIS_URL=redis://localhost:6379
```

Seed the database (creates schema, default users, and imports all CSV data):

```bash
npm run seed
```

Start the API server:

```bash
npm run dev       # auto-restarts on file changes (node --watch)
# or
npm start         # production start
```

The API runs on `http://localhost:3001`.

### 2. Frontend setup

```bash
# from the project root
npm install
npm run dev       # http://localhost:5173
```

---

## Default accounts

These are created by `npm run seed` in the backend:

| Role | Email | Password |
|---|---|---|
| Superuser | superuser@rajalakshmi.edu.in | super123 |
| Admin | admin@rajalakshmi.edu.in | admin123 |

> ⚠️ Change these passwords immediately after first login in a production deployment.

---

## User roles

The system has three tiers. A higher role always passes gates set for lower roles.

### Superuser
- Created only via the CLI tool (not through the UI):
  ```bash
  cd backend
  node src/scripts/createSuperuser.js <email> "<name>" <password>
  ```
- Can create, promote, demote, and delete admin and user accounts.
- Cannot modify other superuser accounts.

### Admin
- Can view all admin and user accounts on the User Management page.
- Can promote a user → admin.
- Cannot demote or delete other admins or superusers.

### User
- Standard authenticated access to the timetable portal.
- No access to User Management.

---

## Pages

| Route | Page | Access |
|---|---|---|
| `/login` | Sign in | Public |
| `/` | Dashboard | All authenticated |
| `/students` | Find Student | All authenticated |
| `/students/:reg` | Student Profile | All authenticated |
| `/explore` | Explore Timetable | All authenticated |
| `/rooms` | Room Search | All authenticated |
| `/faculty` | Faculty Search | All authenticated |
| `/users` | User Management | Admin + Superuser only |

The app redirects unauthenticated visitors to `/login`. Authenticated users visiting `/login` are redirected to `/`.

---

## Features

**Dashboard** — student/faculty/room/subject counts, classes-today count, and four charts: students by semester, classes by time slot (chronological), busiest rooms, and faculty workload top-10.

**Find Student** — autocomplete search by register number or name. Name queries sort alphabetically; register queries sort numerically.

**Student Profile** — profile card with department/semester/section, a live split-flap "current class" board (auto-refreshes every 30 s), today's class list, and a full weekly timetable grid. Sessions are sorted day → time ascending throughout.

**Explore** — combinable filters: register/name, day, time slot, room, faculty, semester, department, section. Results on mobile are stacked cards; on desktop a compact table. Sorted by day+time ascending.

**Rooms** — browse every room sorted by usage. Select one to see its full weekly occupancy with per-session attendee estimates. Mobile uses a drill-down (list → detail → back).

**Faculty** — same pattern as Rooms, showing each faculty member's weekly teaching load.

**User Management** — admin/superuser-only page. Mobile shows per-user cards; desktop shows a sortable table. The create-user modal slides up from the bottom on mobile.

---

## Data model notes

- A student's timetable is built from `student_selections_all_depts.csv`, which already carries course, faculty, room and the `slots` column (day + time for every meeting). No join is required against the master schedule for the student view.
- Rooms and Faculty views read from `theory_schedule.csv` / `lab_schedule.csv` as the authoritative source for room numbers, blocks and capacities.
- The "students attending" count on Room/Faculty views is a best-effort match on **course code + semester** — it's an estimate, not an exact roster, because the two data sources don't share a clean join key.
- Theory slots with ambiguous hours (1–7) are normalized to PM in `src/utils/time.js` to match the campus clock convention.

---

## Backend scripts

| Script | Command | Purpose |
|---|---|---|
| Full seed | `npm run seed` | Schema + default users + all CSV data |
| Create superuser | `node src/scripts/createSuperuser.js <email> "<name>" <password>` | Add/reset a superuser from the terminal |
| Import selections | `npm run import:selections` | Re-import student selections CSV only |
| Import timetable | `npm run import:timetable` | Re-import theory + lab CSVs only |
| Full re-import (repair) | `python src/scripts/reimport_all.py --repair` | Idempotent re-import across all CSVs; safely preserves existing production timetable data (e.g. 4th-year sections) instead of overwriting it, and invalidates the Redis cache afterward |

> The `--repair` flag is the safe path for re-running imports against a live database — prefer it over a full `npm run seed` once the portal is in production, since `seed` recreates schema and default accounts from scratch.

---

## Production build

```bash
# Frontend
npm run build      # outputs to dist/
npm run preview    # serve the production build locally

# Backend
NODE_ENV=production node src/server.js
```

Set `NODE_ENV=production` in the backend `.env` to enable secure cookie flags and stricter CORS.

The frontend `dist/` folder is fully static and can be served from any CDN or static host (Vercel, Netlify, Cloudflare Pages, S3 + CloudFront). The backend must remain a running Node process (Railway, Render, Fly.io, a VPS, etc.).

---

## Linting

```bash
npm run lint      # runs oxlint on the frontend source
```

---

## Roadmap

- [ ] Exact roster matching for Room/Faculty attendee counts (pending a shared join key across CSV sources)
- [ ] Automated CSV validation on import (schema + slot-format checks before writing to Postgres)
- [ ] Audit log for User Management actions (promote/demote/delete)

---

## License

MIT — see `LICENSE` for details.

<p align="center">
  <img src="https://capsule-render.vercel.app/api?type=waving&color=0:339933,100:646CFF&height=120&section=footer" width="100%" alt="footer" />
</p>
