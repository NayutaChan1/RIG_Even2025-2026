<template>
  <div class="dashboard-container">
    
    <aside class="sidebar">
      <div class="logo-container">
        <div class="logo-icon"></div>
        <h2>MoSec</h2>
      </div>
      
      <nav class="menu">
        <a href="#" class="menu-item active">
          <span class="icon">▦</span> Dashboard
        </a>
        <a href="#" class="menu-item">
          <span class="icon">▤</span> Laporan
        </a>
        <a href="#" class="menu-item">
          <span class="icon">⚙</span> Pengaturan
        </a>
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
        <h1 class="page-title">Dashboard Monitoring</h1>
        <div class="profile-section">
          <div class="avatar">A</div>
          <div class="user-info">
            <p class="user-name">{{ authUser?.initial }}</p>
            <p class="user-role">{{ authUser?.name }}</p>
          </div>
        </div>
      </header>

      <div class="bento-grid">
        
        <div class="card card-purple" @click="toggleProyektor">
          <div class="card-header">
            <span class="tag">▶ Status Proyektor</span>
          </div>
          <div class="card-body">
            <h1 class="big-number">{{ statusProyektor }}</h1>
            <p v-if="statusProyektor === 'NYALA'">Sedang digunakan saat ini</p>
            <p v-else>Proyektor dimatikan</p>
          </div>
        </div>

        <div class="card card-pink">
          <div class="card-header">
            <span class="tag">◈ Kunci Ruangan</span>
          </div>
          <div class="card-body">
            <p>{{ statusPintuText }}</p>
          </div>
        </div>

        <div class="card card-dark span-2">
          <div class="card-header">
            <span class="tag">◷ Uptime Proyektor (Minggu Ini)</span>
          </div>
          <div class="card-body chart-container">
            <div class="chart-info">
              <h1 class="big-number">24.3 Jam</h1>
              <p class="subtitle">Total jam menyala</p>
            </div>
            <div class="css-bar-chart">
              <div class="bar" style="height: 40%;"><span>Sen</span></div>
              <div class="bar" style="height: 70%;"><span>Sel</span></div>
              <div class="bar" style="height: 100%; background: #6c48ff;"><span>Rab</span></div>
              <div class="bar" style="height: 30%;"><span>Kam</span></div>
              <div class="bar" style="height: 50%;"><span>Jum</span></div>
            </div>
          </div>
        </div>

        <div class="card card-dark">
          <div class="card-header">
            <span class="tag">Lupa Dikunci</span>
          </div>
          <div class="card-body">
            <h1 class="big-number text-pink">3 Kali</h1>
            <p class="subtitle">Insiden bulan ini</p>
          </div>
          <div class="wave-bg"></div>
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

const statusProyektor = ref('NYALA')
const { doorId, fetchDoorId, updateDoorId } = useDoorStatus()
console.log(doorId)
function toggleProyektor() {
  statusProyektor.value = statusProyektor.value === 'NYALA' ? 'MATI' : 'NYALA'
}


const statusPintuText = computed(() => {  
  return doorId.value
})

function handleLogout() {
  authUser.value = null
  navigateTo('/login')
}

let intervalId = null;

onMounted(() => {
  fetchDoorId()
  
  intervalId = setInterval(() => {
    fetchDoorId()
  }, 5000)
})

onUnmounted(() => {
  if (intervalId) {
    clearInterval(intervalId)
  }
})
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

.menu-item.active {
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
  cursor: pointer;
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

.text-pink {
  color: #FFDBFD;
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
</style>