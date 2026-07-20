<template>
  <div class="content-wrapper">
        <div class="filter-section">
          <div class="filter-group">
            <label for="startDate">Start Date</label>
            <input 
              type="date" 
              id="startDate" 
              v-model="filterStartDate"
              class="date-input"
            />
          </div>
          
          <div class="filter-group">
            <label for="endDate">End Date</label>
            <input 
              type="date" 
              id="endDate" 
              v-model="filterEndDate"
              class="date-input"
            />
          </div>

          <div class="filter-group">
            <label for="reportType">Report Type</label>
            <select v-model="reportType" id="reportType" class="select-input">
              <option value="transactions">Card Tap Transactions</option>
              <option value="lock_history">Room Lock History</option>
            </select>
          </div>
          
          <div class="filter-actions">
            <button @click="applyFilter" class="btn-filter">
              <Search :size="16" />
              Apply Filter
            </button>
            <button @click="resetFilter" class="btn-reset">
              <RefreshCw :size="16" />
              Reset
            </button>
          </div>
        </div>

        <div class="table-section">
          <div class="table-header">
            <h2 class="section-title">
              {{ reportType === 'transactions' ? 'Card Tap Transactions' : 'Room Lock History' }}
            </h2>
            <div class="export-buttons">
              <button @click="exportToExcel" class="btn-export">
                <FileSpreadsheet :size="16" />
                Export Excel
              </button>
              <button @click="exportToPDF" class="btn-export">
                <FileText :size="16" />
                Export PDF
              </button>
            </div>
          </div>

          <div class="table-container" v-if="reportType === 'transactions'">
            <table class="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>User ID</th>
                  <th>Name</th>
                  <th>Status</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="!filteredTransactions || filteredTransactions.length === 0">
                  <td colspan="5" class="no-data">No transaction data available</td>
                </tr>
                <tr v-for="transaction in filteredTransactions" :key="transaction.id">
                  <td>{{ transaction.id }}</td>
                  <td>{{ transaction.userId }}</td>
                  <td>{{ transaction.userName || 'N/A' }}</td>
                  <td>
                    <span :class="['status-badge', getStatusClass(transaction.status)]">
                      {{ transaction.status }}
                    </span>
                  </td>
                  <td>{{ formatDate(transaction.timestamp) }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="table-container" v-else>
            <table class="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Room</th>
                  <th>Lock Status</th>
                  <th>Locked By</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="!filteredLockHistory || filteredLockHistory.length === 0">
                  <td colspan="5" class="no-data">No lock history data available</td>
                </tr>
                <tr v-for="lock in filteredLockHistory" :key="lock.id">
                  <td>{{ lock.id }}</td>
                  <td>{{ lock.roomId }}</td>
                  <td>
                    <span :class="['lock-badge', lock.isLocked ? 'locked' : 'unlocked']">
                      <Lock :size="14" v-if="lock.isLocked" />
                      <Unlock :size="14" v-else />
                      {{ lock.isLocked ? 'Locked' : 'Unlocked' }}
                    </span>
                  </td>
                  <td>{{ lock.lockedBy || 'System' }}</td>
                  <td>{{ formatDate(lock.timestamp) }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="pagination">
            <button @click="prevPage" :disabled="currentPage === 1" class="btn-page">
              ← Previous
            </button>
            <span class="page-info">Page {{ currentPage }} of {{ totalPages }}</span>
            <button @click="nextPage" :disabled="currentPage === totalPages" class="btn-page">
              Next →
            </button>
          </div>
        </div>
      </div>
</template>

<script setup>
import { Search, RefreshCw, FileSpreadsheet, FileText, Lock, Unlock } from '@lucide/vue'

definePageMeta({
  title: 'Reports & Activity Logs',
  middleware: 'auth',
})

const filterStartDate = ref('')
const filterEndDate = ref('')
const reportType = ref('transactions')
const currentPage = ref(1)
const itemsPerPage = 10

const { data: dbReports } = await useFetch('/api/reports', {
  transform: (response) => response.data
})

const filteredTransactions = computed(() => {
  let data = dbReports.value?.transactions || []
  
  if (filterStartDate.value) {
    data = data.filter(t => new Date(t.timestamp) >= new Date(filterStartDate.value))
  }
  if (filterEndDate.value) {
    const end = new Date(filterEndDate.value)
    end.setHours(23, 59, 59)
    data = data.filter(t => new Date(t.timestamp) <= end)
  }
  return data
})

const filteredLockHistory = computed(() => {
  let data = dbReports.value?.lockHistory || []
  
  if (filterStartDate.value) {
    data = data.filter(l => new Date(l.timestamp) >= new Date(filterStartDate.value))
  }
  if (filterEndDate.value) {
    const end = new Date(filterEndDate.value)
    end.setHours(23, 59, 59)
    data = data.filter(l => new Date(l.timestamp) <= end)
  }
  return data
})

const paginatedData = computed(() => {
  const data = reportType.value === 'transactions' ? filteredTransactions.value : filteredLockHistory.value
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return data.slice(start, end)
})

const totalPages = computed(() => {
  const data = reportType.value === 'transactions' ? filteredTransactions.value : filteredLockHistory.value
  return Math.ceil(data.length / itemsPerPage) || 1
})

function applyFilter() { currentPage.value = 1 }
function resetFilter() { filterStartDate.value = ''; filterEndDate.value = ''; currentPage.value = 1 }
function prevPage() { if (currentPage.value > 1) currentPage.value-- }
function nextPage() { if (currentPage.value < totalPages.value) currentPage.value++ }

function formatDate(date) {
  return new Date(date).toLocaleString('id-ID', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function getStatusClass(status) { return status === 'Success' ? 'status-success' : 'status-failed' }
function exportToExcel() { alert('Export to Excel - Feature coming soon!') }
function exportToPDF() { alert('Export to PDF - Feature coming soon!') }
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
  min-width: 180px;
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

.select-input option {
  background: #1a1a2e;
  color: white;
}

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

.btn-reset:hover {
  background: rgba(156, 163, 175, 0.3);
  color: white;
}

.table-section {
  background: rgba(37, 37, 58, 0.6);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(132, 148, 255, 0.2);
  border-radius: 16px;
  padding: 1.5rem;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.section-title {
  font-size: 1.3rem;
  font-weight: 700;
  color: white;
  margin: 0;
}

.export-buttons {
  display: flex;
  gap: 10px;
}

.btn-export {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: rgba(26, 26, 46, 0.8);
  border: 1px solid rgba(132, 148, 255, 0.3);
  border-radius: 8px;
  color: #C9BEFF;
  font-weight: 600;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-export:hover {
  background: rgba(99, 103, 255, 0.2);
  border-color: #6367FF;
  color: white;
}

.table-container {
  overflow-x: auto;
  border-radius: 12px;
  border: 1px solid rgba(132, 148, 255, 0.2);
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
}

.data-table thead {
  background: rgba(26, 26, 46, 0.8);
}

.data-table th {
  padding: 14px 16px;
  text-align: left;
  font-weight: 600;
  color: #6367FF;
  border-bottom: 2px solid rgba(132, 148, 255, 0.3);
}

.data-table td {
  padding: 12px 16px;
  border-bottom: 1px solid rgba(132, 148, 255, 0.1);
  color: #C9BEFF;
}

.data-table tbody tr {
  transition: all 0.2s;
}

.data-table tbody tr:hover {
  background: rgba(99, 103, 255, 0.1);
}

.no-data {
  text-align: center;
  color: #9ca3af;
  font-style: italic;
  padding: 30px;
}

.status-badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
}

.status-success {
  background: rgba(34, 197, 94, 0.2);
  color: #22c55e;
  border: 1px solid #22c55e;
}

.status-failed {
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;
  border: 1px solid #ef4444;
}

.lock-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 600;
}

.lock-badge.locked {
  background: rgba(34, 197, 94, 0.2);
  color: #22c55e;
  border: 1px solid #22c55e;
}

.lock-badge.unlocked {
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;
  border: 1px solid #ef4444;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20px;
  margin-top: 1.5rem;
}

.btn-page {
  padding: 8px 16px;
  background: rgba(26, 26, 46, 0.8);
  border: 1px solid rgba(132, 148, 255, 0.3);
  border-radius: 8px;
  color: #C9BEFF;
  font-weight: 600;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-page:hover:not(:disabled) {
  background: rgba(99, 103, 255, 0.2);
  border-color: #6367FF;
  color: white;
}

.btn-page:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.page-info {
  color: #C9BEFF;
  font-size: 0.9rem;
  font-weight: 500;
}
</style>