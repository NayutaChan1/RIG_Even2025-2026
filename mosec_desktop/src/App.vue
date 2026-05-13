<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";
import { invoke } from "@tauri-apps/api/core";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";

// ── Backend URL (NuxtJS server) ──────────────────────────────────────
const BACKEND_URL = "http://localhost:3000";

// ── Types ────────────────────────────────────────────────────────────
type SerialStatusEvent = {
  status: string;
  port_name?: string | null;
  message?: string | null;
};

type SerialDataEvent = {
  port_name: string;
  data: string;
};

type FlazzPayload = {
  Flazz_id: string;
};

type AuthenticatedUser = {
  id: string;
  name: string;
  initial: string;
  flazz: string;
};

// ── Reactive state ───────────────────────────────────────────────────
const isTapped = ref(false);
const isLoading = ref(false);
const serialStatus = ref<string>("idle");
const serialPort = ref<string | null>(null);
const lastSerialLine = ref<string>("");
const flazzCardId = ref<string>("");
const loginError = ref<string>("");
const authenticatedUser = ref<AuthenticatedUser | null>(null);

const transactionData = ref({
  room: "Lab 601",
  subject: "Artificial Intelligence",
  lecturer: "Dr. Aris Purwanto",
  time: "10:00 - 12:00",
  status: "In Progress"
});

let unlistenData: UnlistenFn | null = null;
let unlistenStatus: UnlistenFn | null = null;
let connectTimer: number | null = null;
let connectInFlight = false;

// ── Serial helpers ───────────────────────────────────────────────────
async function tryConnectCh340() {
  if (connectInFlight) return;
  connectInFlight = true;
  try {
    await invoke("serial_connect_ch340");
  } catch (e) {
    serialStatus.value = "not_found";
    console.warn("serial_connect_ch340 failed:", e);
  } finally {
    connectInFlight = false;
  }
}

/**
 * Parse raw serial data from ESP32.
 *
 * Expected format (JSON):
 *   {"id":"1F913EEC","room":"727"}
 *
 * Extracts the "id" field as the 8-char Flazz_id.
 * Returns null if the data isn't valid JSON or id isn't 8 chars.
 */
function parseSerialData(raw: string): FlazzPayload | null {
  const trimmed = raw.trim();

  try {
    const parsed = JSON.parse(trimmed);
    const flazzId = parsed?.id;

    if (typeof flazzId !== "string" || flazzId.length !== 8) {
      console.warn("[parseSerialData] Invalid or missing id:", flazzId);
      return null;
    }

    return { Flazz_id: flazzId };
  } catch {
    // Not JSON — skip (might be debug output from ESP32)
    return null;
  }
}

/**
 * Send Flazz_id to the NuxtJS backend.
 * The backend looks up users_messier DB → calls Messier API.
 */
async function sendFlazzLogin(payload: FlazzPayload): Promise<void> {
  isLoading.value = true;
  loginError.value = "";
  flazzCardId.value = payload.Flazz_id;
  console.log("[flazz-id]", payload.Flazz_id);

  try {
    const response = await fetch(`${BACKEND_URL}/api/auth/flazz-login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      loginError.value = result.message || "Login gagal";
      console.error("[flazz-login] Error:", result.message);
      return;
    }

    // Login successful — populate dashboard
    authenticatedUser.value = result.messier || null;
    transactionData.value = {
      room: "Lab 601",
      subject: "Artificial Intelligence",
      lecturer: result.mapped?.Intial || "Unknown",
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) + " - 12:00",
      status: "In Progress",
    };
    isTapped.value = true;

    console.log("[flazz-login] Success:", result);
  } catch (err) {
    loginError.value = err instanceof Error ? err.message : "Network error";
    console.error("[flazz-login] Network error:", err);
  } finally {
    isLoading.value = false;
  }
}

// ── Lifecycle ────────────────────────────────────────────────────────
onMounted(async () => {
  unlistenData = await listen<SerialDataEvent>("serial-data", async (event) => {
    lastSerialLine.value = event.payload.data;
    console.log("[serial-data]", event.payload.port_name, event.payload.data);

    // Attempt to parse and authenticate on every serial line
    if (!isLoading.value && !isTapped.value) {
      const payload = parseSerialData(event.payload.data);
      if (payload) {
        console.log("[serial-data] Mapped payload:", JSON.stringify(payload));
        await sendFlazzLogin(payload);
      }
    }
  });

  unlistenStatus = await listen<SerialStatusEvent>("serial-status", (event) => {
    serialStatus.value = event.payload.status;
    serialPort.value = event.payload.port_name ?? null;
    if (event.payload.message) {
      console.log("[serial-status]", event.payload.status, event.payload.message);
    }
  });

  await tryConnectCh340();

  connectTimer = window.setInterval(async () => {
    if (serialStatus.value === "connected" || serialStatus.value === "connecting") return;
    await tryConnectCh340();
  }, 1000);
});

onBeforeUnmount(async () => {
  if (connectTimer) window.clearInterval(connectTimer);
  if (unlistenData) unlistenData();
  if (unlistenStatus) unlistenStatus();
  try {
    await invoke("serial_disconnect");
  } catch {
    
  }
});

// ── Manual tap fallback (for testing without hardware) ───────────────
async function handleTap() {
  isLoading.value = true;
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  transactionData.value = {
    room: "Lab 601",
    subject: "Artificial Intelligence",
    lecturer: "Dr. Aris Purwanto",
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + " - 12:00",
    status: "In Progress"
  };
  
  isTapped.value = true;
  isLoading.value = false;
}

function resetTap() {
  isTapped.value = false;
  authenticatedUser.value = null;
  loginError.value = "";
}

function generateOutline() {
  alert("Generating Course Outline for " + transactionData.value.subject + "...");
}

function generatePPT() {
  alert("Generating Briefing PPT for " + transactionData.value.subject + "...");
}

function checkAttendance() {
  alert("Opening Lab Attendance System...");
}

</script>

<template>
  <div class="main-container">
    <div v-if="!isTapped" class="landing-page">
      <div class="nfc-visual" @click="handleTap">
        <div v-if="!isLoading" class="nfc-icon">💳</div>
        <div v-else class="loader"></div>
      </div>
      <p class="tap-instruction">
        {{ isLoading ? 'Reading card...' : 'Please tap your Flazz card to begin' }}
      </p>
      <div style="text-align: center; color: var(--text-secondary); font-size: 0.9rem;">
        <div>
          ESP32 Serial: {{ serialStatus }}<span v-if="serialPort"> ({{ serialPort }})</span>
        </div>
        <div v-if="flazzCardId" style="margin-top: 0.25rem;">
          Flazz ID: {{ flazzCardId }}
        </div>
        <div v-if="lastSerialLine" style="margin-top: 0.25rem; max-width: 70vw; word-break: break-word;">
          Last: {{ lastSerialLine }}
        </div>
        <div v-if="loginError" style="margin-top: 0.5rem; color: #ff6b6b; font-weight: 600;">
          ⚠ {{ loginError }}
        </div>
      </div>
    </div>

    <div v-else class="dashboard">
      <div class="card">
        <div class="card-header">
          <div class="card-icon">🕒</div>
          <h2 class="card-title">Current Transaction</h2>
        </div>
        <div class="card-content">
          <div class="transaction-item">
            <span class="transaction-label">Room</span>
            <span class="transaction-value">{{ transactionData.room }}</span>
          </div>
          <div class="transaction-item">
            <span class="transaction-label">Subject</span>
            <span class="transaction-value">{{ transactionData.subject }}</span>
          </div>
          <div class="transaction-item">
            <span class="transaction-label">Lecturer</span>
            <span class="transaction-value">{{ transactionData.lecturer }}</span>
          </div>
          <div class="transaction-item">
            <span class="transaction-label">Time</span>
            <span class="transaction-value">{{ transactionData.time }}</span>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <div class="card-icon">📝</div>
          <h2 class="card-title">Course Outline</h2>
        </div>
        <div class="card-content">
          <p style="color: var(--text-secondary); margin-bottom: 1.5rem;">
            Automatically generate a structured course outline based on the current session.
          </p>
          <button class="action-btn" @click="generateOutline">
            <span>Generate Outline</span>
            <span>🚀</span>
          </button>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <div class="card-icon">📊</div>
          <h2 class="card-title">Briefing PPT</h2>
        </div>
        <div class="card-content">
          <p style="color: var(--text-secondary); margin-bottom: 1.5rem;">
            Create a professional presentation for the current briefing session.
          </p>
          <button class="action-btn" @click="generatePPT">
            <span>Generate PPT</span>
            <span>✨</span>
          </button>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <div class="card-icon">👥</div>
          <h2 class="card-title">Lab Management</h2>
        </div>
        <div class="card-content">
          <p style="color: var(--text-secondary); margin-bottom: 1.5rem;">
            Monitor attendance and manage lab assistant assignments.
          </p>
          <button class="action-btn" @click="checkAttendance">
            <span>Open Management</span>
            <span>⚙️</span>
          </button>
        </div>
      </div>

      <button 
        style="position: absolute; bottom: 20px; right: 20px; background: none; border: none; color: var(--text-secondary); cursor: pointer;"
        @click="resetTap"
      >
        ← Log Out
      </button>
    </div>
  </div>
</template>

<style>
@import "./assets/style.css";
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

.loader {
  width: 48px;
  height: 48px;
  border: 4px solid var(--glass-border);
  border-top-color: var(--accent-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
