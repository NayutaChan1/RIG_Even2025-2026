<template>
  <div class="content-wrapper">

        <div class="filter-section">
          <div class="filter-group">
            <label for="roomSelect">Lab Room</label>
            <select
              id="roomSelect"
              v-model="selectedRoomId"
              class="select-input"
              :disabled="roomsPending"
            >
              <option value="">— Select a lab —</option>
              <option v-for="room in roomList" :key="room.id" :value="room.id">
                Lab {{ room.name }}
              </option>
            </select>
          </div>

          <div class="filter-group">
            <label for="reportDate">Report Date</label>
            <input
              id="reportDate"
              v-model="selectedDate"
              type="date"
              class="date-input"
              :max="todayIso"
            />
          </div>

          <div class="filter-actions">
            <button class="btn-filter" @click="applyFilter">
              <Search :size="16" />
              Apply
            </button>
            <button class="btn-reset" @click="resetFilter">
              <RefreshCw :size="16" />
              Reset
            </button>
          </div>
        </div>

        <div v-if="roomsError" class="state-panel error-panel">
          <h3>Could not load rooms</h3>
          <p>{{ roomsErrorMessage }}</p>
        </div>

        <ProjectorAnalyticsBento
          v-else-if="appliedRoomId"
          :key="`${appliedRoomId}-${appliedDate}`"
          :room-id="appliedRoomId"
          :room-label="appliedRoomLabel"
          :selected-date="appliedDate"
        />

        <div v-else class="empty-state">
          <h3>No room selected</h3>
          <p>Choose a lab and a report date above to view projector uptime, daily breakdown, and per-shift analytics.</p>
        </div>

      </div>
</template>

<script setup>
import { Search, RefreshCw } from '@lucide/vue'

definePageMeta({
  title: 'Projector Analytics',
  middleware: 'auth',
})

const route = useRoute()
const router = useRouter()

const todayIso = new Date().toISOString().slice(0, 10)

const {
  data: roomList,
  pending: roomsPending,
  error: roomsError,
} = await useFetch('/api/rooms', {
  transform: (res) => res?.data || [],
  default: () => [],
})

const roomsErrorMessage = computed(() => {
  const message = roomsError.value?.data?.message || roomsError.value?.message || 'Unable to fetch rooms.'
  return String(message)
})

const selectedRoomId = ref(String(route.query.roomId || '').trim())
const selectedDate = ref(String(route.query.date || todayIso).trim())

const appliedRoomId = ref(selectedRoomId.value)
const appliedDate = ref(selectedDate.value)

const appliedRoomLabel = computed(() => {
  const match = (roomList.value || []).find((r) => r.id === appliedRoomId.value)
  return match ? match.name : `Room ${appliedRoomId.value}`
})

watch(
  () => route.query.roomId,
  (value) => {
    const next = String(value || '').trim()
    selectedRoomId.value = next
    appliedRoomId.value = next
  }
)

watch(
  () => route.query.date,
  (value) => {
    const next = String(value || '').trim() || todayIso
    selectedDate.value = next
    appliedDate.value = next
  }
)

function applyFilter() {
  appliedRoomId.value = selectedRoomId.value
  appliedDate.value = selectedDate.value || todayIso

  router.push({
    path: '/projector',
    query: {
      ...(appliedRoomId.value ? { roomId: appliedRoomId.value } : {}),
      ...(appliedDate.value ? { date: appliedDate.value } : {}),
    },
  })
}

function resetFilter() {
  selectedRoomId.value = ''
  selectedDate.value = todayIso
  appliedRoomId.value = ''
  appliedDate.value = todayIso
  router.push({ path: '/projector', query: {} })
}
</script>

<style scoped>
.content-wrapper {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.filter-section {
  background: rgba(37, 37, 58, 0.6);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(132, 148, 255, 0.2);
  border-radius: 16px;
  padding: 1.5rem;
  display: flex;
  gap: 15px;
  align-items: flex-end;
  flex-wrap: wrap;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 200px;
}

.filter-group label {
  font-size: 0.85rem;
  color: #C9BEFF;
  font-weight: 500;
}

.date-input,
.select-input {
  padding: 10px 14px;
  background: rgba(26, 26, 46, 0.8);
  border: 1px solid rgba(132, 148, 255, 0.3);
  border-radius: 8px;
  color: white;
  font-size: 0.9rem;
  font-family: 'Inter', sans-serif;
  outline: none;
  transition: all 0.3s;
}

.date-input:focus,
.select-input:focus {
  border-color: #6367FF;
  box-shadow: 0 0 0 3px rgba(99, 103, 255, 0.1);
}

.select-input option { background: #1a1a2e; color: white; }

.filter-actions {
  display: flex;
  gap: 10px;
  margin-left: auto;
}

.btn-filter,
.btn-reset {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-filter {
  background: linear-gradient(135deg, #6367FF 0%, #8494FF 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(99, 103, 255, 0.3);
}

.btn-filter:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(99, 103, 255, 0.4);
}

.btn-reset {
  background: rgba(156, 163, 175, 0.2);
  color: #9ca3af;
  border: 1px solid rgba(156, 163, 175, 0.3);
}

.btn-reset:hover { background: rgba(156, 163, 175, 0.3); color: white; }

.empty-state {
  background: rgba(37, 37, 58, 0.6);
  border: 1px dashed rgba(132, 148, 255, 0.3);
  border-radius: 16px;
  padding: 3rem;
  text-align: center;
  color: #C9BEFF;
}

.empty-state h3 { margin: 0 0 10px; color: white; }
.empty-state p { margin: 0; }

.state-panel {
  background: rgba(37, 37, 58, 0.6);
  border: 1px solid rgba(132, 148, 255, 0.2);
  border-radius: 16px;
  padding: 1.5rem;
}

.error-panel { border-color: rgba(239, 68, 68, 0.5); color: #fca5a5; }
</style>
