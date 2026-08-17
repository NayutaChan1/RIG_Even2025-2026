<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";
import { invoke } from "@tauri-apps/api/core";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";
import { openPath } from "@tauri-apps/plugin-opener";
import { save } from "@tauri-apps/plugin-dialog";

// ── Backend URL (NuxtJS server) ──────────────────────────────────────
const BACKEND_URL = "http://10.20.187.115:3000";

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

// ── Briefing PPT state ───────────────────────────────────────────────
const messierToken = ref<string>("");
const assistantCode = ref<string>("");
const lineGroupLink = ref<string>("");
const pptLoading = ref(false);
const pptStatus = ref<string>("");
const pptError = ref<string>("");

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
let ipSentForConnection = false;

const PREFERRED_DNS_SUFFIX = "binus.local";

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
    messierToken.value = result.token || "";
    // Assistant initial (e.g. "FB25-1") from the DB mapping / Messier login.
    assistantCode.value =
      result.mapped?.Intial || result.messier?.user?.Username || "";
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

    // Once connected, push PC LAN IP to ESP32 so it can include it in the next JSON line.
    if (event.payload.status === "connected" && !ipSentForConnection) {
      ipSentForConnection = true;
      invoke("serial_send_pc_lan_ip", {
        prefix: "IP:",
        prefer_dns_suffix: PREFERRED_DNS_SUFFIX,
      }).catch((e) => {
        console.warn("serial_send_pc_lan_ip failed:", e);
        ipSentForConnection = false;
      });
    }

    if (event.payload.status === "disconnected") {
      ipSentForConnection = false;
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
  messierToken.value = "";
  assistantCode.value = "";
  lineGroupLink.value = "";
  pptStatus.value = "";
  pptError.value = "";
}

function generateOutline() {
  alert("Generating Course Outline for " + transactionData.value.subject + "...");
}

/**
 * Convert raw bytes to a base64 string in chunks (avoids call-stack overflow
 * from String.fromCharCode(...hugeArray) on multi-MB PPTX files).
 */
function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunkSize = 0x8000; // 32 KB per chunk
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const slice = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode.apply(null, Array.from(slice));
  }
  return btoa(binary);
}

/**
 * Generate a Briefing PPT via NuxtJS -> PythonServer, then save + open it.
 * @param templateType "quiz" (TM/Quiz) or "uap"
 */
async function generatePPT(templateType: "quiz" | "uap"): Promise<void> {
  pptError.value = "";
  pptStatus.value = "";

  if (!messierToken.value) {
    pptError.value = "Token Bluejack tidak tersedia. Silakan tap ulang kartu.";
    return;
  }
  if (!lineGroupLink.value.trim()) {
    pptError.value = "Link Group LINE wajib diisi (untuk QR code).";
    return;
  }

  pptLoading.value = true;
  pptStatus.value = "Menghubungi server & membuat PPT...";

  try {
    const response = await fetch(`${BACKEND_URL}/api/briefing/generate-ppt`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token: messierToken.value,
        template_type: templateType,
        line_group_link: lineGroupLink.value.trim(),
        assistant_code: assistantCode.value,
      }),
    });

    if (!response.ok) {
      // Error responses are JSON ({ message } / { statusMessage }).
      let msg = `Server mengembalikan status ${response.status}`;
      try {
        const err = await response.json();
        msg = err?.message || err?.statusMessage || msg;
      } catch {
        // keep generic message
      }
      pptError.value = msg;
      return;
    }

    // Derive a filename from Content-Disposition (falls back to a sane default).
    const disposition = response.headers.get("content-disposition") || "";
    const match = disposition.match(/filename="?([^"]+)"?/);
    const filename = match?.[1] || `Briefing_${templateType}.pptx`;

    // Let the user pick where to save (Save As). Cancel aborts.
    pptStatus.value = "Pilih lokasi penyimpanan...";
    const targetPath = await save({
      defaultPath: filename,
      filters: [{ name: "PowerPoint", extensions: ["pptx"] }],
    });
    if (!targetPath) {
      pptStatus.value = "";
      pptError.value = "Penyimpanan dibatalkan.";
      return;
    }

    const arrayBuffer = await response.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    const base64 = bytesToBase64(bytes);

    pptStatus.value = "Menyimpan file...";
    const savedPath = await invoke<string>("save_ppt_file", {
      filename,
      base64Data: base64,
      targetPath,
    });

    pptStatus.value = `Tersimpan: ${savedPath}`;

    // Open the generated deck in the default app (PowerPoint).
    try {
      await openPath(savedPath);
    } catch (e) {
      console.warn("openPath failed:", e);
    }
  } catch (err) {
    pptError.value = err instanceof Error ? err.message : "Network error";
    console.error("[generate-ppt] Error:", err);
  } finally {
    pptLoading.value = false;
  }
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
          <p style="color: var(--text-secondary); margin-bottom: 1rem;">
            Create a professional presentation for the current briefing session.
          </p>

          <label
            style="display: block; color: var(--text-secondary); font-size: 0.85rem; margin-bottom: 0.35rem;"
          >
            Link Group LINE (untuk QR)
          </label>
          <input
            v-model="lineGroupLink"
            type="text"
            placeholder="https://line.me/ti/g/..."
            :disabled="pptLoading"
            style="
              width: 100%;
              padding: 0.6rem 0.75rem;
              margin-bottom: 1rem;
              border-radius: 8px;
              border: 1px solid var(--glass-border);
              background: rgba(255, 255, 255, 0.05);
              color: var(--text-primary);
              font-size: 0.9rem;
              box-sizing: border-box;
            "
          />

          <div style="display: flex; gap: 0.75rem;">
            <button
              class="action-btn"
              :disabled="pptLoading"
              style="flex: 1;"
              @click="generatePPT('quiz')"
            >
              <span>TM / Quiz</span>
              <span>✨</span>
            </button>
            <button
              class="action-btn"
              :disabled="pptLoading"
              style="flex: 1;"
              @click="generatePPT('uap')"
            >
              <span>UAP</span>
              <span>✨</span>
            </button>
          </div>

          <div
            v-if="pptLoading || pptStatus || pptError"
            style="margin-top: 1rem; font-size: 0.85rem; word-break: break-word;"
          >
            <div v-if="pptLoading" style="color: var(--accent-primary);">
              ⏳ {{ pptStatus || 'Memproses...' }}
            </div>
            <div v-else-if="pptError" style="color: #ff6b6b; font-weight: 600;">
              ⚠ {{ pptError }}
            </div>
            <div v-else-if="pptStatus" style="color: #4ade80;">
              ✓ {{ pptStatus }}
            </div>
          </div>
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
