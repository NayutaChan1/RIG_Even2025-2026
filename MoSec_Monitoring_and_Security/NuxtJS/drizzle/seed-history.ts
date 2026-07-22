// drizzle/seed-history.ts
// Seeds door_lock_history and projector_history with edge case scenarios.
// Run this AFTER drizzle/seed.ts (rooms must exist).

import { db } from "../server/utils/db";
import { door_lock_history, projector_history } from "../server/utils/schema";

// ── Helper ──────────────────────────────────────────────────────────────────

function uid() {
  return crypto.randomUUID();
}

function hoursAgo(h: number, offsetMin = 0): Date {
  const d = new Date();
  d.setHours(d.getHours() - h, d.getMinutes() - offsetMin, 0, 0);
  return d;
}

function daysAgo(days: number, hour = 8, min = 0): Date {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(hour, min, 0, 0);
  return d;
}

// ── Room ID lookup (must match keys in drizzle/seed.ts) ────────────────────

const ROOM = {
  "601": "95ad125d-b6b4-df11-bca3-d8d385fce79c",
  "602": "96ad125d-b6b4-df11-bca3-d8d385fce79c",
  "603": "535224e6-84aa-df11-bca3-d8d385fce79c",
  "604": "545224e6-84aa-df11-bca3-d8d385fce79c",
  "605": "555224e6-84aa-df11-bca3-d8d385fce79c",
  "606": "565224e6-84aa-df11-bca3-d8d385fce79c",
  "608": "585224e6-84aa-df11-bca3-d8d385fce79c",
  "609": "595224e6-84aa-df11-bca3-d8d385fce79c",
  "610": "5a5224e6-84aa-df11-bca3-d8d385fce79c",
  "621": "5d5224e6-84aa-df11-bca3-d8d385fce79c",
  "622": "5e5224e6-84aa-df11-bca3-d8d385fce79c",
  "623": "5f5224e6-84aa-df11-bca3-d8d385fce79c",
  "624": "605224e6-84aa-df11-bca3-d8d385fce79c",
  "625": "615224e6-84aa-df11-bca3-d8d385fce79c",
  "626": "625224e6-84aa-df11-bca3-d8d385fce79c",
  "627": "635224e6-84aa-df11-bca3-d8d385fce79c",
  "628": "645224e6-84aa-df11-bca3-d8d385fce79c",
  "629": "655224e6-84aa-df11-bca3-d8d385fce79c",
  "630": "665224e6-84aa-df11-bca3-d8d385fce79c",
  "631": "675224e6-84aa-df11-bca3-d8d385fce79c",
  "706": "b1ad125d-b6b4-df11-bca3-d8d385fce79c"
} as const;

// ── Seed function ──────────────────────────────────────────────────────────

async function seedHistory() {
  const doorRecords: (typeof door_lock_history.$inferInsert)[] = [];
  const projectorRecords: (typeof projector_history.$inferInsert)[] = [];

  // ── ROOM 329 ── Currently ACTIVE ─────────────────────────────────────────
  // Door: was closed, opened 30 min ago → currently open, no incident (<2h)
  // Projector: turned on 2h ago, still on → currently on
  {
    const rid = ROOM["706"];
    doorRecords.push(
      { id: uid(), room_id: rid, status: "closed", recorded_at: hoursAgo(2, 30) },
      { id: uid(), room_id: rid, status: "open", recorded_at: hoursAgo(0, 30) },
    );
    projectorRecords.push(
      { id: uid(), room_id: rid, turned_on_at: hoursAgo(2), turned_off_at: null, light_sensor_value: 780 },
    );
  }

  // ── ROOM 601 ── Currently WARNING + UNLOCK INCIDENT ──────────────────────
  // Door: opened 3h ago, still open → UNLOCK INCIDENT (>2h) + currently open
  // Projector: was on, turned off 1h ago → currently off
  {
    const rid = ROOM["601"];
    doorRecords.push(
      { id: uid(), room_id: rid, status: "closed", recorded_at: hoursAgo(5) },
      { id: uid(), room_id: rid, status: "open", recorded_at: hoursAgo(3) },
    );
    projectorRecords.push(
      { id: uid(), room_id: rid, turned_on_at: hoursAgo(5), turned_off_at: hoursAgo(1), light_sensor_value: 820 },
    );
  }

  // ── ROOM 602 ── Never used (INACTIVE) ────────────────────────────────────
  // Door: no records → treated as closed
  // Projector: no records → treated as off
  // (no records pushed)

  // ── ROOM 603 ── Normal completed session (INACTIVE) ──────────────────────
  // Door: opened 4h ago, closed 3h ago → currently closed
  // Projector: on 4h ago, off 3h ago → currently off
  {
    const rid = ROOM["603"];
    doorRecords.push(
      { id: uid(), room_id: rid, status: "open", recorded_at: hoursAgo(4) },
      { id: uid(), room_id: rid, status: "closed", recorded_at: hoursAgo(3) },
    );
    projectorRecords.push(
      { id: uid(), room_id: rid, turned_on_at: hoursAgo(4), turned_off_at: hoursAgo(3), light_sensor_value: 650 },
    );
  }

  // ── ROOM 604 ── Projector left on (WARNING) ──────────────────────────────
  // Door: always closed
  // Projector: turned on 4h ago, still on → currently on, no active booking
  {
    const rid = ROOM["604"];
    doorRecords.push(
      { id: uid(), room_id: rid, status: "closed", recorded_at: hoursAgo(6) },
    );
    projectorRecords.push(
      { id: uid(), room_id: rid, turned_on_at: hoursAgo(4), turned_off_at: null, light_sensor_value: 901 },
    );
  }

  // ── ROOM 605 ── Unlock incident + door still open (WARNING) ──────────────
  // Door: opened 5h ago, still open → UNLOCK INCIDENT (>2h)
  // Projector: off (no records)
  {
    const rid = ROOM["605"];
    doorRecords.push(
      { id: uid(), room_id: rid, status: "closed", recorded_at: hoursAgo(6) },
      { id: uid(), room_id: rid, status: "open", recorded_at: hoursAgo(5) },
    );
  }

  // ── ROOM 606 ── Multiple cycles, currently off (INACTIVE) ────────────────
  // Door: open→closed→open→closed (2 cycles, currently closed)
  // Projector: on→off→on→off (2 sessions, currently off)
  {
    const rid = ROOM["606"];
    doorRecords.push(
      { id: uid(), room_id: rid, status: "open", recorded_at: hoursAgo(10) },
      { id: uid(), room_id: rid, status: "closed", recorded_at: hoursAgo(8) },
      { id: uid(), room_id: rid, status: "open", recorded_at: hoursAgo(5) },
      { id: uid(), room_id: rid, status: "closed", recorded_at: hoursAgo(3) },
    );
    projectorRecords.push(
      { id: uid(), room_id: rid, turned_on_at: hoursAgo(10), turned_off_at: hoursAgo(8), light_sensor_value: 500 },
      { id: uid(), room_id: rid, turned_on_at: hoursAgo(5), turned_off_at: hoursAgo(3), light_sensor_value: 720 },
    );
  }

  // ── ROOM 608 ── Multiple projector sessions, currently on ────────────────
  // Door: currently open
  // Projector: on→off→on, currently on (2 sessions, second still active)
  {
    const rid = ROOM["608"];
    doorRecords.push(
      { id: uid(), room_id: rid, status: "closed", recorded_at: hoursAgo(8) },
      { id: uid(), room_id: rid, status: "open", recorded_at: hoursAgo(6) },
    );
    projectorRecords.push(
      { id: uid(), room_id: rid, turned_on_at: hoursAgo(8), turned_off_at: hoursAgo(6), light_sensor_value: 300 },
      { id: uid(), room_id: rid, turned_on_at: hoursAgo(4), turned_off_at: null, light_sensor_value: 880 },
    );
  }

  // ── ROOM 609 ── Multiple projector sessions with light sensor data (off now)
  // Door: closed
  // Projector: 3 sessions with various sensor values
  {
    const rid = ROOM["609"];
    doorRecords.push(
      { id: uid(), room_id: rid, status: "closed", recorded_at: hoursAgo(12) },
    );
    projectorRecords.push(
      { id: uid(), room_id: rid, turned_on_at: hoursAgo(12), turned_off_at: hoursAgo(10), light_sensor_value: 150 },
      { id: uid(), room_id: rid, turned_on_at: hoursAgo(8), turned_off_at: hoursAgo(7), light_sensor_value: 420 },
      { id: uid(), room_id: rid, turned_on_at: hoursAgo(3), turned_off_at: hoursAgo(1), light_sensor_value: 960 },
    );
  }

  // ── ROOM 610 ── Historical unlock incident (currently closed) ────────────
  // Door: opened 10h ago, closed 6h ago → UNLOCK INCIDENT (4h span > 2h)
  // Projector: on→off, currently off
  {
    const rid = ROOM["610"];
    doorRecords.push(
      { id: uid(), room_id: rid, status: "open", recorded_at: hoursAgo(10) },
      { id: uid(), room_id: rid, status: "closed", recorded_at: hoursAgo(6) },
    );
    projectorRecords.push(
      { id: uid(), room_id: rid, turned_on_at: hoursAgo(10), turned_off_at: hoursAgo(6), light_sensor_value: 700 },
    );
  }

  // ── ROOM 621 ── Multi-day projector sessions for 7-day chart ─────────────
  // Door: always closed
  // Projector: sessions on different days with varying durations
  {
    const rid = ROOM["621"];
    doorRecords.push(
      { id: uid(), room_id: rid, status: "closed", recorded_at: daysAgo(7) },
    );
    // 7 days of sessions with increasing duration
    const durations = [1, 2, 3, 4, 5, 6, 7]; // hours
    for (let i = 0; i < 7; i++) {
      const onAt = daysAgo(6 - i, 8);
      const offAt = new Date(onAt.getTime() + durations[i] * 3600000);
      projectorRecords.push({
        id: uid(),
        room_id: rid,
        turned_on_at: onAt,
        turned_off_at: offAt,
        light_sensor_value: 400 + i * 50,
      });
    }
  }

  // ── ROOM 622 ── Weekday-only projector sessions ──────────────────────────
  // Door: always closed
  // Projector: on Mon-Fri only, shorter sessions (for chart variety)
  {
    const rid = ROOM["622"];
    doorRecords.push(
      { id: uid(), room_id: rid, status: "closed", recorded_at: daysAgo(7) },
    );
    for (let i = 0; i < 5; i++) {
      const onAt = daysAgo(6 - i, 9);
      const offAt = new Date(onAt.getTime() + 1.5 * 3600000);
      projectorRecords.push({
        id: uid(),
        room_id: rid,
        turned_on_at: onAt,
        turned_off_at: offAt,
        light_sensor_value: 550,
      });
    }
  }

  // ── ROOM 623 ── Full-day projector (100% bars on chart) ──────────────────
  // Door: always closed
  // Projector: on all day every day for the past week
  {
    const rid = ROOM["623"];
    doorRecords.push(
      { id: uid(), room_id: rid, status: "closed", recorded_at: daysAgo(7) },
    );
    for (let i = 0; i < 7; i++) {
      const onAt = daysAgo(6 - i, 7);
      const offAt = daysAgo(6 - i, 19);
      projectorRecords.push({
        id: uid(),
        room_id: rid,
        turned_on_at: onAt,
        turned_off_at: offAt,
        light_sensor_value: 999,
      });
    }
  }

  // ── ROOM 624 ── Door open, no booking, projector off (WARNING) ───────────
  // Door: open (no close record, not long enough for incident yet)
  // Projector: off
  {
    const rid = ROOM["624"];
    doorRecords.push(
      { id: uid(), room_id: rid, status: "open", recorded_at: hoursAgo(0, 45) },
    );
  }

  // ── ROOM 625 ── Just started session (ACTIVE potential) ──────────────────
  // Door: opened 10 min ago
  // Projector: turned on 5 min ago
  {
    const rid = ROOM["625"];
    doorRecords.push(
      { id: uid(), room_id: rid, status: "closed", recorded_at: hoursAgo(2) },
      { id: uid(), room_id: rid, status: "open", recorded_at: hoursAgo(0, 10) },
    );
    projectorRecords.push(
      { id: uid(), room_id: rid, turned_on_at: hoursAgo(0, 5), turned_off_at: null, light_sensor_value: 200 },
    );
  }

  // ── ROOM 626 ── Properly locked and off (INACTIVE) ───────────────────────
  // Door: closed (explicit record)
  // Projector: off (explicitly turned off)
  {
    const rid = ROOM["626"];
    doorRecords.push(
      { id: uid(), room_id: rid, status: "closed", recorded_at: hoursAgo(8) },
    );
    projectorRecords.push(
      { id: uid(), room_id: rid, turned_on_at: hoursAgo(12), turned_off_at: hoursAgo(10), light_sensor_value: 600 },
      { id: uid(), room_id: rid, turned_on_at: hoursAgo(8), turned_off_at: hoursAgo(6), light_sensor_value: 600 },
    );
  }

  // ── ROOM 627 ── Quick session (INACTIVE) ─────────────────────────────────
  // Door: opened and closed within 30 min
  // Projector: on for 25 min
  {
    const rid = ROOM["627"];
    doorRecords.push(
      { id: uid(), room_id: rid, status: "open", recorded_at: hoursAgo(3) },
      { id: uid(), room_id: rid, status: "closed", recorded_at: hoursAgo(2, 30) },
    );
    projectorRecords.push(
      { id: uid(), room_id: rid, turned_on_at: hoursAgo(3), turned_off_at: hoursAgo(2, 35), light_sensor_value: 450 },
    );
  }

  // ── ROOM 628 ── Projector on, door has no records (WARNING) ──────────────
  // Door: no records → treated as closed
  // Projector: turned on 30 min ago, still on
  {
    const rid = ROOM["628"];
    projectorRecords.push(
      { id: uid(), room_id: rid, turned_on_at: hoursAgo(0, 30), turned_off_at: null, light_sensor_value: 810 },
    );
  }

  // ── ROOM 629 ── Door opened, no close record (WARNING) ───────────────────
  // Door: opened 20 min ago, no close → currently open, not incident yet
  // Projector: no records → off
  {
    const rid = ROOM["629"];
    doorRecords.push(
      { id: uid(), room_id: rid, status: "open", recorded_at: hoursAgo(0, 20) },
    );
  }

  // ── ROOM 630 ── Normal session, no incident (INACTIVE) ───────────────────
  // Door: open→closed within 1h (< 2h, no incident)
  // Projector: on→off in same period
  {
    const rid = ROOM["630"];
    doorRecords.push(
      { id: uid(), room_id: rid, status: "open", recorded_at: hoursAgo(5) },
      { id: uid(), room_id: rid, status: "closed", recorded_at: hoursAgo(4) },
    );
    projectorRecords.push(
      { id: uid(), room_id: rid, turned_on_at: hoursAgo(5), turned_off_at: hoursAgo(4), light_sensor_value: 500 },
    );
  }

  // ── ROOM 631 ── Boundary: door open exactly 2h (edge case) ───────────────
  // Door: opened exactly 2h ago → NOT > 2h, so no unlock incident
  // Projector: on, currently on
  {
    const rid = ROOM["631"];
    doorRecords.push(
      { id: uid(), room_id: rid, status: "closed", recorded_at: hoursAgo(3) },
      { id: uid(), room_id: rid, status: "open", recorded_at: hoursAgo(2) },
    );
    projectorRecords.push(
      { id: uid(), room_id: rid, turned_on_at: hoursAgo(2, 30), turned_off_at: null, light_sensor_value: 750 },
    );
  }

  // ── Execute inserts ──────────────────────────────────────────────────────

  if (doorRecords.length > 0) {
    await db.insert(door_lock_history).values(doorRecords);
    console.log(`Inserted ${doorRecords.length} door lock history records`);
  }

  if (projectorRecords.length > 0) {
    await db.insert(projector_history).values(projectorRecords);
    console.log(`Inserted ${projectorRecords.length} projector history records`);
  }

  // ── Summary ──────────────────────────────────────────────────────────────

  console.log("\n── Edge Case Scenarios Seeded ──\n");

  const summary: { room: string; door: string; projector: string; status: string }[] = [
    { room: "706", door: "open (30m ago)", projector: "on (2h, still on)", status: "Active / Warning" },
    { room: "601", door: "open (3h ago) ← INCIDENT", projector: "on→off (1h ago)", status: "Warning" },
    { room: "602", door: "no records (closed)", projector: "no records (off)", status: "Inactive" },
    { room: "603", door: "open→closed (normal)", projector: "on→off (normal)", status: "Inactive" },
    { room: "604", door: "closed", projector: "on (4h, still on)", status: "Warning" },
    { room: "605", door: "open (5h ago) ← INCIDENT", projector: "off (no records)", status: "Warning" },
    { room: "606", door: "2 cycles, currently closed", projector: "2 sessions, off", status: "Inactive" },
    { room: "608", door: "open", projector: "on→off→on (now on)", status: "Active / Warning" },
    { room: "609", door: "closed", projector: "3 sessions with sensor data", status: "Inactive" },
    { room: "610", door: "open 4h→closed ← INCIDENT", projector: "on→off", status: "Inactive" },
    { room: "621", door: "closed", projector: "7-day chart (varies)", status: "Inactive" },
    { room: "622", door: "closed", projector: "weekday only chart", status: "Inactive" },
    { room: "623", door: "closed", projector: "full-day 7d (100% bars)", status: "Inactive" },
    { room: "624", door: "open (45m ago)", projector: "off", status: "Warning" },
    { room: "625", door: "open (10m ago)", projector: "on (5m ago)", status: "Active / Warning" },
    { room: "626", door: "closed (explicit)", projector: "off (explicit)", status: "Inactive" },
    { room: "627", door: "open→closed (30m)", projector: "on→off (25m)", status: "Inactive" },
    { room: "628", door: "no records (closed)", projector: "on (30m, still on)", status: "Warning" },
    { room: "629", door: "open (20m ago)", projector: "off (no records)", status: "Warning" },
    { room: "630", door: "open→closed (1h, ok)", projector: "on→off (1h)", status: "Inactive" },
    { room: "631", door: "open (exactly 2h ago)", projector: "on (still on)", status: "Active / Warning" },
  ];

  for (const s of summary) {
    console.log(`  Room ${s.room.padEnd(4)} | door: ${s.door.padEnd(32)} | proj: ${s.projector.padEnd(30)} | → ${s.status}`);
  }

  console.log("\nSeed complete.");
}

seedHistory()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  });
