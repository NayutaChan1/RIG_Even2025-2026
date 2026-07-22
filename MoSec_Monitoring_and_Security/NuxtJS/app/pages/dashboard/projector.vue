<template>
  <div class="content-section">
    <div class="page-header">
      <div class="page-title">
        <Clock :size="24" />
        <h2>Projector Uptime</h2>
      </div>
      <p class="page-subtitle">
        Total projector uptime per room this week.
      </p>
    </div>

    <div class="summary-row">
      <div class="summary-card">
        <span class="summary-label">Building total</span>
        <span class="summary-value">{{ totalHours }} <small>hours</small></span>
      </div>
      <div class="summary-card">
        <span class="summary-label">Power consumption</span>
        <span class="summary-value">{{ totalPowerKwh }} <small>kWh</small></span>
      </div>
      <div class="summary-card">
        <span class="summary-label">Rooms tracked</span>
        <span class="summary-value">{{ roomList.length }}</span>
      </div>
    </div>

    <div v-if="roomList.length" class="uptime-list">
      <NuxtLink
        v-for="room in roomList"
        :key="room.roomId"
        :to="`/room/${room.roomId}`"
        class="uptime-row"
      >
        <span class="room-pill">Lab {{ room.roomName }}</span>

        <div class="bar-track">
          <div class="bar-fill" :style="{ width: barWidth(room.totalHours) + '%' }"></div>
        </div>

        <span class="uptime-hours">{{ room.totalHours }}h</span>
        <span v-if="room.projectorOn" class="on-tag">On now</span>
      </NuxtLink>
    </div>

    <div v-else-if="!pending" class="empty-state">
      <p>No projector data available.</p>
    </div>

    <div v-else class="empty-state">
      <p>Loading uptime...</p>
    </div>
  </div>
</template>

<script setup>
import { Clock } from '@lucide/vue'

definePageMeta({
  title: 'Projector Uptime',
  middleware: 'auth',
  backButton: { to: '/dashboard', label: '← Back to Dashboard' },
})

const { data, pending } = await useFetch('/api/analytics/projector-uptime', {
  transform: (res) => res.data,
})

const roomList = computed(() => data.value?.rooms ?? [])
const totalHours = computed(() => data.value?.totalHours ?? 0)
const totalPowerKwh = computed(() => data.value?.totalPowerKwh ?? 0)

const maxHours = computed(() =>
  roomList.value.reduce((max, r) => Math.max(max, r.totalHours), 0)
)

const barWidth = (hours) => {
  if (!maxHours.value) return 0
  return Math.round((hours / maxHours.value) * 100)
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
  margin-bottom: 1.5rem;
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
}

.summary-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 14px;
  margin-bottom: 2rem;
}

.summary-card {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 16px 18px;
  background: rgba(26, 26, 46, 0.8);
  border: 1px solid rgba(132, 148, 255, 0.2);
  border-radius: 14px;
}

.summary-label {
  color: #8494FF;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: 600;
}

.summary-value {
  color: white;
  font-size: 1.6rem;
  font-weight: 700;
}

.summary-value small {
  font-size: 0.85rem;
  font-weight: 500;
  color: #C9BEFF;
}

.uptime-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.uptime-row {
  display: grid;
  grid-template-columns: 110px 1fr 60px auto;
  align-items: center;
  gap: 16px;
  padding: 12px 16px;
  background: rgba(26, 26, 46, 0.8);
  border: 1px solid rgba(132, 148, 255, 0.15);
  border-radius: 12px;
  text-decoration: none;
  color: inherit;
  transition: all 0.2s ease;
}

.uptime-row:hover {
  border-color: #6367FF;
  transform: translateX(4px);
}

.room-pill {
  display: inline-block;
  padding: 5px 12px;
  background: rgba(99, 103, 255, 0.2);
  border: 1px solid rgba(99, 103, 255, 0.4);
  border-radius: 20px;
  color: white;
  font-weight: 600;
  font-size: 0.9rem;
  text-align: center;
}

.bar-track {
  height: 10px;
  background: rgba(132, 148, 255, 0.12);
  border-radius: 6px;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #6367FF 0%, #8494FF 100%);
  border-radius: 6px;
  transition: width 0.3s ease;
}

.uptime-hours {
  color: white;
  font-weight: 700;
  font-size: 0.95rem;
  text-align: right;
}

.on-tag {
  padding: 3px 10px;
  border-radius: 20px;
  font-size: 0.72rem;
  font-weight: 600;
  background: rgba(251, 191, 36, 0.15);
  border: 1px solid rgba(251, 191, 36, 0.4);
  color: #fbbf24;
  white-space: nowrap;
}

.empty-state {
  padding: 3rem;
  text-align: center;
  color: #C9BEFF;
}
</style>
