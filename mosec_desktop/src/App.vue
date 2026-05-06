<script setup lang="ts">
import { ref, onMounted } from "vue";

const isTapped = ref(false);
const isLoading = ref(false);
const transactionData = ref({
  room: "Lab 601",
  subject: "Artificial Intelligence",
  lecturer: "Dr. Aris Purwanto",
  time: "10:00 - 12:00",
  status: "In Progress"
});

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
