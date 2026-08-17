# MoSec — Monitoring & Security

MoSec is a **lab operations monitoring & security system** for teaching labs. It watches each lab's **door lock** and **projector** through IoT sensors, cross-references live **room borrowings** (from BINUS Messier / Bluejack), and flags security incidents — rooms left **unlocked while not borrowed** or **projectors left on**. It also automates common lab-assistant chores such as **Flazz card tap-in** and **briefing PowerPoint generation**.

The system is made of four cooperating parts: **IoT firmware** (ESP32 sensors), a **Nuxt web dashboard**, a **Python (FastAPI) briefing service**, and a **Tauri desktop kiosk**.

---

## Table of contents

- [Architecture](#architecture)
- [Repository layout](#repository-layout)
- [How it works (data flow)](#how-it-works-data-flow)
- [Features](#features)
- [Components](#components)
  - [1. Web dashboard (Nuxt)](#1-web-dashboard-nuxt)
  - [2. IoT firmware (ESP32)](#2-iot-firmware-esp32)
  - [3. Briefing service (Python / FastAPI)](#3-briefing-service-python--fastapi)
  - [4. Desktop kiosk (Tauri)](#4-desktop-kiosk-tauri)
- [Getting started](#getting-started)
- [Environment variables](#environment-variables)
- [Dummy IoT sender](#dummy-iot-sender)
- [Database schema](#database-schema)
- [Web API reference](#web-api-reference)
- [Tech stack](#tech-stack)
- [Notes & known gaps](#notes--known-gaps)

---

## Architecture

```mermaid
flowchart LR
    subgraph Lab["Physical lab"]
        Door["Door reed switch\n(ESP32)"]
        Proj["Projector LDR sensor\n(ESP32)"]
        Nfc["Flazz NFC reader\n(ESP32 / MFRC522)"]
    end

    subgraph Web["Nuxt web app"]
        API["Server API\n(/api/*)"]
        UI["Dashboard UI"]
    end

    DB[("PostgreSQL")]
    Messier["Messier / Bluejack API\n(borrowings, auth, schedule)"]
    Py["Python FastAPI\n(briefing PPT)"]
    Desk["Tauri desktop kiosk"]

    Door -- "POST door state" --> API
    Proj -- "POST light value" --> API
    Nfc -- "POST card UID" --> API
    API <--> DB
    API <--> Messier
    UI -- reads --> API
    API -- proxy --> Py
    Desk -- serial --> Nfc
    Desk --> API
    Desk --> Py
    Py --> Messier
```

---

## Repository layout

```
Even-2526-FB-NG-OI/
├── MoSec_Monitoring_and_Security/
│   ├── NuxtJS/                 # Web dashboard (Nuxt 4 + PostgreSQL) — the core app
│   ├── ERD/ , query.sql , dummyData.sql , Feature.xlsx   # design docs & SQL
│   └── Setup Documentation.docx
├── IoT/ArduinoIDE/
│   ├── Door/                   # Reed-switch door lock sensor (ESP32)
│   ├── Projector/              # LDR projector on/off sensor (ESP32)
│   └── flazz-tap/              # MFRC522 NFC Flazz card reader (ESP32)
├── PythonServer/               # FastAPI service that generates briefing PPTX
├── mosec_desktop/              # Tauri (Rust + Vue) lab-assistant kiosk
├── PPT/                        # PowerPoint briefing templates
└── TransactionSchedule.json    # Sample class/transaction schedule data
```

---

## How it works (data flow)

**1. Sensing (IoT → API → DB)**
- The **door** sensor detects open/closed via a reed switch and `POST`s to `/api/door`; each change is stored as a row in `door_lock_history`.
- The **projector** sensor reads ambient light (LDR); when the lux crosses a threshold it `POST`s to `/api/projector`, which opens/closes a session in `projector_history` (so uptime can be summed).

**2. Context (Messier borrowings)**
- The app calls the **Messier / Bluejack** API for the list of **active room borrowings today**. A room that is borrowed is "legitimately in use"; a room that is **not** borrowed but reads **unlocked** (or projector on) becomes a **security warning / incident**.

**3. Analytics & dashboard**
- The Nuxt analytics endpoints read the latest door/projector state + uptime from PostgreSQL, combine it with borrowings, and serve the dashboard: active labs, warnings, unlock incidents (live + monthly history), projector uptime per room, power estimate, and per-shift analytics.

**4. Lab-assistant automation**
- A **Flazz card tap** (NFC) identifies the assistant/room; the desktop kiosk or web shows the current room transaction and can **generate a briefing PPT** via the Python service, which pulls the schedule + course data from Bluejack and fills PPTX templates (with QR codes).

---

## Features

**Monitoring & security**
- Live **door lock** and **projector on/off** state per lab.
- **Unlock incidents** — rooms unlocked while *not* borrowed (live count + by-month history).
- **Projector-left-on** incidents.
- **Room status** logic: `Active` (borrowed), `Warning` (unlocked/projector on, not borrowed), `Inactive` (secure).

**Analytics**
- Building-wide **projector uptime** (this week) and **power consumption** estimate.
- **Per-room** uptime, daily breakdown, and **per-shift** analytics (07:00–19:00 windows) for a selectable date.
- Quick-access grid of all labs with status badges.

**Reports**
- **Card-tap transactions** log and **room lock history**, filterable by date range, paginated. (Excel/PDF export is stubbed.)

**Automation**
- **Flazz card** tap-in (NFC) and mapping to Messier credentials.
- **Briefing PPT** generation (quiz / UAP templates) with auto-filled schedule and QR codes.

**Auth**
- Login with **Messier (Bluejack)** credentials, or via a **Flazz card** mapped to stored Messier credentials.

**Dev tooling**
- A **dummy IoT sender** that simulates the hardware by POSTing to the real API, so the whole system runs without physical devices — with a configurable, realistic incident rate.

---

## Components

### 1. Web dashboard (Nuxt)

`MoSec_Monitoring_and_Security/NuxtJS/` — the core application. Nuxt 4 (Vue 3, Nitro server routes), Drizzle ORM over PostgreSQL.

**Pages**

| Route | Purpose |
|-------|---------|
| `/login` | Messier / Flazz login |
| `/dashboard` | Global Overview — active labs, warnings, unlock incidents, projector uptime, power |
| `/dashboard/labs/[status]` | Rooms filtered by `active` / `warning` |
| `/dashboard/incidents` | Unlock incidents — live "right now" + by-month history |
| `/dashboard/projector` | Projector uptime per room + building totals |
| `/room` | Lab Monitoring — all labs grid |
| `/room/[id]` | Room detail — door/projector state, incidents this month, projector analytics |
| `/projector` | Projector Analytics — pick a lab + date for daily/shift breakdown |
| `/report` | Reports & Activity Logs — transactions & lock history |
| `/settings` | Account, preferences, system info |

### 2. IoT firmware (ESP32)

`IoT/ArduinoIDE/` — Arduino sketches for ESP32, connecting over campus **WPA2-Enterprise** WiFi. Copy `secrets.example.h` → `secrets.h` and fill in WiFi + server URL + room id before flashing.

| Device | Sensor | Sends | Target |
|--------|--------|-------|--------|
| **Door** | Reed switch (GPIO 4) | `{"roomId": "...", "state": "..."}` on change | `/api/door` |
| **Projector** | LDR light sensor (analog) | `{"status": "...", "nilai_cahaya": <lux>}` | `/api/projector` |
| **flazz-tap** | MFRC522 NFC reader | `{"id": "<card-uid>", "room": "<pc-ip>"}` | `/api/card` |

### 3. Briefing service (Python / FastAPI)

`PythonServer/main.py` — a FastAPI service that **generates briefing PowerPoint decks**. It pulls the teaching schedule and course data from the **Bluejack** APIs, resolves the current class/shift, fills the PPTX templates in `PPT/`, injects **QR codes**, and streams the finished `.pptx` back.

- Endpoints: `GET /health`, `POST /generate-briefing`
- Templates: quiz (TM) and UAP briefings
- Called by the web app's `/api/briefing/generate-ppt` (proxy) and the desktop kiosk. Default port **8000**.

### 4. Desktop kiosk (Tauri)

`mosec_desktop/` — a **Tauri** (Rust backend + Vue frontend) kiosk app for lab assistants:
> Tap your Flazz card on the NFC reader → see the current room transaction → generate the Course Outline / Briefing PPT.

Rust modules: `serial.rs` (reads the ESP32/NFC over USB serial), `network.rs` (calls the APIs), `briefing.rs` (drives PPT generation).

---

## Getting started

### Prerequisites
- **Docker + Docker Compose** (recommended path for the web app), or Node.js 20+ for manual runs
- **Python 3.10+** (for the briefing service)
- **Rust + Tauri prerequisites** (only if building the desktop app)
- **Arduino IDE / arduino-cli** with ESP32 board support (only for firmware)

### Web dashboard — Docker (recommended)

```bash
cd MoSec_Monitoring_and_Security/NuxtJS
cp .env.example .env        # then edit as needed
docker compose up
```

On first boot the `nuxt` container runs `drizzle-kit push` and seeds the database (`seed.ts` + `seed-history.ts`, once, guarded by a `.seed-done` flag). Then:

- Web app → http://localhost:3000
- PostgreSQL → host port **5433** (container 5432)

Services: `db` (PostgreSQL 16), `nuxt` (the app), and `dummy-iot` (fake sensor sender, only when enabled — see below).

### Web dashboard — manual (no Docker)

```bash
cd MoSec_Monitoring_and_Security/NuxtJS
npm install
# set DATABASE_URL in .env (e.g. postgresql://postgres:root@localhost:5433/mosec)
npx drizzle-kit push
npx tsx drizzle/seed.ts && npx tsx drizzle/seed-history.ts
npm run dev
```

### Briefing service (Python)

```bash
cd PythonServer
pip install -r requirements.txt
# configure .env (Bluejack API base, template paths, etc.)
uvicorn main:app --host 0.0.0.0 --port 8000
```

### Desktop kiosk (Tauri)

Uses **bun** (see `bun.lock`); npm/yarn work too but bun is what's actually used day to day.

```bash
cd mosec_desktop
bun install
bun run tauri dev        # dev mode — needs the Vite dev server, loads from localhost:1420
bun run tauri build      # production build — bundles the UI, no dev server needed at runtime
```

`bun run tauri dev` produces a **debug** binary at `src-tauri/target/debug/mosec_desktop.exe` that only runs while the Vite dev server is up — it is not meant to be distributed. For a standalone exe/installer to hand to another PC, always use `bun run tauri build`; the distributable artifacts land in:

```
src-tauri/target/release/bundle/nsis/mosec_desktop_<version>_x64-setup.exe   # installer (recommended)
src-tauri/target/release/bundle/msi/mosec_desktop_<version>_x64_en-US.msi    # MSI installer
src-tauri/target/release/mosec_desktop.exe                                   # bare exe
```

### IoT firmware

Open the sketch in `IoT/ArduinoIDE/<Door|Projector|flazz-tap>/` in the Arduino IDE, copy `secrets.example.h` → `secrets.h`, set WiFi credentials + `SERVER_URL` + `ROOM_ID`, select your ESP32 board, and upload.

---

## Environment variables

**Web app (`MoSec_Monitoring_and_Security/NuxtJS/.env`)**

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string (provided by compose in Docker) |
| `NUXT_PYTHON_SERVER_URL` | Briefing service URL (compose default `http://host.docker.internal:8000`) |
| `COMPOSE_PROFILES` | `dummy` to run the dummy IoT sender on `docker compose up`, empty to disable |
| `DUMMY_INTERVAL_MS` | Dummy sender tick interval (default `5000`) |
| `DOOR_INCIDENTS_PER_DAY` | Target unlock incidents/day across all rooms (default `1.5`) |
| `PROJ_INCIDENTS_PER_DAY` | Target projector-left-on incidents/day (default `2`) |
| `DOOR_CLOSE_CHANCE`, `PROJ_OFF_CHANCE` | How quickly a door/projector returns to normal |

**Briefing service (`PythonServer/.env`)**

| Variable | Description |
|----------|-------------|
| `BLUEJACK_API_BASE`, `SEMESTER_ID`, `ACAD_BOOK_API` | Bluejack/acad-book API endpoints |
| `PPT_TEMPLATE_DIR`, `TEMPLATE_QUIZ`, `TEMPLATE_UAP` | Where the `.pptx` templates live and their filenames |
| `HTTP_TIMEOUT` | Timeout (seconds) for calls to Bluejack/acad-book |
| `BRIEFING_SCHEDULE_SOURCE` | Which schedule the server matches against: `api` (live `Schedule/GetJobsAssistant`, default), `classtransaction` (live `ClassTransaction` API), or `file` (offline `TransactionSchedule.json`) |
| `BRIEFING_SCHEDULE_MODE` | `future` (production default) or `all` (needed to reach past sessions during testing) |
| `BRIEFING_DAY`, `BRIEFING_SHIFT` | Hardcode the day-of-week / shift window for testing; leave both empty for realtime (derived from wall clock) |
| `BRIEFING_NOW_OVERRIDE` | Pretend "now" is a specific ISO datetime, so the server resolves the class that was active then — testing only |
| `BRIEFING_ASSISTANT_CODE`, `BRIEFING_CLASS_CODE` | Fallback assistant/class when not supplied in the request (normally these come from the card tap via the desktop/web client) |
| `BRIEFING_DEFAULT_DURATION`, `BRIEFING_DEFAULT_PARTICIPANTS` | Fallback values for the assessment table when the course feed omits them |
| `CLASS_TRANSACTION_URL` | Override for the live ClassTransaction endpoint |
| `HOST`, `PORT` | Bind address for `uvicorn` (defaults `0.0.0.0:8000`) |

`PythonServer/` also has a few one-off dev scripts (`clean_templates.py`, `verify_clean.py`, `inspect_template.py`, `final_verify.py`, `_smoke_test.py`) used while preparing/checking the `.pptx` templates — not part of the running service.

---

## Dummy IoT sender

Because the physical sensors aren't always available, `scripts/dummy-iot.ts` acts as a **fake IoT device**: it continuously `POST`s door/projector readings to the real API, so `door_lock_history` / `projector_history` fill up exactly as they would in production. The dashboard then reads genuine data from the database.

- **Toggle** via `.env`: `COMPOSE_PROFILES=dummy` (on) / empty (off).
- **Run standalone**: `npm run dummy:iot` (needs the dev server running).
- **Incident rate** is expressed as **incidents per day for the whole building** (`DOOR_INCIDENTS_PER_DAY`, `PROJ_INCIDENTS_PER_DAY`) and converted to a tiny per-tick probability automatically — so it stays correct regardless of tick interval or room count.

Apply `.env` changes with:
```bash
docker compose up -d --force-recreate dummy-iot
```

---

## Database schema

Drizzle ORM (`server/utils/schema.ts`), PostgreSQL:

| Table | Purpose |
|-------|---------|
| `users` | Local users (Flazz card ↔ initial ↔ password hash) |
| `users_messier` | Flazz card → Messier credential mapping |
| `rooms` | Labs (id + room number, e.g. `601`) |
| `transactions` | Card-tap entries (user × room × time) |
| `projector_history` | Projector sessions (`turned_on_at` / `turned_off_at`, light value) |
| `door_lock_history` | Door state events (`open` / `closed`, timestamp) |

---

## Web API reference

**Data ingest (from IoT / dummy sender)**
- `POST /api/door` — `{ roomId, state: "open" | "closed" }`
- `POST /api/projector` — `{ room, nilai_cahaya }` (lux → on/off session management)

**Realtime / analytics**
- `GET /api/door` — latest door state per room
- `GET /api/rooms` — all rooms with status + borrower
- `GET /api/analytics/global` — dashboard summary
- `GET /api/analytics/room?roomId=` — single-room detail
- `GET /api/analytics/projector?roomId=&date=` — daily + shift breakdown
- `GET /api/analytics/projector-uptime` — uptime per room + totals
- `GET /api/analytics/current-incidents` — rooms unlocked & not borrowed now
- `GET /api/analytics/unlock-incidents` — unlock incidents grouped by month

**Reports / auth / briefing**
- `GET /api/reports` — transactions + lock history
- `POST /api/auth/login` — Messier login
- `POST /api/auth/flazz-login` — Flazz card login
- `POST /api/briefing/generate-ppt` — proxy to the Python briefing service

---

## Tech stack

| Layer | Tech |
|-------|------|
| Web frontend | Nuxt 4, Vue 3, Lucide icons |
| Web backend | Nitro (Nuxt server routes), Drizzle ORM |
| Database | PostgreSQL 16 |
| IoT | ESP32 (Arduino/C++), reed switch, LDR, MFRC522 NFC |
| Briefing service | Python, FastAPI, python-pptx, qrcode, httpx |
| Desktop | Tauri (Rust) + Vue + Vite |
| External | BINUS Messier / Bluejack APIs |
| Infra | Docker Compose, tsx |

---

## Notes & known gaps

- **Desktop kiosk `BACKEND_URL` is hardcoded** in `mosec_desktop/src/App.vue` (currently `http://10.20.187.115:3000`) rather than read from an env var — it's baked into the exe at build time. Distributing the exe to another PC only works if the NuxtJS server keeps that exact LAN IP reachable (fixed/static IP, same subnet, firewall open on port 3000); otherwise the client sees connection-refused errors. Consider moving this to a build-time env var or an in-app settings field.
- **Excel / PDF export** on the Reports page is a placeholder (shows a "coming soon" alert).
- **Reports "Room" column** currently shows the room UUID rather than the room number.
- **Firmware vs API drift**: the Door sketch currently emits `"locked"/"unlcoked"` while `/api/door` expects `"open"/"closed"`, the Projector sketch omits `room`, and `flazz-tap` posts to `/api/card` (not yet implemented in the web API). Align these before wiring real hardware — the **dummy IoT sender** already uses the correct contracts and is the reference implementation.
- Settings preferences are persisted (cookie) but not yet consumed by other pages.
- Power consumption is an **estimate** (`uptime × 0.3 kWh/hour`), not a metered reading.
