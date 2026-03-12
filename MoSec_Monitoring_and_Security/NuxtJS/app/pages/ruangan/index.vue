<template>
  <div class="dashboard-container">
    
    <aside class="sidebar">
      <div class="logo-container">
        <div class="logo-icon"></div>
        <h2>MoSec</h2>
      </div>
      
      <nav class="menu">
        <NuxtLink to="/dashboard" class="menu-item">
          <span class="icon">▦</span> Global Overview
        </NuxtLink>
        <NuxtLink to="/ruangan" class="menu-item">
          <span class="icon">⚡</span> Lab Monitoring
        </NuxtLink>
        <NuxtLink to="/laporan" class="menu-item">
          <span class="icon">▤</span> Reports
        </NuxtLink>
        <NuxtLink to="/pengaturan" class="menu-item">
          <span class="icon">⚙</span> Settings
        </NuxtLink>
      </nav>

      <div class="bottom-menu">
        <div class="user-card">
          <div class="user-avatar">A</div>
          <div class="user-details">
            <p class="username">{{ authUser?.initial }}</p>
            <p class="email">{{ authUser?.name }}</p>
          </div>
        </div>
        <button @click="handleLogout" class="logout-button">
          <span class="icon">⎆</span>
          <span>Logout</span>
        </button>
      </div>
    </aside>

    <main class="main-content">
      
      <header class="topbar">
        <h1 class="page-title">Lab Monitoring</h1>
        <div class="profile-section">
          <div class="avatar">A</div>
          <div class="user-info">
            <p class="user-name">{{ authUser?.initial }}</p>
            <p class="user-role">{{ authUser?.name }}</p>
          </div>
        </div>
      </header>

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
                  <span class="stat-icon">▶</span>
                  <span class="stat-label">Projector: On</span>
                </div>
                <div class="stat-item">
                  <span class="stat-icon">🔒</span>
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
                  <span class="stat-icon">▶</span>
                  <span class="stat-label">Projector: Off</span>
                </div>
                <div class="stat-item">
                  <span class="stat-icon">🔓</span>
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
                  <span class="stat-icon">▶</span>
                  <span class="stat-label">Projector: Off</span>
                </div>
                <div class="stat-item">
                  <span class="stat-icon">🔒</span>
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
    </main>

  </div>
</template>

<script setup>

definePageMeta({
  middleware : () => {
    const authUser = useCookie('auth_user')
    if(!authUser.value){
      return navigateTo('/login')
    }
  }
})

const authUser = useCookie('auth_user')

function handleLogout() {
  authUser.value = null
  navigateTo('/login')
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.dashboard-container {
  display: flex;
  height: 100vh;
  background: linear-gradient(135deg, #0f0f1e 0%, #1a1a2e 100%);
  font-family: 'Inter', sans-serif;
  color: #ffffff;
  overflow: hidden;
}

.sidebar {
  width: 260px;
  background: rgba(37, 37, 58, 0.6);
  backdrop-filter: blur(20px);
  padding: 2rem 1.5rem;
  display: flex;
  flex-direction: column;
  border-right: 1px solid rgba(132, 148, 255, 0.2);
}

.logo-container {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 3rem;
}

.logo-icon {
  width: 28px;
  height: 28px;
  background: linear-gradient(135deg, #6367FF 0%, #8494FF 100%);
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(99, 103, 255, 0.4);
}

.logo-container h2 {
  font-size: 1.5rem;
  font-weight: 800;
  letter-spacing: 1px;
  margin: 0;
}

.menu {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  color: #C9BEFF;
  text-decoration: none;
  border-radius: 10px;
  font-weight: 500;
  transition: all 0.3s;
}

.menu-item:hover {
  background: rgba(26, 26, 46, 0.8);
  color: white;
}

.menu-item.active,
.menu-item.router-link-active,
.menu-item.router-link-exact-active {
  background: linear-gradient(135deg, #6367FF 0%, #8494FF 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(99, 103, 255, 0.3);
}

.bottom-menu {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding-top: 1rem;
  border-top: 1px solid rgba(132, 148, 255, 0.2);
}

.user-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: rgba(26, 26, 46, 0.8);
  border: 1px solid rgba(132, 148, 255, 0.2);
  border-radius: 10px;
}

.user-avatar {
  width: 36px;
  height: 36px;
  background: #6367FF;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 0.9rem;
}

.user-details {
  flex: 1;
}

.username {
  margin: 0;
  font-weight: 600;
  font-size: 0.9rem;
  color: white;
}

.email {
  margin: 0;
  font-size: 0.75rem;
  color: #C9BEFF;
}

.logout-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px;
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  border: none;
  border-radius: 10px;
  color: white;
  font-weight: 600;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.3s ease;
  width: 100%;
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
}

.logout-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(239, 68, 68, 0.4);
}

.logout-button:active {
  transform: translateY(0);
}

.main-content {
  flex: 1;
  padding: 2rem;
  overflow-y: auto;
}

.topbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  background: rgba(37, 37, 58, 0.6);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(132, 148, 255, 0.2);
  padding: 1.5rem 2rem;
  border-radius: 16px;
}

.page-title {
  font-size: 1.8rem;
  font-weight: 700;
  margin: 0;
  color: #6367FF;
}

.profile-section {
  display: flex;
  align-items: center;
  gap: 12px;
}

.avatar {
  width: 45px;
  height: 45px;
  background: #6367FF;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 1.1rem;
}

.user-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.user-name {
  margin: 0;
  font-weight: 600;
  font-size: 0.95rem;
  color: white;
}

.user-role {
  margin: 0;
  font-size: 0.8rem;
  color: #C9BEFF;
}

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
