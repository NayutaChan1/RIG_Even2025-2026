<template>
  <section class="analytics-shell">
    <div class="analytics-header">
      <div>
        <p class="eyebrow">Projector Analytics</p>
        <p class="lead">Single-day uptime analysis with daily and shift breakdowns.</p>
      </div>
      <span class="range-pill">Selected day</span>
    </div>

    <div v-if="pending" class="state-panel">
      <div class="skeleton title"></div>
      <div class="skeleton body"></div>
      <div class="skeleton body short"></div>
    </div>

    <div v-else-if="error" class="state-panel error-panel">
      <h3>Analytics unavailable</h3>
      <p>{{ errorMessage }}</p>
    </div>

    <!-- GRID -->
    <div v-else class="analytics-grid">
      <article class="metric-card metric-accent">
        <p class="metric-label">Total Uptime</p>
        <h3>{{ formatHours(data?.uptime.totalHours) }}</h3>
        <p class="metric-caption">{{ formatSeconds(data?.uptime.totalSeconds) }} on {{ selectedDateLabel }}</p>
      </article>

      <article class="metric-card">
        <p class="metric-label">Selected Day</p>
        <h3>{{ formatHours(dailyTotalHours) }}</h3>
        <p class="metric-caption">{{ formatSeconds(dailyTotalSeconds) }} on {{ selectedDateLabel }}</p>
      </article>

      <article class="metric-card">
        <p class="metric-label">Most Used Shift</p>
        <h3>{{ topShiftLabel }}</h3>
        <p class="metric-caption">{{ formatHours(topShiftHours) }} total uptime</p>
      </article>

      <article class="metric-card chart-card">
        <div class="card-head">
          <div>
            <p class="metric-label">Daily Total Uptime</p>
            <p class="metric-caption">Uptime for {{ selectedDateLabel }}</p>
          </div>
          <strong>{{ formatHours(dailyPeakHours) }} total</strong>
        </div>

        <div class="daily-scroll" v-if="dailyUptime.length">
          <div class="daily-bars">
            <div v-for="item in dailyUptime" :key="item.date" class="daily-bar-item">
              <div class="daily-bar-wrap">
                <div class="daily-bar-fill" :style="{ height: `${item.percent}%` }"></div>
              </div>
              <span class="daily-label">{{ item.label }}</span>
              <strong>{{ formatHours(item.totalHours) }}</strong>
            </div>
          </div>
        </div>

        <div v-else class="empty-trend">No projector uptime recorded for this day yet.</div>
      </article>

      <article class="metric-card span-2 chart-card">
        <div class="card-head">
          <div>
            <p class="metric-label">Uptime by Shift</p>
            <p class="metric-caption">Shift 1 to Shift 6 on {{ selectedDateLabel }}</p>
          </div>
          <strong>{{ formatHours(shiftPeakHours) }} peak shift</strong>
        </div>

        <div class="shift-grid" v-if="shiftUptime.length">
          <div v-for="item in shiftUptime" :key="item.shiftNo" class="shift-card">
            <div class="shift-top">
              <span class="shift-name">Shift {{ item.shiftNo }}</span>
              <span class="shift-range">{{ item.shiftLabel }}</span>
            </div>

            <div class="shift-track">
              <div class="shift-fill" :style="{ width: `${item.percent}%` }"></div>
            </div>

            <strong>{{ formatHours(item.totalHours) }}</strong>
          </div>
        </div>

        <div v-else class="empty-trend">No shift uptime recorded for this day yet.</div>
      </article>
    </div>
  </section>
</template>

<script setup lang="ts">
const props = defineProps<{
  roomId: string | number
  roomLabel?: string
  selectedDate?: string
}>()

const roomLabelText = computed(() => props.roomLabel || `Room ${props.roomId}`)
const selectedDateLabel = computed(() => props.selectedDate || 'today')

const { data, pending, error } = await useFetch('/api/analytics/projector', {
  query: computed(() => ({
    roomId: String(props.roomId),
    ...(props.selectedDate ? { date: props.selectedDate } : {}),
  })),
  transform: (response: any) => response.data,
})

const dailySeries = computed(() => data.value?.uptime.dailyUptime || [])
const shiftSeries = computed(() => data.value?.uptime.shiftUptime || [])

const dailyPeakHours = computed(() => data.value?.uptime.dailyPeakHours ?? 0)
const shiftPeakHours = computed(() => data.value?.uptime.shiftPeakHours ?? 0)

const dailyTotalSeconds = computed(() => Number(data.value?.uptime.totalSeconds || 0))
const dailyTotalHours = computed(() => Number(data.value?.uptime.totalHours || 0))

const dailyUptime = computed(() => {
  const series = dailySeries.value
  const maxHours = Math.max(...series.map((item: any) => Number(item.totalHours || 0)), 0)

  return series.map((item: any) => {
    const totalHours = Number(item.totalHours || 0)
    return {
      date: item.date,
      label: item.day,
      totalHours,
      percent: maxHours > 0 ? Math.max(8, Math.round((totalHours / maxHours) * 100)) : 0,
    }
  })
})

const shiftUptime = computed(() => {
  const series = shiftSeries.value
  const maxHours = Math.max(...series.map((item: any) => Number(item.totalHours || 0)), 0)

  return series.map((item: any) => {
    const totalHours = Number(item.totalHours || 0)
    return {
      shiftNo: item.shiftNo,
      shiftLabel: item.shiftLabel,
      totalHours,
      percent: maxHours > 0 ? Math.max(8, Math.round((totalHours / maxHours) * 100)) : 0,
    }
  })
})

const topShiftLabel = computed(() => {
  const top = [...shiftSeries.value].sort((a: any, b: any) => Number(b.totalHours || 0) - Number(a.totalHours || 0))[0]
  return top ? `Shift ${top.shiftNo}` : '-'
})

const topShiftHours = computed(() => {
  const top = [...shiftSeries.value].sort((a: any, b: any) => Number(b.totalHours || 0) - Number(a.totalHours || 0))[0]
  return Number(top?.totalHours || 0)
})

const errorMessage = computed(() => {
  const message = error.value?.data?.message || error.value?.message || 'Unable to load analytics.'
  return String(message)
})

function formatSeconds(seconds?: number) {
  const value = Number(seconds || 0)
  return `${value.toLocaleString('id-ID')} detik`
}

function formatHours(hours?: number) {
  const value = Number(hours || 0)
  return `${value.toFixed(1)} jam`
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

.analytics-shell {
  grid-column: span 2;
  border-radius: 24px;
  padding: 24px;
  background: linear-gradient(180deg, rgba(26, 26, 46, 0.96), rgba(18, 18, 32, 0.98));
  border: 1px solid rgba(132, 148, 255, 0.18);
  box-shadow: 0 18px 60px rgba(0, 0, 0, 0.28);
}

.analytics-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 20px;
}

.eyebrow {
  margin: 0 0 6px;
  color: #9eb0ff;
  text-transform: uppercase;
  letter-spacing: 0.18em;
  font-size: 0.72rem;
  font-weight: 700;
}

.analytics-header h2 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 800;
  color: #ffffff;
}

.lead {
  margin: 8px 0 0;
  color: #a7b4dd;
  font-size: 0.92rem;
}

.range-pill {
  display: inline-flex;
  align-items: center;
  padding: 10px 14px;
  border-radius: 999px;
  font-size: 0.85rem;
  font-weight: 700;
  color: #c9d4ff;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.analytics-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
}

.metric-card {
  min-height: 150px;
  padding: 18px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(132, 148, 255, 0.12);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.metric-accent {
  background: linear-gradient(135deg, rgba(99, 103, 255, 0.24), rgba(236, 72, 153, 0.22));
}

.metric-label {
  margin: 0;
  color: #c9d4ff;
  font-size: 0.8rem;
  font-weight: 600;
  letter-spacing: 0.03em;
  text-transform: uppercase;
}

.metric-card h3 {
  margin: 10px 0 8px;
  color: #ffffff;
  font-size: 2rem;
  line-height: 1.05;
  font-weight: 800;
}

.metric-caption {
  margin: 0;
  color: #a7b4dd;
  font-size: 0.92rem;
}

.span-2 {
  grid-column: span 2;
}

.span-3 {
  grid-column: span 3;
}

.chart-card {
  gap: 14px;
}

.card-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.card-head strong {
  color: #ffffff;
  font-size: 0.95rem;
}

.daily-scroll {
  overflow-x: auto;
  padding-bottom: 8px;
}

.daily-bars {
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: 72px;
  gap: 10px;
  align-items: center;
  min-height: 220px;
}

.daily-bar-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.daily-bar-wrap {
  width: 100%;
  height: 150px;
  border-radius: 8px;
  padding: 8px;
  display: flex;
  align-items: end;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(132, 148, 255, 0.1);
}

.daily-bar-fill {
  width: 100%;
  border-radius: 2px;
  background: linear-gradient(180deg, #8494ff, #6c48ff);
  min-height: 10px;
}

.daily-label {
  color: #bac5eb;
  font-size: 0.78rem;
}

.daily-bar-item strong,
.shift-card strong {
  color: #ffffff;
  font-size: 0.88rem;
}

.shift-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.shift-card {
  padding: 14px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(132, 148, 255, 0.1);
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.shift-top {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

.shift-name {
  color: #ffffff;
  font-weight: 700;
}

.shift-range {
  color: #a7b4dd;
  font-size: 0.85rem;
}

.shift-track {
  width: 100%;
  height: 12px;
  border-radius: 999px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.08);
}

.shift-fill {
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(90deg, #34d399, #22c55e);
}

.state-panel {
  min-height: 220px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 14px;
}

.error-panel {
  color: #fca5a5;
}

.skeleton {
  border-radius: 14px;
  background: linear-gradient(90deg, rgba(255, 255, 255, 0.06), rgba(255, 255, 255, 0.12), rgba(255, 255, 255, 0.06));
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

.skeleton.title {
  width: 40%;
  height: 24px;
}

.skeleton.body {
  width: 100%;
  height: 92px;
}

.skeleton.body.short {
  width: 72%;
  height: 48px;
}

.empty-trend {
  color: #a7b4dd;
  font-size: 0.95rem;
  min-height: 120px;
  display: flex;
  align-items: center;
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

@media (max-width: 1024px) {
  .analytics-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .span-2 {
    grid-column: span 2;
  }

  .shift-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .analytics-shell {
    padding: 18px;
  }

  .analytics-header {
    flex-direction: column;
  }

  .analytics-grid {
    grid-template-columns: 1fr;
  }

  .span-2 {
    grid-column: span 1;
  }

  .card-head {
    flex-direction: column;
  }
}
</style>