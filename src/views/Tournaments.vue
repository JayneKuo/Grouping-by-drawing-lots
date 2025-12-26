<template>
  <div class="tournaments">
      <van-nav-bar title="赛事列表" fixed>
        <template #right>
          <div class="nav-actions">
            <div class="sync-status" :class="syncStatusClass" @click="checkSyncStatus">
              <van-icon :name="syncIcon" :color="syncColor" size="18" />
              <span class="sync-text">{{ syncText }}</span>
            </div>
            <van-icon 
              v-if="isAdmin"
              name="delete-o" 
              size="18" 
              color="#ee0a24" 
              class="clear-data-btn"
              @click="handleClearAllData"
              title="清空所有数据"
            />
          </div>
        </template>
      </van-nav-bar>
      
      <div class="content">
      <van-pull-refresh v-model="refreshing" @refresh="loadTournaments">
        <van-list
          v-model:loading="loading"
          :finished="finished"
          finished-text="没有更多了"
          @load="loadTournaments"
        >
          <van-empty v-if="!loading && tournaments.length === 0" description="暂无比赛" />
          
          <div
            v-for="(tournament, index) in tournaments"
            :key="tournament.id"
            class="tournament-card"
          >
            <div class="card-header" @click="goToDetail(tournament.id)">
              <div class="card-title">
                <span class="tournament-number">{{ index + 1 }}</span>
                <span class="tournament-name">{{ tournament.name }}</span>
              </div>
              <van-tag :type="getStatusType(tournament.status)" size="medium">
                {{ getStatusText(tournament.status) }}
              </van-tag>
            </div>
            
            <div class="card-desc">
              {{ getTournamentDesc(tournament) }}
            </div>
            
            <div class="card-footer">
              <div class="footer-item">
                <van-icon name="friends-o" size="16" />
                <span>{{ tournament.players?.length || 0 }}人</span>
              </div>
              <div v-if="tournament.start_date || tournament.start_time" class="footer-item">
                <van-icon name="clock-o" size="16" />
                <span>{{ formatDateTime(tournament) }}</span>
              </div>
              <div v-if="tournament.location" class="footer-item">
                <van-icon name="location-o" size="16" />
                <span>{{ tournament.location }}</span>
              </div>
            </div>
          </div>
        </van-list>
      </van-pull-refresh>
    </div>
    
    <!-- 创建比赛弹窗 -->
    <van-popup v-model:show="showCreateModal" position="bottom" :style="{ height: '80%' }">
      <CreateTournament @success="handleCreateSuccess" @cancel="showCreateModal = false" />
    </van-popup>
    
    <!-- 浮动添加按钮 -->
    <div class="fab-button" @click="showCreateModal = true">
      <van-icon name="plus" size="24" />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { getTournaments, deleteTournament } from '../api/tournaments'
import { showFailToast, showSuccessToast, showConfirmDialog } from 'vant'
import CreateTournament from '../components/CreateTournament.vue'
import { storage, syncStatus } from '../utils/storage'
import { useUserStore } from '../store/user'

const router = useRouter()
const userStore = useUserStore()
const tournaments = ref([])
const loading = ref(false)
const finished = ref(false)
const refreshing = ref(false)
const showCreateModal = ref(false)

// 检查是否为管理员
const isAdmin = computed(() => {
  return userStore.user?.role === 'admin'
})

// 同步状态
const syncState = ref('idle')
const syncTime = ref(null)
const syncError = ref(null)

// 同步状态显示
const syncStatusClass = computed(() => {
  return {
    'sync-idle': syncState.value === 'idle',
    'sync-syncing': syncState.value === 'syncing',
    'sync-success': syncState.value === 'success',
    'sync-error': syncState.value === 'error'
  }
})

const syncIcon = computed(() => {
  if (syncState.value === 'syncing') return 'replay'
  if (syncState.value === 'success') return 'success'
  if (syncState.value === 'error') return 'warning-o'
  return 'passed'
})

const syncColor = computed(() => {
  if (syncState.value === 'syncing') return '#3b82f6'
  if (syncState.value === 'success') return '#10b981'
  if (syncState.value === 'error') return '#ef4444'
  return '#64748b'
})

const syncText = computed(() => {
  if (syncState.value === 'syncing') return '同步中...'
  if (syncState.value === 'success') return '已同步'
  if (syncState.value === 'error') return '同步失败'
  if (syncTime.value) {
    const time = new Date(syncTime.value)
    const now = new Date()
    const diff = Math.floor((now - time) / 1000)
    if (diff < 60) return `${diff}秒前`
    if (diff < 3600) return `${Math.floor(diff / 60)}分钟前`
    return `${Math.floor(diff / 3600)}小时前`
  }
  return '未同步'
})

// 监听同步状态变化
let syncStatusUnsubscribe = null

async function checkSyncStatus() {
  // 如果正在同步中，不重复触发
  if (syncState.value === 'syncing') {
    showSuccessToast('正在同步中，请稍候...')
    return
  }
  
  try {
    // 点击同步状态时，触发手动同步
    const success = await storage.manualSync()
    
    if (success) {
      showSuccessToast('同步成功')
      // 同步成功后刷新列表
      setTimeout(() => {
        loadTournaments()
      }, 500)
    } else {
      if (syncError.value) {
        showFailToast(`同步失败：${syncError.value}`)
      } else {
        showFailToast('同步失败，请检查网络连接')
      }
    }
  } catch (error) {
    console.error('同步错误:', error)
    showFailToast(`同步失败：${error.message || '未知错误'}`)
  }
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${month}-${day}`
}

function formatDateTime(tournament) {
  const parts = []
  if (tournament.start_date) {
    const date = new Date(tournament.start_date)
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    parts.push(`${month}-${day}`)
  }
  if (tournament.start_time) {
    parts.push(tournament.start_time)
  }
  return parts.join(' ') || formatDate(tournament.created_at)
}

function getStatusText(status) {
  const map = {
    'draft': '草稿',
    'registration': '报名中',
    'group-stage': '小组赛',
    'knockout': '淘汰赛',
    'finished': '已完成'
  }
  return map[status] || status
}

function getStatusType(status) {
  const map = {
    'draft': 'default',
    'registration': 'primary',
    'group-stage': 'warning',
    'knockout': 'danger',
    'finished': 'success'
  }
  return map[status] || 'default'
}

function getTournamentDesc(tournament) {
  const formatMap = {
    'short-set': '短盘制',
    'best-of-3': '三盘两胜',
    'best-of-5': '五盘三胜'
  }
  const scoringMap = {
    'ad': '占先制',
    'no-ad': '金球制'
  }
  return `${formatMap[tournament.format] || tournament.format} · ${scoringMap[tournament.scoring_method] || tournament.scoring_method}`
}

async function loadTournaments() {
  if (refreshing.value) {
    tournaments.value = []
    finished.value = false
  }
  
  try {
    loading.value = true
    const response = await getTournaments()
    if (response.success) {
      // 去重：根据id去重
      const uniqueTournaments = response.data.filter((tournament, index, self) =>
        index === self.findIndex(t => t.id === tournament.id)
      )
      
      if (refreshing.value) {
        tournaments.value = uniqueTournaments
      } else {
        // 合并时也去重
        const existingIds = new Set(tournaments.value.map(t => t.id))
        const newTournaments = uniqueTournaments.filter(t => !existingIds.has(t.id))
        tournaments.value.push(...newTournaments)
      }
      finished.value = true
    } else {
      showFailToast(response.message || '加载失败')
    }
  } catch (error) {
    showFailToast('加载失败：' + error.message)
  } finally {
    loading.value = false
    refreshing.value = false
  }
}

function goToDetail(id) {
  router.push(`/tournament/${id}`)
}

async function handleClearAllData() {
  try {
    // 双重确认
    await showConfirmDialog({
      title: '确认清空',
      message: '⚠️ 确定要清空所有数据吗？\n\n此操作将删除：\n- 所有比赛\n- 所有选手\n- 所有比赛记录\n\n此操作不可恢复！',
      confirmButtonColor: '#ee0a24'
    })
    
    await showConfirmDialog({
      title: '最后确认',
      message: '⚠️ 你真的要清空所有数据吗？',
      confirmButtonColor: '#ee0a24'
    })
    
    // 创建空数据结构
    const emptyData = {
      tournaments: [],
      users: [],
      matches: [],
      lastSync: new Date().toISOString()
    }
    
    // 保存空数据（会自动同步到Gist）
    const saveResult = await storage.saveAll(emptyData)
    
    if (saveResult) {
      showSuccessToast('数据已清空')
      // 重新加载列表
      refreshing.value = true
      loadTournaments()
    } else {
      showFailToast('清空失败')
    }
  } catch (error) {
    // 用户取消
    if (error !== 'cancel') {
      console.error('清空数据错误:', error)
      showFailToast('清空失败：' + error.message)
    }
  }
}

async function handleDeleteTournament(tournament) {
  try {
    await showConfirmDialog({
      title: '确认删除',
      message: `确定要删除比赛"${tournament.name}"吗？此操作不可恢复。`,
      confirmButtonColor: '#ee0a24'
    })
    
    // 用户确认删除
    const response = await deleteTournament(tournament.id)
    
    if (response.success) {
      showSuccessToast('删除成功')
      // 重新加载列表
      refreshing.value = true
      loadTournaments()
    } else {
      showFailToast(response.message || '删除失败')
    }
  } catch (error) {
    // 用户取消删除
    if (error !== 'cancel') {
      console.error('删除比赛错误:', error)
      showFailToast('删除失败：' + error.message)
    }
  }
}

async function handleCreateSuccess(tournamentId) {
  showCreateModal.value = false
  
  if (tournamentId) {
    // 等待数据同步完成后再跳转
    showSuccessToast('创建成功，正在跳转...')
    
    // 等待一下确保数据已保存
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // 验证比赛是否存在
    try {
      const { getTournament } = await import('../api/tournaments')
      const response = await getTournament(tournamentId)
      
      if (response.success && response.data) {
        // 比赛存在，跳转到详情页
        router.push(`/tournament/${tournamentId}`)
      } else {
        // 比赛不存在，刷新列表让用户手动点击
        showFailToast('比赛创建成功，但数据同步中，请稍后刷新列表查看')
        setTimeout(() => {
          refreshing.value = true
          loadTournaments()
        }, 500)
      }
    } catch (error) {
      console.error('验证比赛失败:', error)
      // 即使验证失败也尝试跳转
      router.push(`/tournament/${tournamentId}`)
    }
  } else {
    // 如果没有ID，刷新列表
    setTimeout(() => {
      refreshing.value = true
      loadTournaments()
    }, 100)
  }
}

onMounted(() => {
  loadTournaments()
  
  // 监听同步状态变化
  syncStatusUnsubscribe = syncStatus.onStateChange((state, time, error) => {
    syncState.value = state
    syncTime.value = time
    syncError.value = error
  })
  
  // 监听数据更新事件（Firebase实时同步）
  let refreshTimer = null
  window.addEventListener('data-updated', (event) => {
    if (refreshTimer) {
      clearTimeout(refreshTimer)
    }
    refreshTimer = setTimeout(() => {
      console.log('📥 收到数据更新事件，重新加载比赛列表')
      loadTournaments()
    }, 500)
  })
})

onUnmounted(() => {
  if (syncStatusUnsubscribe) {
    syncStatusUnsubscribe()
  }
})
</script>

<style scoped>
.tournaments {
  min-height: 100vh;
  background: #f8fafc;
  padding-top: 46px;
}

.content {
  padding: 16px;
}

.tournament-card {
  background: white;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  transition: all 0.3s ease;
  cursor: pointer;
  position: relative;
}

.tournament-card:active {
  transform: scale(0.98);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
  padding-right: 30px;
}

.card-actions {
  position: absolute;
  top: 16px;
  right: 16px;
  z-index: 10;
}

.delete-icon {
  cursor: pointer;
  padding: 4px;
  transition: transform 0.2s;
}

.delete-icon:active {
  transform: scale(0.9);
}

.card-title {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
}

.tournament-number {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  color: white;
  border-radius: 6px;
  font-size: 12px;
  font-weight: bold;
  flex-shrink: 0;
}

.tournament-name {
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
  line-height: 1.4;
}

.card-desc {
  font-size: 13px;
  color: #64748b;
  margin-bottom: 12px;
  padding-left: 32px;
}

.card-footer {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  padding-top: 12px;
  border-top: 1px solid #f1f5f9;
}

.footer-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #64748b;
}

.footer-item .van-icon {
  color: #94a3b8;
}

.fab-button {
  position: fixed;
  right: 20px;
  bottom: 80px; /* 在底部导航上方 */
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  cursor: pointer;
  z-index: 100;
  transition: all 0.3s ease;
}

.fab-button:active {
  transform: scale(0.95);
  box-shadow: 0 2px 8px rgba(99, 102, 241, 0.3);
}

.fab-button:hover {
  box-shadow: 0 6px 16px rgba(99, 102, 241, 0.5);
  transform: translateY(-2px);
}

.nav-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.sync-status {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 12px;
}

.sync-status:hover {
  background: rgba(0, 0, 0, 0.05);
}

.clear-data-btn {
  padding: 4px;
  cursor: pointer;
  transition: transform 0.2s;
}

.clear-data-btn:active {
  transform: scale(0.9);
}

.sync-status.sync-syncing {
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.6;
  }
}

.sync-status.sync-success {
  background: rgba(16, 185, 129, 0.1);
}

.sync-status.sync-error {
  background: rgba(239, 68, 68, 0.1);
}

.sync-text {
  font-size: 11px;
  white-space: nowrap;
}
</style>

