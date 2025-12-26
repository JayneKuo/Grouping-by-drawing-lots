<template>
  <div class="group-ranking">
    <van-nav-bar title="小组排名" left-arrow @click-left="$emit('cancel')" />
    
    <div class="content">
      <van-tabs v-model:active="activeGroup" v-if="rankings && Object.keys(rankings).length > 0">
        <van-tab 
          v-for="(groupRanking, groupName) in rankings" 
          :key="groupName"
          :title="`${groupName}组`"
          :name="groupName"
        >
          <van-cell-group inset>
            <van-cell 
              v-for="(rank, index) in groupRanking"
              :key="rank.player.id"
              :title="`${rank.rank}. ${rank.player.name}`"
              :label="getRankLabel(rank)"
              :value="`${rank.points}分`"
            >
              <template #icon>
                <van-icon 
                  v-if="rank.rank <= 2" 
                  name="medal" 
                  :color="rank.rank === 1 ? '#ffd700' : '#c0c0c0'"
                />
              </template>
            </van-cell>
          </van-cell-group>
          
          <div class="stats-detail" style="margin-top: 16px;">
            <van-cell-group inset>
              <van-cell 
                v-for="(rank, index) in groupRanking"
                :key="rank.player.id"
                :title="rank.player.name"
              >
                <template #value>
                  <div class="stats">
                    <div>胜: {{ rank.wins }} 负: {{ rank.losses }}</div>
                    <div>局数差: {{ rank.gamesDifference > 0 ? '+' : '' }}{{ rank.gamesDifference }}</div>
                    <div>ACE: {{ rank.aces }}</div>
                  </div>
                </template>
              </van-cell>
            </van-cell-group>
          </div>
        </van-tab>
      </van-tabs>
      
      <van-empty v-else description="暂无排名数据" />
      
      <!-- 出线名单（只有比赛已开始才显示） -->
      <div v-if="hasStartedMatches && qualifiedPlayers && qualifiedPlayers.length > 0" class="qualified-section" style="margin-top: 24px;">
        <van-cell-group inset>
          <van-cell title="出线名单" />
          <van-cell
            v-for="player in qualifiedPlayers"
            :key="player.id"
            :title="`${player.group}组第${player.rank}名: ${player.name}`"
            :value="`${player.points || 0}分`"
          />
        </van-cell-group>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { getAllGroupRankings, getQualifiedPlayers } from '../utils/ranking'

const props = defineProps({
  players: {
    type: Array,
    default: () => []
  },
  matches: {
    type: Array,
    default: () => []
  },
  tournamentId: {
    type: Number,
    required: true
  }
})

const emit = defineEmits(['cancel'])

const rankings = ref({})
const activeGroup = ref('A')
const qualifiedPlayers = ref([])

// 检查是否有已开始的比赛
const hasStartedMatches = computed(() => {
  if (!props.matches || props.matches.length === 0) return false
  return props.matches.some(m => m.status === 'in-progress' || m.status === 'finished')
})

function getRankLabel(rank) {
  const parts = []
  parts.push(`胜${rank.wins}负${rank.losses}`)
  if (rank.gamesDifference !== 0) {
    parts.push(`局数差: ${rank.gamesDifference > 0 ? '+' : ''}${rank.gamesDifference}`)
  }
  return parts.join(' | ')
}

function calculateRankings() {
  if (!props.players || props.players.length === 0) {
    rankings.value = {}
    qualifiedPlayers.value = []
    return
  }
  
  // 计算所有组排名
  const allRankings = getAllGroupRankings(props.players, props.matches || [])
  
  // 对组名进行排序：A组在前，B组在后，然后C、D等
  const sortedGroupNames = Object.keys(allRankings).sort((a, b) => {
    // 如果都是单字母（A, B, C等），按字母顺序排序
    if (a.length === 1 && b.length === 1) {
      return a.localeCompare(b)
    }
    // 否则按字符串比较
    return a.localeCompare(b)
  })
  
  // 重新构建排序后的rankings对象
  rankings.value = {}
  sortedGroupNames.forEach(groupName => {
    rankings.value[groupName] = allRankings[groupName]
  })
  
  // 获取出线选手
  qualifiedPlayers.value = getQualifiedPlayers(rankings.value)
  
  // 设置默认激活的组（A组）
  if (sortedGroupNames.length > 0) {
    activeGroup.value = sortedGroupNames[0]
  }
}

onMounted(() => {
  calculateRankings()
})

// 监听数据变化
watch(() => [props.players, props.matches], () => {
  calculateRankings()
}, { deep: true })
</script>

<style scoped>
.group-ranking {
  min-height: 100vh;
  background: #f8fafc;
  padding-top: 46px;
  padding-bottom: 50px;
}

.content {
  padding: 16px;
}

.stats {
  text-align: right;
  font-size: 12px;
  color: #64748b;
}

.stats div {
  margin-top: 4px;
}

.qualified-section {
  margin-top: 24px;
}
</style>

