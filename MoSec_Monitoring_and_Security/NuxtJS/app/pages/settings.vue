<template>
  <div class="settings-wrap">

    <!-- ACCOUNT -->
    <section class="card">
      <div class="card-head">
        <User :size="18" />
        <h2>Account</h2>
      </div>
      <div class="account-row">
        <div class="avatar">{{ (authUser?.initial || '?').charAt(0).toUpperCase() }}</div>
        <div class="account-meta">
          <p class="account-name">{{ authUser?.initial || 'Unknown user' }}</p>
          <p class="account-sub">
            <span :class="['dot', authUser?.token ? 'ok' : 'off']"></span>
            Messier session {{ authUser?.token ? 'active' : 'not connected' }}
          </p>
        </div>
        <button class="btn-danger" @click="logout">
          <LogOut :size="16" /> Log out
        </button>
      </div>
    </section>

    <!-- PREFERENCES -->
    <section class="card">
      <div class="card-head">
        <SlidersHorizontal :size="18" />
        <h2>Preferences</h2>
      </div>

      <div class="pref">
        <div class="pref-text">
          <p class="pref-label">Live refresh interval</p>
          <p class="pref-desc">How often monitoring pages re-check the sensors.</p>
        </div>
        <div class="stepper">
          <input type="number" min="3" max="120" v-model.number="form.refreshInterval" />
          <span class="unit">sec</span>
        </div>
      </div>

      <div class="pref">
        <div class="pref-text">
          <p class="pref-label">Highlight warnings</p>
          <p class="pref-desc">Emphasise rooms that are unlocked or left running.</p>
        </div>
        <button :class="['switch', { on: form.highlightWarnings }]" @click="form.highlightWarnings = !form.highlightWarnings">
          <span class="knob"></span>
        </button>
      </div>

      <div class="pref">
        <div class="pref-text">
          <p class="pref-label">Show room IDs</p>
          <p class="pref-desc">Display the raw UUID next to each room number.</p>
        </div>
        <button :class="['switch', { on: form.showRoomIds }]" @click="form.showRoomIds = !form.showRoomIds">
          <span class="knob"></span>
        </button>
      </div>

      <div class="pref">
        <div class="pref-text">
          <p class="pref-label">Sound alerts</p>
          <p class="pref-desc">Play a chime when a new security warning appears.</p>
        </div>
        <button :class="['switch', { on: form.soundAlerts }]" @click="form.soundAlerts = !form.soundAlerts">
          <span class="knob"></span>
        </button>
      </div>

      <div class="pref-actions">
        <transition name="fade">
          <span v-if="savedAt" class="saved-msg">✓ Saved</span>
        </transition>
        <button class="btn-ghost" @click="resetDefaults">Reset</button>
        <button class="btn-primary" @click="save">Save changes</button>
      </div>
    </section>

    <!-- SYSTEM INFO -->
    <section class="card">
      <div class="card-head">
        <Cpu :size="18" />
        <h2>System</h2>
      </div>
      <div class="info-grid">
        <div class="info-item">
          <span class="info-key">Projector light threshold</span>
          <span class="info-val">&lt; 400 lux</span>
        </div>
        <div class="info-item">
          <span class="info-key">Power factor</span>
          <span class="info-val">0.3 kWh / hour</span>
        </div>
        <div class="info-item">
          <span class="info-key">Data source</span>
          <span class="info-val">IoT sensors → API → PostgreSQL</span>
        </div>
        <div class="info-item">
          <span class="info-key">Room borrowings</span>
          <span class="info-val">Messier (BINUS)</span>
        </div>
      </div>
      <p class="info-note">
        Sensor thresholds and the dummy-sender incident rate are configured server-side in <code>.env</code>.
      </p>
    </section>

    <!-- ABOUT -->
    <section class="card about">
      <div class="brand">
        <div class="brand-logo"></div>
        <div>
          <p class="brand-name">MoSec</p>
          <p class="brand-tag">Monitoring &amp; Security · Lab operations dashboard</p>
        </div>
      </div>
      <span class="version">v1.0.0</span>
    </section>

  </div>
</template>

<script setup>
import { User, LogOut, SlidersHorizontal, Cpu } from '@lucide/vue'

definePageMeta({
  title: 'Settings',
  middleware: 'auth',
})

const authUser = useCookie('auth_user')

const DEFAULTS = {
  refreshInterval: 5,
  highlightWarnings: true,
  showRoomIds: false,
  soundAlerts: false,
}

// Persisted preferences (survive reloads).
const prefs = useCookie('mosec_prefs', { default: () => ({ ...DEFAULTS }) })

// Editable copy — only committed to the cookie on Save.
const form = reactive({ ...DEFAULTS, ...prefs.value })
const savedAt = ref(0)

function save() {
  form.refreshInterval = Math.min(120, Math.max(3, Number(form.refreshInterval) || DEFAULTS.refreshInterval))
  prefs.value = { ...form }
  savedAt.value = Date.now()
  setTimeout(() => { if (Date.now() - savedAt.value >= 1900) savedAt.value = 0 }, 2000)
}

function resetDefaults() {
  Object.assign(form, DEFAULTS)
  save()
}

function logout() {
  authUser.value = null
  navigateTo('/login')
}
</script>

<style scoped>
.settings-wrap {
  display: flex;
  flex-direction: column;
  gap: 18px;
  max-width: 820px;
}

.card {
  background: rgba(37, 37, 58, 0.6);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(132, 148, 255, 0.2);
  border-radius: 16px;
  padding: 1.5rem;
}

.card-head {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #8494FF;
  margin-bottom: 1.25rem;
}

.card-head h2 {
  font-size: 1.1rem;
  font-weight: 700;
  color: white;
  margin: 0;
}

/* Account */
.account-row {
  display: flex;
  align-items: center;
  gap: 16px;
}

.avatar {
  width: 52px;
  height: 52px;
  border-radius: 14px;
  display: grid;
  place-items: center;
  font-size: 1.4rem;
  font-weight: 800;
  color: white;
  background: linear-gradient(135deg, #6367FF, #8494FF);
  box-shadow: 0 4px 14px rgba(99, 103, 255, 0.4);
}

.account-name {
  margin: 0;
  color: white;
  font-weight: 700;
  font-size: 1.05rem;
}

.account-sub {
  margin: 4px 0 0;
  color: #C9BEFF;
  font-size: 0.85rem;
  display: flex;
  align-items: center;
  gap: 7px;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
}

.dot.ok { background: #22c55e; box-shadow: 0 0 8px #22c55e; }
.dot.off { background: #9ca3af; }

/* Preferences */
.pref {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 0;
  border-top: 1px solid rgba(132, 148, 255, 0.12);
}

.pref:first-of-type { border-top: none; }

.pref-label { margin: 0; color: white; font-weight: 600; font-size: 0.95rem; }
.pref-desc { margin: 3px 0 0; color: #9aa4d0; font-size: 0.82rem; }

.stepper {
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(26, 26, 46, 0.8);
  border: 1px solid rgba(132, 148, 255, 0.3);
  border-radius: 10px;
  padding: 6px 12px;
}

.stepper input {
  width: 46px;
  background: transparent;
  border: none;
  outline: none;
  color: white;
  font-weight: 700;
  font-size: 0.95rem;
  text-align: right;
}

.stepper .unit { color: #9aa4d0; font-size: 0.8rem; }

.switch {
  width: 46px;
  height: 26px;
  border-radius: 999px;
  border: none;
  background: rgba(132, 148, 255, 0.2);
  position: relative;
  cursor: pointer;
  transition: background 0.2s ease;
  flex-shrink: 0;
}

.switch.on { background: #6367FF; }

.knob {
  position: absolute;
  top: 3px;
  left: 3px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: white;
  transition: transform 0.2s ease;
}

.switch.on .knob { transform: translateX(20px); }

.pref-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 18px;
}

.saved-msg { color: #22c55e; font-size: 0.85rem; font-weight: 600; margin-right: auto; }

.btn-primary,
.btn-ghost,
.btn-danger {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 9px 18px;
  border-radius: 10px;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  border: 1px solid transparent;
  transition: all 0.2s ease;
}

.btn-primary {
  background: linear-gradient(135deg, #6367FF, #8494FF);
  color: white;
  box-shadow: 0 4px 12px rgba(99, 103, 255, 0.3);
}
.btn-primary:hover { transform: translateY(-2px); }

.btn-ghost {
  background: transparent;
  color: #C9BEFF;
  border-color: rgba(132, 148, 255, 0.3);
}
.btn-ghost:hover { background: rgba(132, 148, 255, 0.12); }

.btn-danger {
  background: rgba(239, 68, 68, 0.14);
  color: #f87171;
  border-color: rgba(239, 68, 68, 0.4);
  margin-left: auto;
}
.btn-danger:hover { background: rgba(239, 68, 68, 0.24); color: white; }

/* System info */
.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 12px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding: 14px;
  background: rgba(26, 26, 46, 0.6);
  border: 1px solid rgba(132, 148, 255, 0.12);
  border-radius: 12px;
}

.info-key { color: #9aa4d0; font-size: 0.78rem; text-transform: uppercase; letter-spacing: 0.04em; }
.info-val { color: white; font-weight: 600; font-size: 0.95rem; }

.info-note { margin: 14px 0 0; color: #9aa4d0; font-size: 0.82rem; }
.info-note code {
  background: rgba(132, 148, 255, 0.15);
  padding: 2px 6px;
  border-radius: 6px;
  color: #C9BEFF;
}

/* About */
.about { display: flex; align-items: center; justify-content: space-between; }
.brand { display: flex; align-items: center; gap: 14px; }
.brand-logo {
  width: 40px; height: 40px; border-radius: 12px;
  background: linear-gradient(135deg, #6367FF, #8494FF);
  box-shadow: 0 4px 12px rgba(99, 103, 255, 0.4);
}
.brand-name { margin: 0; color: white; font-weight: 800; font-size: 1.1rem; letter-spacing: 0.5px; }
.brand-tag { margin: 3px 0 0; color: #9aa4d0; font-size: 0.82rem; }
.version {
  color: #C9BEFF; font-size: 0.85rem; font-weight: 600;
  background: rgba(132, 148, 255, 0.12);
  padding: 6px 12px; border-radius: 999px;
}

.fade-enter-active, .fade-leave-active { transition: opacity 0.3s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
