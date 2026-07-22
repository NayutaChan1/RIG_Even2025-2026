<template>
  <div class="content-section">
    <div class="page-header">
      <div class="page-title">
        <DoorOpen :size="24" />
        <h2>Unlocked Incidents</h2>
      </div>
      <p class="page-subtitle">
        Rooms unlocked while not borrowed — live now, plus history by month.
      </p>

      <div v-if="months.length" class="month-picker">
        <label for="month-select">Month</label>
        <select id="month-select" v-model="selectedKey">
          <option v-for="month in months" :key="month.key" :value="month.key">
            {{ month.label }} ({{ month.count }})
          </option>
        </select>
      </div>
    </div>

    <!-- LIVE: rooms unlocked & not borrowed right now -->
    <section class="live-block">
      <div class="month-header">
        <h3 class="month-label">
          <span class="live-dot"></span> Right now
        </h3>
        <span class="month-count">
          {{ currentCount }} unlocked &amp; not borrowed
        </span>
      </div>

      <div v-if="currentIncidents.length" class="live-grid">
        <NuxtLink
          v-for="inc in currentIncidents"
          :key="inc.roomId"
          :to="`/room/${inc.roomId}`"
          class="live-card"
        >
          <div class="live-room">Lab {{ inc.roomName }}</div>
          <div class="live-tags">
            <span class="live-tag unlocked"><Unlock :size="13" /> Unlocked</span>
            <span v-if="inc.projectorOn" class="live-tag projector">Projector on</span>
          </div>
        </NuxtLink>
      </div>

      <div v-else-if="!currentPending" class="empty-inline">
        All rooms are locked or borrowed. Nothing unlocked right now. ✅
      </div>
      <div v-else class="empty-inline">Checking rooms…</div>
    </section>

    <h4 class="section-divider">History by month</h4>

    <div v-if="selectedMonth" class="month-block">
      <div class="month-header">
        <h3 class="month-label">{{ selectedMonth.label }}</h3>
        <span class="month-count">
          {{ selectedMonth.count }} incident{{ selectedMonth.count === 1 ? '' : 's' }}
        </span>
      </div>

      <div class="incident-table">
        <div class="incident-row incident-head">
          <span class="col-room">Room</span>
          <span class="col-time">Time found unlocked</span>
        </div>
        <div v-for="(inc, i) in selectedMonth.incidents" :key="i" class="incident-row">
          <span class="col-room">
            <span class="room-pill">Lab {{ inc.roomName }}</span>
          </span>
          <span class="col-time">{{ formatTime(inc.at) }}</span>
        </div>
      </div>
    </div>

    <div v-else-if="!pending" class="empty-state">
      <p>No unlock incidents recorded.</p>
    </div>

    <div v-else class="empty-state">
      <p>Loading incidents...</p>
    </div>
  </div>
</template>

<script setup>
import { DoorOpen, Unlock } from '@lucide/vue'

definePageMeta({
  title: 'Unlocked Incidents',
  middleware: 'auth',
  backButton: { to: '/dashboard', label: '← Back to Dashboard' },
})

// Live incidents right now (rooms unlocked & not borrowed).
const { data: currentData, pending: currentPending } = await useFetch(
  '/api/analytics/current-incidents',
  { transform: (res) => res.data }
)
const currentIncidents = computed(() => currentData.value?.incidents ?? [])
const currentCount = computed(() => currentData.value?.count ?? 0)

// Monthly history.
const { data, pending } = await useFetch('/api/analytics/unlock-incidents', {
  transform: (res) => res.data,
})

const months = computed(() => data.value?.months ?? [])

const selectedKey = ref(null)

// Default to the most recent month once data arrives.
watch(months, (list) => {
  if (list.length && !list.some((m) => m.key === selectedKey.value)) {
    selectedKey.value = list[0].key
  }
}, { immediate: true })

const selectedMonth = computed(
  () => months.value.find((m) => m.key === selectedKey.value) ?? null
)

const formatTime = (iso) => {
  const d = new Date(iso)
  return d.toLocaleString('en-GB', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}
</script>

<style scoped>
.content-section {
  background: rgba(37, 37, 58, 0.6);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(132, 148, 255, 0.2);
  border-radius: 16px;
  padding: 2rem;
}

.page-header {
  margin-bottom: 2rem;
}

.page-title {
  display: flex;
  align-items: center;
  gap: 12px;
  color: white;
  margin-bottom: 0.5rem;
}

.page-title h2 {
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0;
}

.page-subtitle {
  color: #C9BEFF;
  font-size: 0.95rem;
  margin: 0;
  line-height: 1.5;
}

.month-picker {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 1.25rem;
}

.month-picker label {
  color: #8494FF;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: 600;
}

.month-picker select {
  appearance: none;
  background: rgba(26, 26, 46, 0.9);
  border: 1px solid rgba(132, 148, 255, 0.35);
  border-radius: 10px;
  color: white;
  font-size: 0.9rem;
  font-weight: 600;
  padding: 10px 36px 10px 14px;
  cursor: pointer;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%238494FF' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;
  transition: border-color 0.2s ease;
}

.month-picker select:hover,
.month-picker select:focus {
  border-color: #6367FF;
  outline: none;
}

.month-picker option {
  background: #1a1a2e;
  color: white;
}

.month-list {
  display: flex;
  flex-direction: column;
  gap: 1.75rem;
}

/* Live "right now" section */
.live-block {
  margin-bottom: 2rem;
}

.live-dot {
  display: inline-block;
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: #FF6FB5;
  margin-right: 8px;
  box-shadow: 0 0 0 0 rgba(255, 111, 181, 0.6);
  animation: live-pulse 1.8s infinite;
}

@keyframes live-pulse {
  0% { box-shadow: 0 0 0 0 rgba(255, 111, 181, 0.6); }
  70% { box-shadow: 0 0 0 8px rgba(255, 111, 181, 0); }
  100% { box-shadow: 0 0 0 0 rgba(255, 111, 181, 0); }
}

.live-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 14px;
}

.live-card {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 18px;
  background: rgba(26, 26, 46, 0.8);
  border: 1px solid rgba(255, 111, 181, 0.3);
  border-radius: 14px;
  text-decoration: none;
  color: inherit;
  transition: all 0.25s ease;
}

.live-card:hover {
  transform: translateY(-4px);
  border-color: #FF6FB5;
  box-shadow: 0 10px 26px rgba(255, 111, 181, 0.25);
}

.live-room {
  font-size: 1.25rem;
  font-weight: 700;
  color: white;
}

.live-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.live-tag {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
}

.live-tag.unlocked {
  background: rgba(255, 111, 181, 0.15);
  border: 1px solid rgba(255, 111, 181, 0.4);
  color: #FF9BD2;
}

.live-tag.projector {
  background: rgba(251, 191, 36, 0.15);
  border: 1px solid rgba(251, 191, 36, 0.4);
  color: #fbbf24;
}

.empty-inline {
  padding: 1.25rem 1rem;
  color: #C9BEFF;
  background: rgba(26, 26, 46, 0.6);
  border: 1px dashed rgba(132, 148, 255, 0.25);
  border-radius: 12px;
  font-size: 0.9rem;
}

.section-divider {
  margin: 0 0 1rem 0;
  color: #8494FF;
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 1px;
  font-weight: 700;
}

.month-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 0.75rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid rgba(132, 148, 255, 0.2);
}

.month-label {
  font-size: 1.15rem;
  font-weight: 700;
  color: white;
  margin: 0;
}

.month-count {
  color: #FF9BD2;
  font-size: 0.85rem;
  font-weight: 600;
}

.incident-table {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.incident-row {
  display: grid;
  grid-template-columns: 160px 1fr;
  gap: 16px;
  align-items: center;
  padding: 12px 16px;
  background: rgba(26, 26, 46, 0.8);
  border: 1px solid rgba(132, 148, 255, 0.15);
  border-radius: 10px;
  color: #C9BEFF;
  font-size: 0.9rem;
}

.incident-head {
  background: transparent;
  border: none;
  padding: 4px 16px;
  color: #8494FF;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: 600;
}

.room-pill {
  display: inline-block;
  padding: 4px 12px;
  background: rgba(99, 103, 255, 0.2);
  border: 1px solid rgba(99, 103, 255, 0.4);
  border-radius: 20px;
  color: white;
  font-weight: 600;
}

.col-time {
  color: #C9BEFF;
}

.empty-state {
  padding: 3rem;
  text-align: center;
  color: #C9BEFF;
}
</style>
