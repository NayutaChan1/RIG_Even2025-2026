<template>
  <div class="dashboard-container">
    <AppSidebar />
    <main class="main-content">
      <header class="topbar">
        <div class="topbar-left">
          <NuxtLink v-if="backButton" :to="backButton.to" class="back-button">{{ backButton.label }}</NuxtLink>
          <h1 class="page-title">{{ pageTitle }}</h1>
        </div>
        <div class="profile-section">
          <div class="avatar">A</div>
          <div class="user-info">
            <p class="user-name">{{ authUser?.initial }}</p>
            <p class="user-role">{{ authUser?.name }}</p>
          </div>
        </div>
      </header>
      <slot />
    </main>
  </div>
</template>

<script setup>
const route = useRoute()
const authUser = useCookie('auth_user')

const pageTitle = computed(() => String(route.meta?.title || 'Dashboard'))
const backButton = computed(() => route.meta?.backButton || null)
</script>

<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  margin: 0;
  padding: 0;
}

.dashboard-container {
  display: flex;
  height: 100vh;
  background: linear-gradient(135deg, #0f0f1e 0%, #1a1a2e 100%);
  font-family: 'Inter', sans-serif;
  color: #ffffff;
  overflow: hidden;
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

.topbar-left {
  display: flex;
  align-items: center;
  gap: 15px;
}

.back-button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
  background: rgba(26, 26, 46, 0.8);
  border: 1px solid rgba(132, 148, 255, 0.3);
  border-radius: 10px;
  color: #C9BEFF;
  text-decoration: none;
  font-weight: 500;
  font-size: 0.9rem;
  transition: all 0.3s ease;
}

.back-button:hover {
  background: rgba(99, 103, 255, 0.2);
  border-color: #6367FF;
  color: white;
  transform: translateX(-4px);
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
</style>
