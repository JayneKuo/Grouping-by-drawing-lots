<template>
  <div class="match-list">
    <van-empty v-if="matches.length === 0" description="暂无比赛" />
    
    <div 
      v-for="match in matches" 
      :key="match.id" 
      class="match-card"
      :class="`match-status-${match.status}`"
      @click="goToMatch(match)"
    >
      <!-- 横向布局：选手1 | 状态+比分 | 选手2 -->
      <div class="match-row-horizontal">
        <!-- 选手1 -->
        <div class="player-section player-left">
          <img 
            :src="getPlayerAvatar(match.player1_name, getPlayerGender(match.player1_id))" 
            :alt="match.player1_name"
            class="player-avatar"
            @error="handleAvatarError"
          />
          <div class="player-name-wrapper">
            <span class="player-name">{{ match.player1_name }}</span>
            <van-icon 
              v-if="match.status === 'finished' && match.winner === 'player1'" 
              name="star" 
              color="#3b82f6" 
              size="16" 
              class="winner-star"
            />
          </div>
        </div>
        
        <!-- 中间：状态和比分 -->
        <div class="match-center">
          <div class="match-status-text">{{ getStatusText(match.status) }}</div>
          <div class="match-score-main">{{ getTotalScore(match) }}</div>
        </div>
        
        <!-- 选手2 -->
        <div class="player-section player-right">
          <div class="player-name-wrapper">
            <span class="player-name">{{ match.player2_name }}</span>
            <van-icon 
              v-if="match.status === 'finished' && match.winner === 'player2'" 
              name="star" 
              color="#3b82f6" 
              size="16" 
              class="winner-star"
            />
          </div>
          <img 
            :src="getPlayerAvatar(match.player2_name, getPlayerGender(match.player2_id))" 
            :alt="match.player2_name"
            class="player-avatar"
            @error="handleAvatarError"
          />
        </div>
      </div>
      
      <!-- 比赛时间和地点 -->
      <div class="match-meta" v-if="getMatchDateTime(match) || getMatchLocation(match)">
        <div class="meta-item" v-if="getMatchDateTime(match)">
          <van-icon name="clock-o" size="14" />
          <span>{{ getMatchDateTime(match) }}</span>
        </div>
        <div class="meta-item" v-if="getMatchLocation(match)">
          <van-icon name="location-o" size="14" />
          <span>{{ getMatchLocation(match) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { getPlayerAvatar } from '../utils/avatar'
import { storage } from '../utils/storage'
import { ref, onMounted } from 'vue'

const props = defineProps({
  matches: {
    type: Array,
    default: () => []
  },
  tournamentId: {
    type: [String, Number],
    default: null
  }
})

const router = useRouter()
const playersCache = ref({})
const tournamentCache = ref(null)

// 加载选手信息和比赛信息（用于获取性别、时间、地点）
async function loadPlayers() {
  if (!props.tournamentId) return
  
  try {
    const tournaments = await storage.getTournaments()
    const tournament = tournaments.find(t => t.id === props.tournamentId)
    if (tournament) {
      tournamentCache.value = tournament
      if (tournament.players) {
        tournament.players.forEach(player => {
          playersCache.value[player.id] = player
        })
      }
    }
  } catch (error) {
    console.error('加载选手信息失败:', error)
  }
}

onMounted(() => {
  if (props.tournamentId) {
    loadPlayers()
  }
})

function getStatusText(status) {
  const map = {
    'pending': '未开始',
    'in-progress': '进行中',
    'finished': '结束'
  }
  return map[status] || status
}

function getPlayerGender(playerId) {
  if (!playerId) return undefined
  const player = playersCache.value[playerId]
  return player?.gender
}

function getTotalScore(match) {
  if (match.status === 'finished' && match.sets && match.sets.length > 0) {
    // 计算总盘数
    const player1Sets = match.sets.filter(s => s.winner === 'player1').length
    const player2Sets = match.sets.filter(s => s.winner === 'player2').length
    return `${player1Sets} - ${player2Sets}`
  } else if (match.status === 'in-progress' && match.currentSet) {
    // 显示当前盘比分
    const completedSets = match.sets?.length || 0
    return `${completedSets} - ${completedSets}`
  } else {
    return '- -'
  }
}

function handleAvatarError(event) {
  // 如果头像加载失败，使用默认头像
  event.target.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${event.target.alt}`
}

// 获取比赛日期时间
function getMatchDateTime(match) {
  // 优先使用比赛开始时间
  if (match.started_at) {
    const date = new Date(match.started_at)
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    return `${month}-${day} ${hours}:${minutes}`
  }
  
  // 其次使用比赛创建时间
  if (match.created_at) {
    const date = new Date(match.created_at)
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    return `${month}-${day} ${hours}:${minutes}`
  }
  
  // 最后使用比赛的时间和日期
  if (tournamentCache.value) {
    const tournament = tournamentCache.value
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
    if (parts.length > 0) {
      return parts.join(' ')
    }
  }
  
  return null
}

// 获取比赛地点
function getMatchLocation(match) {
  if (tournamentCache.value && tournamentCache.value.location) {
    return tournamentCache.value.location
  }
  return null
}

function goToMatch(match) {
  // 确保传递tournament_id，避免不同tournament中match ID重复的问题
  const tournamentId = match.tournament_id || props.tournamentId
  if (tournamentId) {
    router.push(`/match/${match.id}?tournament=${tournamentId}`)
  } else {
    router.push(`/match/${match.id}`)
  }
}
</script>

<style scoped>
.match-list {
  padding: 16px;
}

.match-card {
  background: white;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: all 0.2s ease;
  cursor: pointer;
  position: relative;
}

.match-card:active {
  transform: scale(0.98);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
}

.match-row-horizontal {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.player-section {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
}

.player-left {
  justify-content: flex-start;
}

.player-right {
  justify-content: flex-end;
  flex-direction: row-reverse;
}

.player-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #e2e8f0;
  flex-shrink: 0;
}

.player-name-wrapper {
  display: flex;
  align-items: center;
  gap: 4px;
  min-width: 0;
}

.player-name {
  font-size: 14px;
  color: #1e293b;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.winner-star {
  flex-shrink: 0;
}

.match-center {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  min-width: 80px;
  flex-shrink: 0;
}

.match-status-text {
  font-size: 12px;
  color: #64748b;
  padding: 2px 8px;
  background: #f1f5f9;
  border-radius: 12px;
}

.match-score-main {
  font-size: 18px;
  font-weight: 700;
  color: #1e293b;
  letter-spacing: 2px;
}

.match-status-pending .match-status-text {
  background: #f1f5f9;
  color: #94a3b8;
}

.match-status-in-progress .match-status-text {
  background: #fef3c7;
  color: #f59e0b;
}

.match-status-finished .match-status-text {
  background: #d1fae5;
  color: #10b981;
}

.match-meta {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #e2e8f0;
  font-size: 12px;
  color: #64748b;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.meta-item .van-icon {
  color: #94a3b8;
}
</style>

