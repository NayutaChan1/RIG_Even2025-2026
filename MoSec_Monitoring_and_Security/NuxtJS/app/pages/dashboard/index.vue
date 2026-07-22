<template>
  <div class="bento-grid" v-if="summaryData">

    <NuxtLink to="/dashboard/labs/active" class="card card-purple card-link">
      <div class="card-header"><span class="tag">
          <Zap :size="14" /> Active Lab Status
        </span></div>
      <div class="card-body">
        <h1 class="big-number">{{ summaryData.activeLabs }}</h1>
        <p>Labs currently operating</p>
      </div>
    </NuxtLink>

    <NuxtLink to="/dashboard/labs/warning" class="card card-pink card-link">
      <div class="card-header"><span class="tag">
          <AlertTriangle :size="14" /> Security Warnings
        </span></div>
      <div class="card-body">
        <h1 class="big-number text-warning">{{ summaryData.warnings }}</h1>
        <p v-if="summaryData.warnings > 0">Labs with active warnings</p>
        <p v-else>All labs are secure</p>
      </div>
    </NuxtLink>

    <NuxtLink to="/dashboard/incidents" class="card card-dark card-link">
      <div class="card-header"><span class="tag">
          <DoorOpen :size="14" /> Unlocked Incidents
        </span></div>
      <div class="card-body">
        <h1 class="big-number text-pink">{{ summaryData.unlockIncidents }}</h1>
        <p class="subtitle">Unlocked now, not borrowed</p>
      </div>
      <div class="wave-bg"></div>
    </NuxtLink>

    <NuxtLink to="/dashboard/projector" class="card card-dark span-2 card-link">
      <div class="card-header"><span class="tag">
          <Clock :size="14" /> Total Projector Uptime (Building)
        </span></div>
      <div class="card-body chart-container">
        <div class="chart-info">
          <h1 class="big-number">{{ summaryData.totalUptime }} Hours</h1>
          <p class="subtitle">This week</p>
        </div>

        <div class="css-bar-chart">
          <div v-for="(item, index) in summaryData.chartData" :key="index" class="bar"
            :style="{ height: item.percent + '%', background: item.percent === 100 ? '#6c48ff' : '#8494FF' }">
            <span>{{ item.day }}</span>
          </div>
        </div>

      </div>
    </NuxtLink>

    <div class="card card-gradient">
      <div class="card-header"><span class="tag">
          <BarChart3 :size="14" /> Total Power Consumption
        </span></div>
      <div class="card-body">
        <h1 class="big-number">{{ summaryData.totalPowerConsumption }} kWh</h1>
        <p class="subtitle">Projector power usage this week</p>
      </div>
    </div>

    <div class="card card-info span-3">
      <div class="card-header"><span class="tag">
          <BarChart3 :size="14" /> Lab Quick Access
        </span></div>
      <div class="card-body">

        <div class="lab-quick-access">
          <NuxtLink v-for="room in sortedRooms" :key="room.id" :to="'/room/' + room.id" class="lab-card">
            <div class="lab-icon">{{ room.name }}</div>
            <div class="lab-name">Lab {{ room.name }}</div>
            <div :class="['lab-status', room.status.toLowerCase()]">
              {{ room.status }}
            </div>
          </NuxtLink>
        </div>

      </div>
    </div>

  </div>

  <div v-else style="text-align: center; padding: 50px;">
    Memuat data...
  </div>
</template>

<script setup>
import {
  Zap,
  AlertTriangle,
  DoorOpen,
  Clock,
  BarChart3,
} from '@lucide/vue'

definePageMeta({
  title: 'Dashboard Monitoring',
  middleware: 'auth',
})

const { data: summaryData } = await useFetch('/api/analytics/global', {
  transform: (response) => response.data
})

// warning -> active -> ascending 
const getRoomPriority = (room) => {
  const status = String(room.status || '').toLowerCase()

  if (status === 'warning') return 0
  if (status === 'active') return 1

  return 2
}

const sortedRooms = computed(() => {
  if (!summaryData.value?.rooms) return []

  return [...summaryData.value.rooms].sort((a, b) => {
    const priorityDiff = getRoomPriority(a) - getRoomPriority(b)

    if (priorityDiff !== 0) return priorityDiff

    return String(a.name).localeCompare(String(b.name), undefined, { numeric: true })
  })
})
</script>

<style scoped>
.bento-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}

.span-2 {
  grid-column: span 2;
}

.span-3 {
  grid-column: span 3;
}

.card {
  border-radius: 16px;
  padding: 24px;
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;
  min-height: 200px;
  display: flex;
  flex-direction: column;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
}

.tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background-color: rgba(255, 255, 255, 0.2);
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 500;
}

.big-number {
  font-size: 3.5rem;
  margin: 20px 0 5px 0;
  font-weight: 800;
}

.card-purple {
  background: linear-gradient(135deg, #6367FF 0%, #8494FF 100%);
  box-shadow: 0 8px 24px rgba(99, 103, 255, 0.3);
}

.card-pink {
  background: linear-gradient(135deg, #8494FF 0%, #9FA9FF 100%);
  box-shadow: 0 8px 24px rgba(132, 148, 255, 0.3);
}

.card-dark {
  background: rgba(37, 37, 58, 0.6);
  backdrop-filter: blur(20px);
}

.card-gradient {
  background: linear-gradient(135deg, #FF6B6B 0%, #FF8E53 100%);
  box-shadow: 0 8px 24px rgba(255, 107, 107, 0.3);
}

.card-info {
  background: rgba(37, 37, 58, 0.6);
  backdrop-filter: blur(20px);
}

.text-pink {
  color: #FFDBFD;
}

.text-warning {
  color: #FFD700;
}

.subtitle {
  color: #C9BEFF;
  font-size: 0.9rem;
}

.chart-container {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-top: 10px;
}

.css-bar-chart {
  display: flex;
  gap: 15px;
  height: 100px;
  align-items: flex-end;
}

.css-bar-chart .bar {
  width: 40px;
  background-color: #8494FF;
  border-radius: 8px 8px 0 0;
  position: relative;
  transition: height 0.5s;
}

.css-bar-chart .bar span {
  position: absolute;
  bottom: -25px;
  left: 5px;
  font-size: 0.8rem;
  color: #C9BEFF;
}

.wave-bg {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 60px;
  background-color: #6367FF;
  border-radius: 50% 50% 0 0 / 100% 100% 0 0;
  opacity: 0.5;
}

.lab-quick-access {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 15px;
  margin-top: 15px;
}

.lab-card {
  background: rgba(26, 26, 46, 0.8);
  border: 1px solid rgba(132, 148, 255, 0.3);
  border-radius: 12px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  text-decoration: none;
  transition: all 0.3s ease;
}

.lab-card:hover {
  transform: translateY(-4px);
  border-color: #6367FF;
  box-shadow: 0 8px 16px rgba(99, 103, 255, 0.3);
}

.lab-icon {
  width: 60px;
  height: 60px;
  background: linear-gradient(135deg, #6367FF 0%, #8494FF 100%);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  font-weight: bold;
  color: white;
}

.lab-name {
  font-size: 1rem;
  font-weight: 600;
  color: white;
}

.lab-status {
  font-size: 0.8rem;
  padding: 4px 12px;
  border-radius: 12px;
  font-weight: 500;
}

.lab-status.active {
  background: rgba(34, 197, 94, 0.2);
  color: #22c55e;
}

.lab-status.warning {
  background: rgba(251, 191, 36, 0.2);
  color: #fbbf24;
}

.lab-status.inactive {
	background: rgba(156, 163, 175, 0.2);
	color: #9ca3af;
}

.card-link {
	text-decoration: none;
	color: inherit;
	cursor: pointer;
}

.card-link:hover {
	transform: translateY(-4px);
	box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
}
</style>
