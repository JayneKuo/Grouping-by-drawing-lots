<template>
  <div class="draw-groups">
    <van-nav-bar title="抽签分组" left-arrow @click-left="$emit('cancel')" />
    
    <div class="content">
      <van-cell-group inset>
        <van-cell title="选手总数" :value="`${players.length}人`" />
        <van-cell title="分组数量" :value="`${groupCount}组`" />
        <van-cell title="每组人数" :value="`${Math.floor(players.length / groupCount)}-${Math.ceil(players.length / groupCount)}人`" />
      </van-cell-group>
      
      
      <div v-if="groups.length > 0" class="groups-container">
        <van-cell-group 
          v-for="(group, index) in groups" 
          :key="index"
          :title="`${group.name}组`"
          inset
          style="margin-bottom: 16px;"
        >
          <van-cell
            v-for="player in group.players"
            :key="player.id"
            :title="player.name"
            :label="getPlayerLabel(player)"
            is-link
            @click="showPlayerActions(player, index)"
          >
            <template #right-icon>
              <van-icon name="arrow-up" @click.stop="movePlayer(player, index, -1)" />
              <van-icon name="arrow-down" @click.stop="movePlayer(player, index, 1)" />
            </template>
          </van-cell>
          <van-empty v-if="group.players.length === 0" description="暂无选手" />
        </van-cell-group>
      </div>
      
      <van-empty v-else description="点击右下角抽签按钮开始分组" />
    </div>
    
    <!-- 浮动操作按钮 -->
    <div class="fab-buttons">
      <div class="fab-main" @click="handleAutoDraw">
        <van-icon name="replay" size="24" />
      </div>
      <div class="fab-label">重抽</div>
    </div>
    
    <!-- 保存按钮（吸底） -->
    <div class="save-button-fixed">
      <van-button 
        type="success" 
        size="large" 
        block 
        round 
        @click="saveDraw" 
        :loading="saving"
        :disabled="groups.length === 0"
      >
        保存分组
      </van-button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { showSuccessToast, showFailToast } from 'vant'

const props = defineProps({
  players: {
    type: Array,
    default: () => []
  },
  groupMethod: {
    type: String,
    default: '2-groups'
  },
  tournamentId: {
    type: Number,
    required: true
  }
})

const emit = defineEmits(['success', 'cancel'])

const groups = ref([])
const saving = ref(false)

const groupCount = computed(() => {
  const map = {
    '2-groups': 2,
    '4-groups': 4,
    'no-groups': 1
  }
  return map[props.groupMethod] || 2
})

// 监听分组方式变化
watch(() => props.groupMethod, () => {
  // 如果已有分组结果，重新分组
  if (groups.value.length > 0) {
    autoDraw()
  }
}, { immediate: false })

// 监听选手变化，如果有选手但没有分组，自动分组
watch(() => props.players, (newPlayers) => {
  if (newPlayers && newPlayers.length > 0 && groups.value.length === 0) {
    // 检查是否已有分组
    const hasGroup = newPlayers.some(p => p.group)
    if (!hasGroup) {
      // 如果没有分组，自动执行一次分组
      autoDraw()
    } else {
      // 如果已有分组，加载现有分组
      loadExistingGroups()
    }
  }
}, { immediate: true })

function getPlayerLabel(player) {
  const parts = []
  if (player.gender) {
    parts.push(player.gender === 'male' ? '男' : player.gender === 'female' ? '女' : '')
  }
  if (player.number) parts.push(`编号: ${player.number}`)
  return parts.join(' | ') || '选手'
}

function loadExistingGroups() {
  if (!props.players || props.players.length === 0) {
    groups.value = []
    return
  }
  
  // 按组分类选手
  const groupsMap = {}
  props.players.forEach(player => {
    const groupName = player.group || 'A'
    if (!groupsMap[groupName]) {
      groupsMap[groupName] = []
    }
    groupsMap[groupName].push(player)
  })
  
  // 转换为groups数组格式
  const groupNames = ['A', 'B', 'C', 'D']
  groups.value = []
  Object.keys(groupsMap).sort().forEach(groupName => {
    groups.value.push({
      name: groupName,
      players: groupsMap[groupName]
    })
  })
  
  // 如果groups为空，说明没有分组，执行自动分组
  if (groups.value.length === 0) {
    autoDraw()
  }
}

function autoDraw() {
  if (props.players.length === 0) {
    showFailToast('没有选手可以分组')
    return
  }
  
  // 初始化分组
  const groupNames = ['A', 'B', 'C', 'D']
  groups.value = []
  for (let i = 0; i < groupCount.value; i++) {
    groups.value.push({
      name: groupNames[i],
      players: []
    })
  }
  
  // 随机打乱选手顺序
  const shuffled = [...props.players].sort(() => Math.random() - 0.5)
  
  // 均分到各组
  shuffled.forEach((player, index) => {
    const groupIndex = index % groupCount.value
    groups.value[groupIndex].players.push({
      ...player,
      group: groups.value[groupIndex].name
    })
  })
  
  showSuccessToast('重抽完成')
}

function handleAutoDraw() {
  autoDraw()
}


function movePlayer(player, currentGroupIndex, direction) {
  const targetGroupIndex = currentGroupIndex + direction
  
  if (targetGroupIndex < 0 || targetGroupIndex >= groups.value.length) {
    return
  }
  
  // 从当前组移除
  const playerIndex = groups.value[currentGroupIndex].players.findIndex(p => p.id === player.id)
  if (playerIndex === -1) return
  
  groups.value[currentGroupIndex].players.splice(playerIndex, 1)
  
  // 添加到目标组
  groups.value[targetGroupIndex].players.push({
    ...player,
    group: groups.value[targetGroupIndex].name
  })
  
  showSuccessToast(`已将${player.name}移动到${groups.value[targetGroupIndex].name}组`)
}

function showPlayerActions(player, groupIndex) {
  // 可以添加更多操作，比如删除、编辑等
}

async function saveDraw() {
  if (groups.value.length === 0) {
    showFailToast('请先进行抽签')
    return
  }
  
  saving.value = true
  
  try {
    // 更新所有选手的分组信息并生成对阵
    const { updateTournament, getTournament } = await import('../api/tournaments')
    const { generateGroupMatches } = await import('../utils/draw')
    
    // 获取当前比赛数据
    const tournamentResponse = await getTournament(props.tournamentId)
    if (!tournamentResponse.success) {
      throw new Error(tournamentResponse.message || '获取比赛数据失败')
    }
    
    const tournament = tournamentResponse.data
    
    // 更新选手分组
    const updatedPlayers = tournament.players.map(player => {
      for (const group of groups.value) {
        const found = group.players.find(p => p.id === player.id)
        if (found) {
          return {
            ...player,
            group: group.name
          }
        }
      }
      return player
    })
    
    // 生成小组赛对阵
    const matches = generateGroupMatches(updatedPlayers)
    
    // 如果有分组，预生成半决赛和决赛占位符（选手显示为"待定"）
    if (props.groupMethod === '2-groups' || props.groupMethod === '4-groups') {
      const { generatePlaceholderKnockoutMatches } = await import('../utils/draw-placeholder')
      const placeholderMatches = generatePlaceholderKnockoutMatches(props.groupMethod, props.tournamentId)
      matches.push(...placeholderMatches)
    }
    
    // 保存更新
    const updateResponse = await updateTournament(props.tournamentId, {
      players: updatedPlayers,
      matches: matches,
      status: 'group-stage'
    })
    
    if (updateResponse.success) {
      showSuccessToast('分组保存成功，已生成比赛对阵')
      // 延迟一下再触发success事件，确保数据已保存
      setTimeout(() => {
        emit('success')
      }, 200)
    } else {
      throw new Error(updateResponse.message || '保存失败')
    }
  } catch (error) {
    showFailToast('保存失败：' + error.message)
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.draw-groups {
  min-height: 100vh;
  background: #f8fafc;
  padding-top: 46px;
  padding-bottom: 100px; /* 为吸底按钮留出空间 */
}

.content {
  padding: 16px;
  padding-bottom: 80px; /* 为浮动按钮留出空间 */
}

.groups-container {
  margin-top: 16px;
}

/* 浮动操作按钮 */
.fab-buttons {
  position: fixed;
  right: 20px;
  bottom: 100px; /* 在保存按钮上方 */
  z-index: 100;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.fab-main {
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
  transition: all 0.3s ease;
}

.fab-main:active {
  transform: scale(0.95);
}

.fab-label {
  font-size: 12px;
  color: #64748b;
  white-space: nowrap;
  background: white;
  padding: 4px 8px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* 吸底保存按钮 */
.save-button-fixed {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 12px 16px;
  background: white;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
  z-index: 99;
}
</style>

