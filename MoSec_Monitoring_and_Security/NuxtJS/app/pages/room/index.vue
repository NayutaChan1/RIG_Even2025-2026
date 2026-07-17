<template>
  <div class="content-section">
        <p class="description">
          Select a lab you want to monitor to view detailed information about the projector status, door lock, and uptime.
        </p>
        
        <div class="rooms-grid">
          
          <NuxtLink to="/ruangan/rm-724" class="room-card">
            <div class="room-header">
              <div class="room-number">724</div>
              <div class="status-badge active">Active</div>
            </div>
            <div class="room-body">
              <h3 class="room-name">Lab 724</h3>
              <div class="room-stats">
                <div class="stat-item">
                  <span class="stat-icon"><Play :size="16" /></span>
                  <span class="stat-label">Projector: On</span>
                </div>
                <div class="stat-item">
                  <span class="stat-icon"><Lock :size="16" /></span>
                  <span class="stat-label">Door: Locked</span>
                </div>
              </div>
            </div>
            <div class="room-footer">
              <span class="view-detail">View Details →</span>
            </div>
          </NuxtLink>

          <NuxtLink to="/ruangan/rm-725" class="room-card">
            <div class="room-header">
              <div class="room-number">725</div>
              <div class="status-badge warning">Warning</div>
            </div>
            <div class="room-body">
              <h3 class="room-name">Lab 725</h3>
              <div class="room-stats">
                <div class="stat-item">
                  <span class="stat-icon"><Play :size="16" /></span>
                  <span class="stat-label">Projector: Off</span>
                </div>
                <div class="stat-item">
                  <span class="stat-icon"><Unlock :size="16" /></span>
                  <span class="stat-label">Door: Unlocked</span>
                </div>
              </div>
            </div>
            <div class="room-footer">
              <span class="view-detail">View Details →</span>
            </div>
          </NuxtLink>

          <NuxtLink to="/ruangan/rm-726" class="room-card">
            <div class="room-header">
              <div class="room-number">726</div>
              <div class="status-badge inactive">Inactive</div>
            </div>
            <div class="room-body">
              <h3 class="room-name">Lab 726</h3>
              <div class="room-stats">
                <div class="stat-item">
                  <span class="stat-icon"><Play :size="16" /></span>
                  <span class="stat-label">Projector: Off</span>
                </div>
                <div class="stat-item">
                  <span class="stat-icon"><Lock :size="16" /></span>
                  <span class="stat-label">Door: Locked</span>
                </div>
              </div>
            </div>
            <div class="room-footer">
              <span class="view-detail">View Details →</span>
            </div>
          </NuxtLink>

        </div>
      </div>
</template>

<script setup>
import { Play, Lock, Unlock } from '@lucide/vue'

definePageMeta({
  title: 'Lab Monitoring',
  middleware: 'auth',
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

.description {
  color: #C9BEFF;
  font-size: 1rem;
  margin-bottom: 2rem;
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
</style>
