<template>
  <aside class="sidebar">
    <div class="logo-container">
      <div class="logo-icon"></div>
      <h2>MoSec</h2>
    </div>
    <nav class="menu">
      <NuxtLink
        v-for="item in menuItems"
        :key="item.to"
        :to="item.to"
        class="menu-item"
      >
        <component :is="item.icon" class="menu-icon" :size="20" />
        {{ item.label }}
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
        <LogOut class="menu-icon" :size="18" />
        <span>Logout</span>
      </button>
    </div>
  </aside>
</template>

<script setup>
import { FileText, LayoutDashboard, LogOut, Monitor, Projector, Settings } from '@lucide/vue';


const authUser = useCookie('auth_user')

const menuItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Global Overview' },
  { to: '/room', icon: Monitor, label: 'Lab Monitoring' },
  { to: '/projector', icon: Projector, label: 'Projector' },
  { to: '/report', icon: FileText, label: 'Reports' },
  { to: '/settings', icon: Settings, label: 'Settings' },
]

function handleLogout() {
  authUser.value = null
  navigateTo('/login')
}
</script>

<style scoped>
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

.menu-icon {
  flex-shrink: 0;
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
</style>
