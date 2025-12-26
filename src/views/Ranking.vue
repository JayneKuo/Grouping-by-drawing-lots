<template>
  <div class="ranking">
    <van-nav-bar title="小组排名" fixed />
    
    <div class="content">
      <van-empty v-if="tournaments.length === 0" description="暂无比赛数据" />
      
      <van-cell-group 
        v-for="tournament in tournaments" 
        :key="tournament.id" 
        inset
        style="margin-bottom: 16px;"
      >
        <van-cell 
          :title="tournament.name" 
          :value="getStatusText(tournament.status)"
          is-link
          @click="goToRankingDetail(tournament.id)"
        />
        
        <!-- 展示前几名（有分组每组前2名，无分组前4名） -->
        <!-- 只有比赛已开始（有进行中或已结束的比赛）才显示排名 -->
        <div v-if="hasStartedMatches(tournament.id) && rankings[tournament.id] && Object.keys(rankings[tournament.id]).length > 0" style="margin-top: 8px;">
          <van-cell
            v-for="player in getTopPlayers(tournament.id)"
            :key="`${tournament.id}-${player.id}`"
            :title="getPlayerDisplayName(player, tournament.id)"
            :value="`${player.points || 0}分`"
          >
            <template #icon>
              <van-icon 
                v-if="player.rank <= 2" 
                name="medal" 
                :color="player.rank === 1 ? '#ffd700' : '#c0c0c0'"
              />
            </template>
            <template #label>
              <div style="font-size: 12px; color: #64748b;">
                胜{{ player.wins || 0 }}负{{ player.losses || 0 }}
                <span v-if="player.gamesDifference !== undefined && player.gamesDifference !== 0">
                  · 局数差: {{ player.gamesDifference > 0 ? '+' : '' }}{{ player.gamesDifference }}
                </span>
              </div>
            </template>
          </van-cell>
        </div>
        
        <van-empty v-else-if="!hasStartedMatches(tournament.id)" description="比赛尚未开始" style="margin-top: 8px;" />
        <van-empty v-else description="暂无排名数据" style="margin-top: 8px;" />
      </van-cell-group>
    </div>
    
    <!-- 排名详情弹窗 -->
    <van-popup 
      v-model:show="showRankingDetail" 
      position="bottom" 
      :style="{ height: '90%' }"
    >
      <GroupRanking 
        v-if="selectedTournament"
        :players="selectedTournament.players || []"
        :matches="selectedTournament.matches || []"
        :tournament-id="selectedTournament.id"
        @cancel="showRankingDetail = false"
      />
    </van-popup>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { storage } from '../utils/storage'
import { getAllGroupRankings, getQualifiedPlayers } from '../utils/ranking'
import GroupRanking from '../components/GroupRanking.vue'

const router = useRouter()
const tournaments = ref([])
const rankings = ref({})
const qualifiedPlayers = ref({})
const showRankingDetail = ref(false)
const selectedTournament = ref(null)

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

function getRankLabel(rank) {
  const parts = []
  parts.push(`胜${rank.wins}负${rank.losses}`)
  if (rank.gamesDifference !== 0) {
    parts.push(`局数差: ${rank.gamesDifference > 0 ? '+' : ''}${rank.gamesDifference}`)
  }
  return parts.join(' | ')
}

function getTopPlayers(tournamentId) {
  const tournamentRankings = rankings.value[tournamentId]
  if (!tournamentRankings || Object.keys(tournamentRankings).length === 0) return []
  
  // 检查是否有分组：查看tournament的players是否有group属性
  const tournament = tournaments.value.find(t => t.id === tournamentId)
  const hasGroups = tournament && tournament.players && tournament.players.some(p => p.group) && 
                    new Set(tournament.players.map(p => p.group).filter(g => g)).size > 1
  
  if (hasGroups) {
    // 有分组：每组前2名
    const topPlayers = []
    Object.keys(tournamentRankings).forEach(groupName => {
      const groupRanking = tournamentRankings[groupName]
      const top2 = groupRanking.filter(rank => rank.rank <= 2)
      topPlayers.push(...top2.map(rank => ({
        ...rank.player,
        rank: rank.rank,
        points: rank.points,
        group: groupName,
        wins: rank.wins,
        losses: rank.losses,
        gamesDifference: rank.gamesDifference
      })))
    })
    return topPlayers.sort((a, b) => {
      // 先按组排序，再按排名排序
      if (a.group !== b.group) {
        return a.group.localeCompare(b.group)
      }
      return a.rank - b.rank
    })
  } else {
    // 无分组：前4名
    // 合并所有选手的排名
    const allPlayers = []
    Object.values(tournamentRankings).forEach(groupRanking => {
      allPlayers.push(...groupRanking.map(rank => ({
        ...rank.player,
        rank: rank.rank,
        points: rank.points,
        wins: rank.wins,
        losses: rank.losses,
        gamesDifference: rank.gamesDifference
      })))
    })
    
    // 按积分、胜负关系等排序
    allPlayers.sort((a, b) => {
      if (b.points !== a.points) {
        return b.points - a.points
      }
      // 如果积分相同，按胜负关系、局数差等排序（简化处理）
      return b.gamesDifference - a.gamesDifference
    })
    
    // 重新分配排名
    allPlayers.forEach((player, index) => {
      player.rank = index + 1
    })
    
    return allPlayers.filter(p => p.rank <= 4)
  }
}

function getPlayerDisplayName(player, tournamentId) {
  if (player.group) {
    return `${player.group}组第${player.rank}名: ${player.name}`
  }
  return `第${player.rank}名: ${player.name}`
}

function hasStartedMatches(tournamentId) {
  const tournament = tournaments.value.find(t => t.id === tournamentId)
  if (!tournament || !tournament.matches) return false
  
  // 检查是否有进行中或已结束的比赛
  return tournament.matches.some(m => m.status === 'in-progress' || m.status === 'finished')
}

function goToRankingDetail(tournamentId) {
  const tournament = tournaments.value.find(t => t.id === tournamentId)
  if (tournament) {
    selectedTournament.value = tournament
    showRankingDetail.value = true
  }
}

async function loadRankings() {
  try {
    const tournamentList = await storage.getTournaments()
    tournaments.value = tournamentList.filter(t => 
      t.players && t.players.length > 0 && t.matches && t.matches.length > 0
    )
    
    // 计算每个比赛的排名
    const allRankings = {}
    const allQualified = {}
    
    tournaments.value.forEach(tournament => {
      if (tournament.players && tournament.players.length > 0) {
        const tournamentRankings = getAllGroupRankings(tournament.players, tournament.matches || [])
        allRankings[tournament.id] = tournamentRankings
        
        // 获取出线选手
        allQualified[tournament.id] = getQualifiedPlayers(tournamentRankings)
      }
    })
    
    rankings.value = allRankings
    qualifiedPlayers.value = allQualified
  } catch (error) {
    console.error('加载排名失败:', error)
  }
}

onMounted(() => {
  loadRankings()
  
  // 监听数据更新
  let refreshTimer = null
  window.addEventListener('data-updated', () => {
    if (refreshTimer) {
      clearTimeout(refreshTimer)
    }
    refreshTimer = setTimeout(() => {
      loadRankings()
    }, 500)
  })
})
</script>

<style scoped>
.ranking {
  min-height: 100vh;
  background: #f8fafc;
  padding-top: 46px;
  padding-bottom: 50px;
}

.content {
  padding: 16px;
}

.tournament-section {
  margin-bottom: 24px;
}

.stats {
  text-align: right;
  font-size: 12px;
  color: #64748b;
}

.stats div {
  margin-bottom: 4px;
}
</style>

