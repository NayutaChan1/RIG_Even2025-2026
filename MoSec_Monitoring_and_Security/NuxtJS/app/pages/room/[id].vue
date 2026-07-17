<template>
  <div class="bento-grid" v-if="roomData">
        
        <div class="card card-purple" @click="toggleProyektor">
          <div class="card-header"><span class="tag"><Play :size="14" /> Projector Status</span></div>
          <div class="card-body">
            <h1 class="big-number">{{ localProjectorStatus }}</h1>
            <p v-if="localProjectorStatus === 'ON'">Currently in use</p>
            <p v-else>Projector is turned off</p>
          </div>
        </div>

        <div class="card card-pink">
          <div class="card-header"><span class="tag"><Lock :size="14" /> Room Lock</span></div>
          <div class="card-body">
            <p style="font-size: 1.5rem; font-weight: 700; display: inline-flex; align-items: center; gap: 8px;">
              <Lock :size="20" v-if="isDoorLocked" />
              <Unlock :size="20" v-else-if="isDoorLocked === false" />
              {{ doorStatusText }}
            </p>
          </div>
        </div>

        <ProjectorAnalyticsBento :room-id="roomId" :room-label="roomLabel" />

        <div class="card card-dark">
          <div class="card-header"><span class="tag">Left Unlocked</span></div>
          <div class="card-body">
            <h1 class="big-number text-pink">{{ roomData.unlockIncidents }} Times</h1>
            <p class="subtitle">Incidents this month</p>
          </div>
          <div class="wave-bg"></div>
        </div>

      </div>
      
      <div v-else style="padding: 3rem; text-align: center;">
         Memuat data ruangan...
      </div>
</template>

<script setup>
import { Play, Lock, Unlock } from '@lucide/vue'

definePageMeta({
  title: 'Room Detail',
  middleware: 'auth',
  backButton: { to: '/ruangan', label: '← Back' },
})

const route = useRoute()

const roomId = computed(() => route.params.id)
const roomLabel = computed(() => roomData.value?.roomName || `Lab ${String(roomId.value).toUpperCase()}`)

const { data: roomData, refresh: refreshRoomData } = await useFetch('/api/dashboard/room', {
  query: { roomId: roomId.value },
  transform: (res) => res.data
})

const localProjectorStatus = ref('OFF')

watchEffect(() => {
  if (roomData.value) {
    localProjectorStatus.value = roomData.value.projectorOn ? 'ON' : 'OFF'
  }
})

const { doorId, fetchDoorId } = useDoorStatus()

const isDoorLocked = computed(() => {
  if (doorId.value) return doorId.value === 'closed'
  if (roomData.value) return roomData.value.doorLocked
  return null
})

const doorStatusText = computed(() => {
  if (isDoorLocked.value === null) return 'Loading...'
  return isDoorLocked.value ? 'Locked' : 'Unlocked'
})

function toggleProyektor() {
  localProjectorStatus.value = localProjectorStatus.value === 'ON' ? 'OFF' : 'ON'
}

let intervalId = null

onMounted(() => {
  if (fetchDoorId) fetchDoorId()

  intervalId = setInterval(() => {
    if (fetchDoorId) fetchDoorId()
    refreshRoomData()
  }, 5000)
})

onUnmounted(() => {
  if (intervalId) {
    clearInterval(intervalId)
  }
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
