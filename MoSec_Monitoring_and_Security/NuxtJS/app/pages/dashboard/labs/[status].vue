<template>
  <div class="content-section">
    <div class="page-header">
      <div class="page-title">
        <component :is="statusIcon" :size="24" />
        <h2>{{ pageTitle }}</h2>
      </div>
      <p class="page-subtitle">{{ pageSubtitle }}</p>
    </div>

    <div v-if="filteredRooms.length" class="rooms-grid">
      <NuxtLink v-for="room in filteredRooms" :key="room.id" :to="`/room/${room.id}`" class="room-card">
        <div class="room-header">
          <div class="room-number">{{ room.name }}</div>
          <div class="status-badge" :class="room.badgeStatus">{{ room.badgeText }}</div>
        </div>
        <div class="room-body">
          <h3 class="room-name">{{ room.name }}</h3>
          <div class="room-stats">
            <div class="stat-item">
              <span class="stat-icon">
                <Play :size="16" />
              </span>
              <span class="stat-label">Projector: {{ room.projectorOn ? 'On' : 'Off' }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-icon" v-if="room.doorLocked">
                <Lock :size="16" />
              </span>
              <span class="stat-icon" v-else>
                <Unlock :size="16" />
              </span>
              <span class="stat-label">Door: {{ room.doorLocked ? 'Locked' : 'Unlocked' }}</span>
            </div>
          </div>
        </div>
        <div v-if="room.borrower" class="room-borrower">
          <User :size="14" />
          <span>{{ room.borrower.username }}<template v-if="room.borrower.division"> · {{ room.borrower.division
              }}</template></span>
        </div>
        <div class="room-footer">
          <span class="view-detail">View Details →</span>
        </div>
      </NuxtLink>
    </div>

    <div v-else-if="!pending" class="empty-state">
      <p>No labs with this status.</p>
    </div>

    <div v-else class="empty-state">
      <p>Loading labs...</p>
    </div>
  </div>
</template>

<script setup>
import { Play, Lock, Unlock, Zap, AlertTriangle, User } from '@lucide/vue'

const route = useRoute()
const status = computed(() => route.params.status)

const statusConfig = computed(() => {
  const s = status.value
  if (s === 'active') {
    return {
      title: 'Active Labs',
      subtitle: 'Labs currently in use with door unlocked and projector on.',
      icon: Zap,
    }
  }
  return {
    title: 'Security Warnings',
    subtitle: 'Labs with door unlocked or projector left on without an active session.',
    icon: AlertTriangle,
  }
})

const pageTitle = computed(() => statusConfig.value.title)
const pageSubtitle = computed(() => statusConfig.value.subtitle)
const statusIcon = computed(() => statusConfig.value.icon)

definePageMeta({
  title: 'Lab Status',
  middleware: 'auth',
  backButton: { to: '/dashboard', label: '← Back to Dashboard' },
})

const { data, pending } = await useFetch('/api/rooms', {
  transform: (res) => res.data,
})

const filteredRooms = computed(() => {
  if (!data.value) return []
  return data.value.filter((room) => room.status.toLowerCase() === status.value)
})
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

.rooms-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;
}

.room-card {
  background: rgba(26, 26, 46, 0.8);
  border: 2px solid rgba(132, 148, 255, 0.2);
  border-radius: 16px;
  padding: 24px;
  text-decoration: none;
  color: inherit;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.room-card:hover {
  transform: translateY(-6px);
  border-color: #6367FF;
  box-shadow: 0 12px 32px rgba(99, 103, 255, 0.4);
}

.room-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.room-number {
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
  box-shadow: 0 4px 12px rgba(99, 103, 255, 0.4);
}

.status-badge {
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.status-badge.active {
  background: rgba(34, 197, 94, 0.2);
  color: #22c55e;
  border: 1px solid #22c55e;
}

.status-badge.warning {
  background: rgba(251, 191, 36, 0.2);
  color: #fbbf24;
  border: 1px solid #fbbf24;
}

.status-badge.inactive {
  background: rgba(156, 163, 175, 0.2);
  color: #9ca3af;
  border: 1px solid #9ca3af;
}

.room-body {
  flex: 1;
}

.room-name {
  font-size: 1.5rem;
  font-weight: 700;
  color: white;
  margin: 0 0 16px 0;
}

.room-stats {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #C9BEFF;
  font-size: 0.95rem;
}

.stat-icon {
  width: 24px;
  text-align: center;
}

.room-borrower {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  background: rgba(99, 103, 255, 0.15);
  border: 1px solid rgba(99, 103, 255, 0.3);
  border-radius: 10px;
  color: #C9BEFF;
  font-size: 0.85rem;
  font-weight: 500;
}

.room-footer {
  padding-top: 12px;
  border-top: 1px solid rgba(132, 148, 255, 0.2);
}

.view-detail {
  color: #6367FF;
  font-weight: 600;
  font-size: 0.95rem;
  transition: all 0.3s ease;
}

.room-card:hover .view-detail {
  color: #8494FF;
  transform: translateX(4px);
  display: inline-block;
}

.empty-state {
  padding: 3rem;
  text-align: center;
  color: #C9BEFF;
}
</style>
