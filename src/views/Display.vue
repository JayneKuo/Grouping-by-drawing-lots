<template>
  <div class="display" :class="{ 'fullscreen': isFullscreen }">
    <!-- 顶部：赛事信息 -->
    <div class="header">
      <div class="tournament-name">{{ tournamentName || '球搭子网球赛事管理系统' }}</div>
      <div class="match-info" v-if="currentMatch">
        <div class="players">
          <div class="player player1">
            <div class="player-name">{{ currentMatch.player1_name }}</div>
            <div class="player-score">{{ getPlayer1Score() }}</div>
          </div>
          <div class="vs">VS</div>
          <div class="player player2">
            <div class="player-name">{{ currentMatch.player2_name }}</div>
            <div class="player-score">{{ getPlayer2Score() }}</div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 核心区域：实时比分 -->
    <div class="score-area" v-if="currentMatch">
      <div class="current-set-score">
        <div class="set-label">当前盘</div>
        <div class="set-numbers">
          <div class="set-number">{{ currentSet?.player1Games || 0 }}</div>
          <div class="set-separator">-</div>
          <div class="set-number">{{ currentSet?.player2Games || 0 }}</div>
        </div>
      </div>
      
      <!-- 抢七显示 -->
      <div v-if="currentSet?.isTiebreak" class="tiebreak-score">
        <div class="tiebreak-label">抢七</div>
        <div class="tiebreak-numbers">
          <div class="tiebreak-number">{{ currentSet.tiebreakScore.player1 }}</div>
          <div class="tiebreak-separator">-</div>
          <div class="tiebreak-number">{{ currentSet.tiebreakScore.player2 }}</div>
        </div>
      </div>
      
      <!-- 当前局分 -->
      <div v-else class="game-score">
        <div class="game-label">当前局</div>
        <div class="game-numbers">
          <div class="game-number">{{ getGamePoint(currentSet?.player1Points || 0) }}</div>
          <div class="game-separator">-</div>
          <div class="game-number">{{ getGamePoint(currentSet?.player2Points || 0) }}</div>
        </div>
        <div v-if="isDeuce()" class="deuce-indicator">平分</div>
        <div v-else-if="isAdvantage()" class="advantage-indicator">
          {{ getAdvantagePlayer() }} 占先
        </div>
      </div>
      
      <!-- 已完成盘 -->
      <div v-if="completedSets && completedSets.length > 0" class="completed-sets">
        <div class="completed-label">已完成盘</div>
        <div class="sets-list">
          <div 
            v-for="(set, index) in completedSets" 
            :key="index"
            class="set-item"
          >
            <div class="set-number-small">{{ index + 1 }}</div>
            <div class="set-score-small">
              {{ set.player1Games }}-{{ set.player2Games }}
              <span v-if="set.isTiebreak" class="tiebreak-mark">(抢七)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 侧边：统计数据 -->
    <div class="stats-area" v-if="currentMatch">
      <div class="stats-section">
        <div class="stats-title">选手统计</div>
        <div class="stats-grid">
          <div class="stat-item">
            <div class="stat-label">ACE</div>
            <div class="stat-value">{{ currentMatch.player1_aces || 0 }}</div>
            <div class="stat-value">{{ currentMatch.player2_aces || 0 }}</div>
          </div>
          <div class="stat-item">
            <div class="stat-label">失误</div>
            <div class="stat-value">{{ currentMatch.player1_faults || 0 }}</div>
            <div class="stat-value">{{ currentMatch.player2_faults || 0 }}</div>
          </div>
          <div class="stat-item">
            <div class="stat-label">胜局</div>
            <div class="stat-value">{{ getPlayer1Games() }}</div>
            <div class="stat-value">{{ getPlayer2Games() }}</div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 底部：场次切换（可选） -->
    <div class="footer" v-if="matches && matches.length > 1">
      <div class="match-selector">
        <van-button 
          v-for="m in matches" 
          :key="m.id"
          :type="currentMatch?.id === m.id ? 'primary' : 'default'"
          size="small"
          @click="switchMatch(m.id)"
        >
          {{ m.player1_name }} VS {{ m.player2_name }}
        </van-button>
      </div>
    </div>
    
    <!-- 空状态 -->
    <div v-else class="empty-state">
      <div class="empty-icon">🎾</div>
      <div class="empty-text">暂无比赛进行中</div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { storage } from '../utils/storage'

const route = useRoute()
const tournamentName = ref('')
const currentMatch = ref(null)
const matches = ref([])
const isFullscreen = ref(false)
let refreshInterval = null

const currentSet = computed(() => {
  return currentMatch.value?.currentSet
})

const completedSets = computed(() => {
  return currentMatch.value?.sets || []
})

function getPlayer1Score() {
  if (!currentMatch.value || !currentMatch.value.sets) return '0'
  const wonSets = currentMatch.value.sets.filter(s => s.winner === 'player1').length
  return `${wonSets}盘`
}

function getPlayer2Score() {
  if (!currentMatch.value || !currentMatch.value.sets) return '0'
  const wonSets = currentMatch.value.sets.filter(s => s.winner === 'player2').length
  return `${wonSets}盘`
}

function getPlayer1Games() {
  if (!currentMatch.value) return 0
  let total = 0
  currentMatch.value.sets?.forEach(set => {
    total += set.player1Games || 0
  })
  if (currentSet.value) {
    total += currentSet.value.player1Games || 0
  }
  return total
}

function getPlayer2Games() {
  if (!currentMatch.value) return 0
  let total = 0
  currentMatch.value.sets?.forEach(set => {
    total += set.player2Games || 0
  })
  if (currentSet.value) {
    total += currentSet.value.player2Games || 0
  }
  return total
}

function getGamePoint(points) {
  const map = { 0: '0', 1: '15', 2: '30', 3: '40', 4: 'AD' }
  return map[points] || points
}

function isDeuce() {
  if (!currentSet.value) return false
  return currentSet.value.player1Points === 3 && currentSet.value.player2Points === 3
}

function isAdvantage() {
  if (!currentSet.value) return false
  return (currentSet.value.player1Points === 4 || currentSet.value.player2Points === 4) && 
         currentSet.value.player1Points !== currentSet.value.player2Points
}

function getAdvantagePlayer() {
  if (!currentSet.value) return ''
  if (currentSet.value.player1Points > currentSet.value.player2Points) {
    return currentMatch.value?.player1_name || '选手1'
  }
  return currentMatch.value?.player2_name || '选手2'
}

function switchMatch(matchId) {
  const match = matches.value.find(m => m.id === matchId)
  if (match) {
    currentMatch.value = match
  }
}

function enterFullscreen() {
  const elem = document.documentElement
  if (elem.requestFullscreen) {
    elem.requestFullscreen()
    isFullscreen.value = true
  }
}

async function loadData() {
  try {
    // 从URL参数获取tournamentId和matchId
    const tournamentId = route.query.tournamentId
    const matchId = route.query.matchId
    
    if (!tournamentId) {
      // 如果没有指定，加载第一个进行中的比赛
      const tournaments = await storage.getTournaments()
      for (const tournament of tournaments) {
        if (tournament.matches && tournament.matches.length > 0) {
          tournamentName.value = tournament.name
          matches.value = tournament.matches.filter(m => m.status === 'in-progress' || m.status === 'pending')
          if (matches.value.length > 0) {
            currentMatch.value = matches.value[0]
            return
          }
        }
      }
      return
    }
    
    // 加载指定比赛
    const tournament = await storage.getTournament(parseInt(tournamentId))
    if (tournament) {
      tournamentName.value = tournament.name
      matches.value = tournament.matches || []
      
      if (matchId) {
        currentMatch.value = matches.value.find(m => m.id === parseInt(matchId))
      } else if (matches.value.length > 0) {
        currentMatch.value = matches.value[0]
      }
    }
  } catch (error) {
    console.error('加载数据失败:', error)
  }
}

// 实时刷新数据
function startRefresh() {
  refreshInterval = setInterval(() => {
    loadData()
  }, 1000) // 每秒刷新一次
}

function stopRefresh() {
  if (refreshInterval) {
    clearInterval(refreshInterval)
    refreshInterval = null
  }
}

onMounted(() => {
  loadData()
  startRefresh()
  
  // 监听Firebase数据更新
  if (storage.useFirebase) {
    window.addEventListener('data-updated', loadData)
  }
  
  // 双击进入全屏
  document.addEventListener('dblclick', enterFullscreen)
})

onUnmounted(() => {
  stopRefresh()
  window.removeEventListener('data-updated', loadData)
  document.removeEventListener('dblclick', enterFullscreen)
})
</script>

<style scoped>
.display {
  min-height: 100vh;
  background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
  color: white;
  display: flex;
  flex-direction: column;
  padding: 20px;
}

.display.fullscreen {
  padding: 40px;
}

.header {
  text-align: center;
  margin-bottom: 40px;
}

.tournament-name {
  font-size: 32px;
  font-weight: bold;
  margin-bottom: 20px;
}

.match-info {
  margin-top: 20px;
}

.players {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 40px;
}

.player {
  text-align: center;
}

.player-name {
  font-size: 28px;
  font-weight: 600;
  margin-bottom: 10px;
}

.player-score {
  font-size: 48px;
  font-weight: bold;
}

.vs {
  font-size: 24px;
  opacity: 0.8;
}

.score-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 40px;
}

.current-set-score {
  text-align: center;
}

.set-label {
  font-size: 24px;
  margin-bottom: 20px;
  opacity: 0.9;
}

.set-numbers {
  display: flex;
  align-items: center;
  gap: 40px;
  font-size: 120px;
  font-weight: bold;
}

.set-number {
  min-width: 150px;
  text-align: center;
}

.set-separator {
  font-size: 80px;
  opacity: 0.6;
}

.tiebreak-score {
  text-align: center;
  margin-top: 20px;
}

.tiebreak-label {
  font-size: 20px;
  margin-bottom: 10px;
  opacity: 0.9;
}

.tiebreak-numbers {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
  font-size: 64px;
  font-weight: bold;
}

.tiebreak-number {
  min-width: 80px;
  text-align: center;
}

.tiebreak-separator {
  font-size: 48px;
  opacity: 0.6;
}

.game-score {
  text-align: center;
  margin-top: 20px;
}

.game-label {
  font-size: 20px;
  margin-bottom: 10px;
  opacity: 0.9;
}

.game-numbers {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
  font-size: 48px;
  font-weight: bold;
}

.game-number {
  min-width: 80px;
  text-align: center;
}

.game-separator {
  font-size: 36px;
  opacity: 0.6;
}

.deuce-indicator,
.advantage-indicator {
  font-size: 24px;
  margin-top: 10px;
  font-weight: 600;
}

.completed-sets {
  margin-top: 40px;
  text-align: center;
}

.completed-label {
  font-size: 20px;
  margin-bottom: 20px;
  opacity: 0.9;
}

.sets-list {
  display: flex;
  justify-content: center;
  gap: 20px;
  flex-wrap: wrap;
}

.set-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.set-number-small {
  font-size: 16px;
  opacity: 0.8;
}

.set-score-small {
  font-size: 24px;
  font-weight: 600;
}

.tiebreak-mark {
  font-size: 14px;
  opacity: 0.7;
}

.stats-area {
  position: absolute;
  right: 40px;
  top: 50%;
  transform: translateY(-50%);
}

.stats-section {
  background: rgba(255, 255, 255, 0.1);
  padding: 20px;
  border-radius: 12px;
  backdrop-filter: blur(10px);
}

.stats-title {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 20px;
  text-align: center;
}

.stats-grid {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.stat-item {
  display: grid;
  grid-template-columns: 60px 1fr 1fr;
  gap: 12px;
  align-items: center;
}

.stat-label {
  font-size: 16px;
  opacity: 0.9;
}

.stat-value {
  font-size: 24px;
  font-weight: 600;
  text-align: center;
}

.footer {
  margin-top: auto;
  padding-top: 20px;
}

.match-selector {
  display: flex;
  justify-content: center;
  gap: 12px;
  flex-wrap: wrap;
}

.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.empty-icon {
  font-size: 120px;
  margin-bottom: 20px;
}

.empty-text {
  font-size: 32px;
  opacity: 0.8;
}

/* 响应式适配 */
@media (min-aspect-ratio: 16/9) {
  .display {
    /* 16:9 横屏 */
  }
}

@media (min-aspect-ratio: 4/3) {
  .display {
    /* 4:3 横屏 */
  }
}

@media (max-width: 768px) {
  .stats-area {
    position: static;
    transform: none;
    margin-top: 40px;
  }
  
  .set-numbers {
    font-size: 80px;
  }
  
  .tournament-name {
    font-size: 24px;
  }
  
  .player-name {
    font-size: 20px;
  }
  
  .player-score {
    font-size: 36px;
  }
}
</style>
