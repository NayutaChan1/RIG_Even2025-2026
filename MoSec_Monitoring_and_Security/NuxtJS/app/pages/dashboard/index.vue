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
      <div class="bento-grid" v-if="summaryData">
        
        <div class="card card-purple">
          <div class="card-header"><span class="tag">⚡ Active Lab Status</span></div>
          <div class="card-body">
            <h1 class="big-number">{{ summaryData.activeLabs }}</h1>
            <p>Labs currently operating</p>
          </div>
        </div>

        <div class="card card-pink">
          <div class="card-header"><span class="tag">⚠ Security Warnings</span></div>
          <div class="card-body">
            <h1 class="big-number text-warning">{{ summaryData.warnings }}</h1>
            <p v-if="summaryData.warnings > 0">Labs with active warnings</p>
            <p v-else>All labs are secure</p>
          </div>
        </div>

        <div class="card card-dark">
          <div class="card-header"><span class="tag">🔓 Unlocked Incidents</span></div>
          <div class="card-body">
            <h1 class="big-number text-pink">{{ summaryData.unlockIncidents }}</h1>
            <p class="subtitle">Total this month</p>
          </div>
          <div class="wave-bg"></div>
        </div>

        <div class="card card-dark span-2">
          <div class="card-header"><span class="tag">◷ Total Projector Uptime (Building)</span></div>
          <div class="card-body chart-container">
            <div class="chart-info">
              <h1 class="big-number">{{ summaryData.totalUptime }} Hours</h1>
              <p class="subtitle">This week</p>
            </div>
            
            <div class="css-bar-chart">
              <div 
                v-for="(item, index) in summaryData.chartData" 
                :key="index"
                class="bar" 
                :style="{ height: item.percent + '%', background: item.percent === 100 ? '#6c48ff' : '#8494FF' }"
              >
                <span>{{ item.day }}</span>
              </div>
            </div>

          </div>
        </div>

        <div class="card card-gradient">
          <div class="card-header"><span class="tag">⚡ Total Power Consumption</span></div>
          <div class="card-body">
            <h1 class="big-number">{{ summaryData.totalPowerConsumption }} kWh</h1>
            <p class="subtitle">Projector power usage this week</p>
          </div>
        </div>

        <div class="card card-info span-2">
          <div class="card-header"><span class="tag">📊 Lab Quick Access</span></div>
          <div class="card-body">
            
            <div class="lab-quick-access">
              <NuxtLink 
                v-for="room in summaryData.rooms" 
                :key="room.id"
                :to="'/ruangan/' + room.id" 
                class="lab-card"
              >
                <div class="lab-icon">{{ room.num }}</div>
                <div class="lab-name">Lab {{ room.num }}</div>
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

const { data: summaryData } = await useFetch('/api/dashboard/global', {
  transform: (response) => response.data
})

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

.bento-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}

.span-2 {
  grid-column: span 2;
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
</style>
