<template>
  <div class="dashboard-container">
    
    <aside class="sidebar">
      <div class="logo-container">
        <div class="logo-icon"></div>
        <h2>MOSEC</h2>
      </div>
      
      <nav class="menu">
        <NuxtLink to="/dashboard" class="menu-item">
          <span class="icon">⊞</span> Dashboard
        </NuxtLink>
        <NuxtLink to="/ruangan" class="menu-item">
          <span class="icon">⚡</span> Lab Monitoring
        </NuxtLink>
        <NuxtLink to="/projector" class="menu-item">
          <span class="icon">▶</span> Projector
        </NuxtLink>
        <NuxtLink to="/laporan" class="menu-item">
          <span class="icon">📄</span> Laporan
        </NuxtLink>
        <NuxtLink to="/pengaturan" class="menu-item">
          <span class="icon">⚙️</span> Pengaturan
        </NuxtLink>
      </nav>

      <div class="bottom-menu">
        <div class="user-card">
          <div class="user-avatar">A</div>
          <div class="user-details">
            <p class="username">Admin</p>
            <p class="email">admin@mosec.lab</p>
          </div>
        </div>
        <button @click="handleLogout" class="logout-button">
          <span class="icon">🚪</span>
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
            <p class="user-name">Admin</p>
            <p class="user-role">Administrator</p>
          </div>
        </div>
      </header>

      <div class="bento-grid">
        
        <div class="card card-purple" @click="toggleProyektor">
          <div class="card-header">
            <span class="tag">📽️ Status Proyektor</span>
          </div>
          <div class="card-body">
            <h1 class="big-number">{{ statusProyektor }}</h1>
            <p v-if="statusProyektor === 'NYALA'">Sedang digunakan saat ini</p>
            <p v-else>Proyektor dimatikan</p>
          </div>
        </div>

        <div class="card card-pink">
        <!-- <div class="card card-pink" @click="togglePintu"> -->
          <div class="card-header">
            <span class="tag">🔒 Kunci Ruangan</span>
          </div>
          <div class="card-body">
            <p>{{ statusPintuText }}</p>
            <!-- <h1 class="big-number">{{ statusPintu }}</h1>
            <p v-if="statusPintu === 'TERKUNCI'">Aman & Terkunci Rapat</p> -->
            <!-- <p v-else>BAHAYA: Pintu Terbuka!</p> -->
          </div>
        </div>

        <div class="card card-dark span-2">
          <div class="card-header">
            <span class="tag">⏱️ Uptime Proyektor (Minggu Ini)</span>
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
            <span class="tag">⚠️ Lupa Dikunci</span>
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

const statusProyektor = ref('NYALA')
const { doorId, fetchDoorId, updateDoorId } = useDoorStatus()
console.log(doorId)
function toggleProyektor() {
  statusProyektor.value = statusProyektor.value === 'NYALA' ? 'MATI' : 'NYALA'
}

// function togglePintu() {
//   statusPintu.value = statusPintu.value === 'TERKUNCI' ? 'TERBUKA' : 'TERKUNCI'
// }


const statusPintuText = computed(() => {  
  return doorId.value
})

function handleLogout() {
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
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700;800&display=swap');

.dashboard-container {
  display: flex;
  height: 100vh;
  background-color: #1a1a24;
  font-family: 'Inter', sans-serif;
  color: #ffffff;
  overflow: hidden;
}

.sidebar {
  width: 250px;
  background-color: #222330;
  padding: 2rem 1.5rem;
  display: flex;
  flex-direction: column;
  border-right: 1px solid #2f3042;
}

.logo-container {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 3rem;
}

.logo-icon {
  width: 24px;
  height: 24px;
  background: linear-gradient(135deg, #8b5cf6, #ec4899);
  border-radius: 6px;
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
  color: #a0a0b0;
  text-decoration: none;
  border-radius: 12px;
  font-weight: 500;
  transition: all 0.2s;
}

.menu-item:hover {
  background-color: #2a2b3d;
  color: white;
}

.menu-item.active,
.menu-item.router-link-active,
.menu-item.router-link-exact-active {
  background-color: #6c48ff;
  color: white;
}

.bottom-menu {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #2f3042;
}

.user-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background-color: #2a2b3d;
  border-radius: 12px;
}

.user-avatar {
  width: 36px;
  height: 36px;
  background: linear-gradient(135deg, #8b5cf6, #ec4899);
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
  color: #a0a0b0;
}

.logout-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px;
  background: linear-gradient(135deg, #ef4444, #dc2626);
  border: none;
  border-radius: 12px;
  color: white;
  font-weight: 600;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.3s ease;
  width: 100%;
}

.logout-button:hover {
  background: linear-gradient(135deg, #dc2626, #b91c1c);
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(239, 68, 68, 0.4);
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
  background-color: #272835;
  padding: 1.5rem 2rem;
  border-radius: 16px;
}

.page-title {
  font-size: 1.8rem;
  font-weight: 800;
  margin: 0;
  background: linear-gradient(90deg, #8b5cf6, #ec4899);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.profile-section {
  display: flex;
  align-items: center;
  gap: 12px;
}

.avatar {
  width: 45px;
  height: 45px;
  background: linear-gradient(135deg, #6c48ff, #8b5cf6);
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
  color: #a0a0b0;
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
  border-radius: 24px;
  padding: 24px;
  position: relative;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.2s;
  min-height: 200px;
  display: flex;
  flex-direction: column;
}

.card:hover {
  transform: translateY(-5px);
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
  background: linear-gradient(135deg, #6c48ff, #8b5cf6);
  box-shadow: 0 10px 30px rgba(108, 72, 255, 0.3);
}

.card-pink {
  background: linear-gradient(135deg, #ff4081, #ec4899);
  box-shadow: 0 10px 30px rgba(236, 72, 153, 0.3);
}

.card-dark {
  background-color: #272835;
}

.text-pink {
  color: #ec4899;
}

.subtitle {
  color: #a0a0b0;
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
  background-color: #3f4056;
  border-radius: 8px 8px 0 0;
  position: relative;
  transition: height 0.5s;
}

.css-bar-chart .bar span {
  position: absolute;
  bottom: -25px;
  left: 5px;
  font-size: 0.8rem;
  color: #a0a0b0;
}

.wave-bg {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 60px;
  background-color: #6c48ff;
  border-radius: 50% 50% 0 0 / 100% 100% 0 0;
  opacity: 0.5;
}
</style>