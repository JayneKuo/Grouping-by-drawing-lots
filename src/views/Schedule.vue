<template>
  <div class="schedule">
    <van-nav-bar title="比赛赛程" fixed />
    
    <div class="content">
      <van-tabs v-model:active="activeTab">
        <van-tab title="全部" name="all">
          <div v-for="tournament in tournaments" :key="tournament.id" class="tournament-section">
            <van-cell-group inset>
              <van-cell :title="tournament.name" :value="getStatusText(tournament.status)" />
            </van-cell-group>
            
            <div v-if="getTournamentMatches(tournament.id, 'all').length > 0" style="margin-top: 12px;">
              <van-tabs v-model:active="tournamentTabs[tournament.id]" type="card">
                <van-tab 
                  v-for="group in getTournamentGroups(tournament.id)" 
                  :key="group"
                  :title="`${group}组`"
                  :name="group"
                >
                  <MatchList :matches="getTournamentMatchesByGroup(tournament.id, group, 'all')" :tournament-id="tournament.id" />
                </van-tab>
                <van-tab v-if="getUngroupedMatches(tournament.id, 'all').length > 0" title="未分组" name="ungrouped">
                  <MatchList :matches="getUngroupedMatches(tournament.id, 'all')" :tournament-id="tournament.id" />
                </van-tab>
              </van-tabs>
            </div>
            <van-empty v-else description="暂无赛程" style="margin-top: 12px;" />
          </div>
        </van-tab>
        <van-tab title="未开始" name="pending">
          <div v-for="tournament in tournaments" :key="tournament.id" class="tournament-section">
            <van-cell-group inset>
              <van-cell :title="tournament.name" :value="getStatusText(tournament.status)" />
            </van-cell-group>
            
            <div v-if="getTournamentMatches(tournament.id, 'pending').length > 0" style="margin-top: 12px;">
              <van-tabs v-model:active="tournamentTabs[tournament.id]" type="card">
                <van-tab 
                  v-for="group in getTournamentGroups(tournament.id)" 
                  :key="group"
                  :title="`${group}组`"
                  :name="group"
                >
                  <MatchList :matches="getTournamentMatchesByGroup(tournament.id, group, 'pending')" :tournament-id="tournament.id" />
                </van-tab>
                <van-tab v-if="getUngroupedMatches(tournament.id, 'pending').length > 0" title="未分组" name="ungrouped">
                  <MatchList :matches="getUngroupedMatches(tournament.id, 'pending')" :tournament-id="tournament.id" />
                </van-tab>
              </van-tabs>
            </div>
            <van-empty v-else description="暂无未开始比赛" style="margin-top: 12px;" />
          </div>
        </van-tab>
        <van-tab title="进行中" name="in-progress">
          <div v-for="tournament in tournaments" :key="tournament.id" class="tournament-section">
            <van-cell-group inset>
              <van-cell :title="tournament.name" :value="getStatusText(tournament.status)" />
            </van-cell-group>
            
            <div v-if="getTournamentMatches(tournament.id, 'in-progress').length > 0" style="margin-top: 12px;">
              <van-tabs v-model:active="tournamentTabs[tournament.id]" type="card">
                <van-tab 
                  v-for="group in getTournamentGroups(tournament.id)" 
                  :key="group"
                  :title="`${group}组`"
                  :name="group"
                >
                  <MatchList :matches="getTournamentMatchesByGroup(tournament.id, group, 'in-progress')" :tournament-id="tournament.id" />
                </van-tab>
                <van-tab v-if="getUngroupedMatches(tournament.id, 'in-progress').length > 0" title="未分组" name="ungrouped">
                  <MatchList :matches="getUngroupedMatches(tournament.id, 'in-progress')" :tournament-id="tournament.id" />
                </van-tab>
              </van-tabs>
            </div>
            <van-empty v-else description="暂无进行中比赛" style="margin-top: 12px;" />
          </div>
        </van-tab>
        <van-tab title="已结束" name="finished">
          <div v-for="tournament in tournaments" :key="tournament.id" class="tournament-section">
            <van-cell-group inset>
              <van-cell :title="tournament.name" :value="getStatusText(tournament.status)" />
            </van-cell-group>
            
            <div v-if="getTournamentMatches(tournament.id, 'finished').length > 0" style="margin-top: 12px;">
              <van-tabs v-model:active="tournamentTabs[tournament.id]" type="card">
                <van-tab 
                  v-for="group in getTournamentGroups(tournament.id)" 
                  :key="group"
                  :title="`${group}组`"
                  :name="group"
                >
                  <MatchList :matches="getTournamentMatchesByGroup(tournament.id, group, 'finished')" :tournament-id="tournament.id" />
                </van-tab>
                <van-tab v-if="getUngroupedMatches(tournament.id, 'finished').length > 0" title="未分组" name="ungrouped">
                  <MatchList :matches="getUngroupedMatches(tournament.id, 'finished')" :tournament-id="tournament.id" />
                </van-tab>
              </van-tabs>
            </div>
            <van-empty v-else description="暂无已结束比赛" style="margin-top: 12px;" />
          </div>
        </van-tab>
      </van-tabs>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { storage } from '../utils/storage'
import MatchList from '../components/MatchList.vue'

const activeTab = ref('all')
const tournaments = ref([])
const tournamentTabs = ref({}) // 每个比赛的分组TAB状态

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

// 获取某个比赛的所有分组
function getTournamentGroups(tournamentId) {
  const tournament = tournaments.value.find(t => t.id === tournamentId)
  if (!tournament || !tournament.matches) return []
  
  const groups = new Set()
  tournament.matches.forEach(match => {
    if (match.group) {
      groups.add(match.group)
    }
  })
  return Array.from(groups).sort()
}

// 获取某个比赛的指定状态的比赛
function getTournamentMatches(tournamentId, status) {
  const tournament = tournaments.value.find(t => t.id === tournamentId)
  if (!tournament || !tournament.matches) return []
  
  let matches = tournament.matches.map(m => ({
    ...m,
    tournament_name: tournament.name,
    tournament_id: tournament.id
  }))
  
  if (status !== 'all') {
    matches = matches.filter(m => m.status === status)
  }
  
  // 按轮次（round）和创建时间排序，确保比赛顺序合理
  matches.sort((a, b) => {
    // 先按轮次排序
    const roundA = typeof a.round === 'number' ? a.round : (a.round === 'group' ? 0 : 999)
    const roundB = typeof b.round === 'number' ? b.round : (b.round === 'group' ? 0 : 999)
    if (roundA !== roundB) {
      return roundA - roundB
    }
    // 相同轮次按创建时间排序
    const timeA = new Date(a.created_at || 0).getTime()
    const timeB = new Date(b.created_at || 0).getTime()
    return timeA - timeB
  })
  
  return matches
}

// 获取某个比赛的指定分组和状态的比赛
function getTournamentMatchesByGroup(tournamentId, group, status) {
  const matches = getTournamentMatches(tournamentId, status)
  return matches.filter(m => m.group === group)
}

// 获取未分组的比赛
function getUngroupedMatches(tournamentId, status) {
  const matches = getTournamentMatches(tournamentId, status)
  return matches.filter(m => !m.group)
}

async function loadSchedule() {
  try {
    const tournamentListResult = await storage.getTournaments()
    // 处理返回的数据格式：可能是对象 { data: [...] } 或数组
    const tournamentList = tournamentListResult.data || (Array.isArray(tournamentListResult) ? tournamentListResult : [])
    // 只显示有比赛数据的比赛
    tournaments.value = tournamentList.filter(t => t.matches && t.matches.length > 0)
    
    // 初始化每个比赛的分组TAB状态
    tournaments.value.forEach(tournament => {
      if (!tournamentTabs.value[tournament.id]) {
        const groups = getTournamentGroups(tournament.id)
        tournamentTabs.value[tournament.id] = groups.length > 0 ? groups[0] : 'ungrouped'
      }
    })
  } catch (error) {
    console.error('加载赛程失败:', error)
  }
}

onMounted(() => {
  loadSchedule()
  
  // 监听数据更新
  let refreshTimer = null
  window.addEventListener('data-updated', () => {
    if (refreshTimer) {
      clearTimeout(refreshTimer)
    }
    refreshTimer = setTimeout(() => {
      loadSchedule()
    }, 500)
  })
})
</script>

<style scoped>
.schedule {
  min-height: 100vh;
  background: #f8fafc;
  padding-top: 46px;
  padding-bottom: 50px;
}

.content {
  height: calc(100vh - 96px);
  overflow-y: auto;
}

.tournament-section {
  margin-bottom: 24px;
}
</style>

