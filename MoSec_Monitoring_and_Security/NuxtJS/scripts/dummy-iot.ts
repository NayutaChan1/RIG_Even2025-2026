// =============================================================================
// DUMMY IoT DEVICE SIMULATOR
// -----------------------------------------------------------------------------
// Acts like the real door/projector hardware while the IoT is offline: it keeps
// POSTing readings to the running Nuxt server so `door_lock_history` and
// `projector_history` fill up through the REAL API (POST /api/door,
// POST /api/projector). The dashboard then reads actual data from the database.
//
// Run (dev server must already be running):
//     npm run dummy:iot
//
// Env vars:
//     BASE_URL     server base url        (default http://localhost:3000)
//     INTERVAL_MS  ms between ticks       (default 5000)
//
// Stop with Ctrl+C.
// =============================================================================

function numEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  if (raw === undefined || raw.trim() === '') return fallback;
  const n = Number(raw);
  return Number.isFinite(n) ? n : fallback;
}

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3000';
const INTERVAL_MS = numEnv('INTERVAL_MS', 5000);

// Target number of incidents PER DAY across ALL rooms combined. This is the
// intuitive knob — it's independent of tick rate and room count. The actual
// per-tick open probability is derived from it at runtime (see main()).
const DOOR_INCIDENTS_PER_DAY = numEnv('DOOR_INCIDENTS_PER_DAY', 1.5); // room left unlocked
const PROJ_INCIDENTS_PER_DAY = numEnv('PROJ_INCIDENTS_PER_DAY', 2);   // projector left on

// How quickly an opened door / running projector returns to normal (controls how
// long it stays open/on — not how often incidents start).
const DOOR_CLOSE_CHANCE = numEnv('DOOR_CLOSE_CHANCE', 0.5);
const PROJ_OFF_CHANCE = numEnv('PROJ_OFF_CHANCE', 0.3);

type Room = { id: string; name: string };

const doorState = new Map<string, 'open' | 'closed'>();
const projOn = new Map<string, boolean>();

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function getRooms(): Promise<Room[]> {
  const res = await fetch(`${BASE_URL}/api/door`);
  if (!res.ok) throw new Error(`GET /api/door failed: ${res.status}`);
  const json: any = await res.json();
  const data: any[] = json.data ?? [];
  // Seed current door state so we don't spam transitions on the very first tick.
  for (const r of data) doorState.set(r.id, r.state === 'open' ? 'open' : 'closed');
  return data.map((r) => ({ id: r.id, name: r.name }));
}

async function postDoor(roomId: string, state: 'open' | 'closed') {
  const res = await fetch(`${BASE_URL}/api/door`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ roomId, state }),
  });
  if (!res.ok) throw new Error(`POST /api/door ${roomId} ${state} -> ${res.status}`);
}

async function postProjector(roomName: string, lux: number) {
  const res = await fetch(`${BASE_URL}/api/projector`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ room: roomName, nilai_cahaya: lux }),
  });
  if (!res.ok) throw new Error(`POST /api/projector ${roomName} lux=${lux} -> ${res.status}`);
}

async function tick(rooms: Room[], doorOpenChance: number, projOnChance: number) {
  for (const room of rooms) {
    // ---- DOOR: edge-triggered, only POST when the state actually changes ----
    const prevDoor = doorState.get(room.id) ?? 'closed';
    let nextDoor = prevDoor;
    if (prevDoor === 'closed' && Math.random() < doorOpenChance) nextDoor = 'open';
    else if (prevDoor === 'open' && Math.random() < DOOR_CLOSE_CHANCE) nextDoor = 'closed';

    if (nextDoor !== prevDoor) {
      try {
        await postDoor(room.id, nextDoor);
        doorState.set(room.id, nextDoor);
        console.log(`[door]      Lab ${room.name}: ${prevDoor} -> ${nextDoor}`);
      } catch (err) {
        console.error(String(err));
      }
    }

    // ---- PROJECTOR: decide intent, then send a matching lux every tick ----
    // (POST /api/projector opens/closes sessions when lux crosses 400.)
    const prevProj = projOn.get(room.id) ?? false;
    let nextProj = prevProj;
    if (!prevProj && Math.random() < projOnChance) nextProj = true;
    else if (prevProj && Math.random() < PROJ_OFF_CHANCE) nextProj = false;
    projOn.set(room.id, nextProj);

    const lux = nextProj ? randInt(80, 350) : randInt(450, 900); // <400 => projector on
    try {
      await postProjector(room.name, lux);
      if (nextProj !== prevProj) {
        console.log(`[projector] Lab ${room.name}: ${prevProj ? 'ON' : 'OFF'} -> ${nextProj ? 'ON' : 'OFF'} (lux ${lux})`);
      }
    } catch (err) {
      console.error(String(err));
    }
  }
}

// Retry until the Nuxt server is reachable (it may still be booting/seeding
// when this runs inside docker compose).
async function waitForServer(): Promise<Room[]> {
  const RETRY_MS = 3000;
  for (let attempt = 1; ; attempt++) {
    try {
      return await getRooms();
    } catch (err) {
      console.log(`Waiting for server at ${BASE_URL}... (attempt ${attempt}: ${String(err)})`);
      await new Promise((resolve) => setTimeout(resolve, RETRY_MS));
    }
  }
}

async function main() {
  console.log(`Dummy IoT sender -> ${BASE_URL}  (tick every ${INTERVAL_MS}ms)`);
  const rooms = await waitForServer();

  // Convert "incidents per day (whole building)" into a per-room, per-tick chance.
  const ticksPerDay = 86_400_000 / INTERVAL_MS;
  const denom = Math.max(1, rooms.length) * ticksPerDay;
  const doorOpenChance = DOOR_INCIDENTS_PER_DAY / denom;
  const projOnChance = PROJ_INCIDENTS_PER_DAY / denom;

  console.log(
    `Loaded ${rooms.length} rooms. Target/day -> unlock: ${DOOR_INCIDENTS_PER_DAY}, ` +
    `projector: ${PROJ_INCIDENTS_PER_DAY} ` +
    `(per-tick p_door=${doorOpenChance.toExponential(2)}). Ctrl+C to stop.`
  );

  for (;;) {
    await tick(rooms, doorOpenChance, projOnChance);
    await new Promise((resolve) => setTimeout(resolve, INTERVAL_MS));
  }
}

main().catch((err) => {
  console.error('Dummy IoT sender crashed:', err);
  process.exit(1);
});
