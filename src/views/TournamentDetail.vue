<template>
  <div class="tournament-detail">
    <van-nav-bar :title="tournament?.name || '比赛详情'" left-arrow @click-left="$router.back()" />
    
    <div class="content" v-if="tournament">
      <!-- 比赛信息 -->
      <van-cell-group inset>
        <van-cell title="赛制" :value="getFormatText(tournament.format)" />
        <van-cell title="计分方式" :value="getScoringText(tournament.scoring_method)" />
        <van-cell title="分组方式" :value="getGroupText(tournament.group_method)" />
        <van-cell title="状态" :value="getStatusText(tournament.status)" />
        <van-cell 
          v-if="tournament.start_date || tournament.start_time" 
          title="比赛时间" 
          :value="formatDateTime(tournament)" 
        />
        <van-cell 
          v-if="tournament.location" 
          title="比赛地点" 
          :value="tournament.location" 
        />
      </van-cell-group>
      
      <!-- 选手列表 -->
      <van-cell-group inset style="margin-top: 16px;">
        <van-cell 
          title="参赛选手" 
          :value="`共${tournament.players?.length || 0}人`"
          is-link
          @click="showAddPlayers = true"
        >
          <template #right-icon>
            <van-icon name="plus" />
          </template>
        </van-cell>
        <div v-if="tournament.players && tournament.players.length > 0" class="players-tags">
          <van-cell
            v-for="player in tournament.players"
            :key="player.id"
            :title="player.name"
            :label="getPlayerLabel(player)"
          />
        </div>
        <van-empty v-else description="暂无选手，点击添加" />
      </van-cell-group>
      
      <!-- 添加选手弹窗 -->
      <van-popup 
        v-model:show="showAddPlayers" 
        position="bottom" 
        :style="{ height: '90%' }"
      >
        <AddPlayers 
          :tournament-id="tournament.id"
          :existing-players="tournament.players || []"
          @success="handlePlayersAdded"
          @cancel="showAddPlayers = false"
        />
      </van-popup>
      
      
      <!-- 小组排名 -->
      <van-cell-group inset style="margin-top: 16px;" v-if="tournament.status === 'group-stage' && tournament.players && tournament.players.length > 0">
        <van-cell 
          title="小组排名" 
          value="查看排名"
          is-link
          @click="showRanking = true"
        />
      </van-cell-group>
      
      <!-- 比赛列表（按小组分组） -->
      <van-cell-group inset style="margin-top: 16px;">
        <van-cell title="比赛列表" />
        <van-empty v-if="!tournament.matches || tournament.matches.length === 0" description="暂无比赛" />
        
        <!-- 按小组分组显示 -->
        <template v-if="tournament.matches && tournament.matches.length > 0">
          <!-- 小组赛 -->
          <template v-for="group in getMatchGroups()" :key="group">
            <van-cell 
              v-if="group"
              :title="`${group}组`" 
              :value="`${getGroupMatches(group).length}场`"
            />
            <van-cell
              v-for="(match, index) in getGroupMatches(group)"
              :key="match.id"
              :title="`第${match.matchNumber || (index + 1)}场：${match.player1_name} VS ${match.player2_name}`"
              :label="getMatchLabel(match)"
              is-link
              @click="goToMatch(match.id)"
            />
          </template>
          
          <!-- 8分之一决赛 -->
          <van-cell 
            v-if="getRoundMatches('round-of-16').length > 0"
            title="8分之一决赛" 
            :value="`${getRoundMatches('round-of-16').length}场`"
          />
          <van-cell
            v-for="(match, index) in getRoundMatches('round-of-16')"
            :key="match.id"
            :title="`第${index + 1}场：${match.player1_name} VS ${match.player2_name}`"
            :label="getMatchLabel(match)"
            is-link
            @click="goToMatch(match.id)"
          />
          
          <!-- 四分之一决赛 -->
          <van-cell 
            v-if="getRoundMatches('quarter-final').length > 0"
            title="四分之一决赛" 
            :value="`${getRoundMatches('quarter-final').length}场`"
          />
          <van-cell
            v-for="(match, index) in getRoundMatches('quarter-final')"
            :key="match.id"
            :title="`第${index + 1}场：${match.player1_name} VS ${match.player2_name}`"
            :label="getMatchLabel(match)"
            is-link
            @click="goToMatch(match.id)"
          />
          
          <!-- 半决赛 -->
          <van-cell 
            v-if="getRoundMatches('semi-final').length > 0"
            title="半决赛" 
            :value="`${getRoundMatches('semi-final').length}场`"
          />
          <van-cell
            v-for="(match, index) in getRoundMatches('semi-final')"
            :key="match.id"
            :title="`第${index + 1}场：${match.player1_name} VS ${match.player2_name}`"
            :label="getMatchLabel(match)"
            is-link
            @click="goToMatch(match.id)"
          />
          
          <!-- 决赛 -->
          <van-cell 
            v-if="getRoundMatches('final').length > 0"
            title="决赛" 
            :value="`${getRoundMatches('final').length}场`"
          />
          <van-cell
            v-for="(match, index) in getRoundMatches('final')"
            :key="match.id"
            :title="`第${index + 1}场：${match.player1_name} VS ${match.player2_name}`"
            :label="getMatchLabel(match)"
            is-link
            @click="goToMatch(match.id)"
          />
        </template>
      </van-cell-group>
      
      <!-- 抽签分组弹窗 -->
      <van-popup 
        v-model:show="showDrawGroups" 
        position="bottom" 
        :style="{ height: '90%' }"
      >
        <DrawGroups 
          :players="tournament.players || []"
          :group-method="tournament.group_method"
          :tournament-id="tournament.id"
          @success="handleDrawSuccess"
          @cancel="showDrawGroups = false"
        />
      </van-popup>
      
      <!-- 小组排名弹窗 -->
      <van-popup 
        v-model:show="showRanking" 
        position="bottom" 
        :style="{ height: '90%' }"
      >
        <GroupRanking 
          :players="tournament.players || []"
          :matches="tournament.matches || []"
          :tournament-id="tournament.id"
          @cancel="showRanking = false"
        />
      </van-popup>
      
      <!-- 编辑比赛弹窗 -->
      <van-popup 
        v-model:show="showEditMatch" 
        position="bottom"
        :style="{ padding: '20px' }"
      >
        <van-form @submit="saveMatchEdit">
          <van-cell-group inset>
            <van-cell title="编辑比赛信息" />
            <van-field
              v-model="matchEditForm.start_date"
              name="start_date"
              label="比赛日期"
              placeholder="选择日期"
              is-link
              readonly
              @click="showDatePicker = true"
            />
            <van-field
              v-model="matchEditForm.start_time"
              name="start_time"
              label="比赛时间"
              placeholder="选择时间"
              is-link
              readonly
              @click="showTimePicker = true"
            />
            <van-field
              v-model="matchEditForm.location"
              name="location"
              label="比赛地点"
              placeholder="请输入比赛地点"
            />
          </van-cell-group>
          <div style="margin-top: 16px; padding: 0 16px;">
            <van-button round block type="primary" native-type="submit">
              保存
            </van-button>
            <van-button round block style="margin-top: 12px;" @click="showEditMatch = false">
              取消
            </van-button>
          </div>
        </van-form>
      </van-popup>
      
      <!-- 日期选择器 -->
      <van-popup v-model:show="showDatePicker" position="bottom">
        <van-date-picker
          v-model="datePickerValue"
          @confirm="onDateConfirm"
          @cancel="showDatePicker = false"
        />
      </van-popup>
      
      <!-- 时间选择器 -->
      <van-popup v-model:show="showTimePicker" position="bottom">
        <van-time-picker
          v-model="timePickerValue"
          @confirm="onTimeConfirm"
          @cancel="showTimePicker = false"
        />
      </van-popup>
    </div>
    
    <!-- 浮动分组按钮 -->
    <div v-if="tournament && tournament.players && tournament.players.length > 0" class="fab-buttons">
      <div class="fab-main" @click="showDrawGroups = true">
        <van-icon name="setting-o" size="24" />
      </div>
      <div class="fab-label">分组</div>
    </div>
    
    <van-loading v-else type="spinner" vertical>加载中...</van-loading>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getTournament, updateTournament } from '../api/tournaments'
import { showFailToast, showSuccessToast } from 'vant'
import AddPlayers from '../components/AddPlayers.vue'
import DrawGroups from '../components/DrawGroups.vue'
import GroupRanking from '../components/GroupRanking.vue'

const route = useRoute()
const router = useRouter()
const tournament = ref(null)
const showAddPlayers = ref(false)
const showDrawGroups = ref(false)
const showRanking = ref(false)
const showEditMatch = ref(false)
const editingMatch = ref(null)
const matchEditForm = ref({
  start_date: '',
  start_time: '',
  location: ''
})
const showDatePicker = ref(false)
const showTimePicker = ref(false)
const datePickerValue = ref(['2025', '01', '01'])
const timePickerValue = ref(['14', '00'])

function getFormatText(format) {
  const map = {
    'short-set': '短盘制',
    'best-of-3': '三盘两胜',
    'best-of-5': '五盘三胜'
  }
  return map[format] || format
}

function getScoringText(scoring) {
  const map = {
    'ad': '占先制',
    'no-ad': '金球制'
  }
  return map[scoring] || scoring
}

function getGroupText(group) {
  const map = {
    '2-groups': '2组',
    '4-groups': '4组',
    'no-groups': '无分组'
  }
  return map[group] || group
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

function getMatchStatus(match) {
  const map = {
    'pending': '未开始',
    'in-progress': '进行中',
    'finished': '已结束'
  }
  return map[match.status] || match.status
}

function getMatchLabel(match) {
  const parts = [getMatchStatus(match)]
  
  // 添加时间和地点信息
  const dateTime = getMatchDateTime(match)
  const location = getMatchLocation(match)
  
  if (dateTime) {
    parts.push(dateTime)
  }
  if (location) {
    parts.push(location)
  }
  
  return parts.join(' | ')
}

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
  if (tournament.value) {
    const parts = []
    if (tournament.value.start_date) {
      const date = new Date(tournament.value.start_date)
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      parts.push(`${month}-${day}`)
    }
    if (tournament.value.start_time) {
      parts.push(tournament.value.start_time)
    }
    if (parts.length > 0) {
      return parts.join(' ')
    }
  }
  
  return null
}

function getMatchLocation(match) {
  if (match.location) {
    return match.location
  }
  if (tournament.value && tournament.value.location) {
    return tournament.value.location
  }
  return null
}

function editMatch(match) {
  editingMatch.value = match
  matchEditForm.value = {
    start_date: match.start_date || tournament.value?.start_date || '',
    start_time: match.start_time || tournament.value?.start_time || '',
    location: match.location || tournament.value?.location || ''
  }
  initEditFormDate()
  showEditMatch.value = true
}

function initEditFormDate() {
  if (editingMatch.value) {
    const match = editingMatch.value
    let dateStr = match.start_date || tournament.value?.start_date || ''
    let timeStr = match.start_time || tournament.value?.start_time || ''
    
    if (!dateStr) {
      const now = new Date()
      dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
    }
    
    if (!timeStr) {
      timeStr = '14:00'
    }
    
    const [year, month, day] = dateStr.split('-')
    const [hours, minutes] = timeStr.split(':')
    
    datePickerValue.value = [year || '2025', month || '01', day || '01']
    timePickerValue.value = [hours || '14', minutes || '00']
  }
}

function onDateConfirm({ selectedValues }) {
  const [year, month, day] = selectedValues
  matchEditForm.value.start_date = `${year}-${month}-${day}`
  showDatePicker.value = false
}

function onTimeConfirm({ selectedValues }) {
  const [hours, minutes] = selectedValues
  matchEditForm.value.start_time = `${hours}:${minutes}`
  showTimePicker.value = false
}

async function saveMatchEdit() {
  if (!editingMatch.value) return
  
  try {
    const matchIndex = tournament.value.matches.findIndex(m => m.id === editingMatch.value.id)
    if (matchIndex === -1) {
      showFailToast('找不到比赛记录')
      return
    }
    
    // 更新比赛信息
    tournament.value.matches[matchIndex] = {
      ...tournament.value.matches[matchIndex],
      start_date: matchEditForm.value.start_date,
      start_time: matchEditForm.value.start_time,
      location: matchEditForm.value.location
    }
    
    // 保存到storage
    const response = await updateTournament(tournament.value.id, {
      matches: tournament.value.matches
    })
    
    if (response.success) {
      showSuccessToast('比赛信息已更新')
      showEditMatch.value = false
      editingMatch.value = null
      await loadTournament()
    } else {
      throw new Error(response.message || '保存失败')
    }
  } catch (error) {
    showFailToast('保存失败：' + error.message)
  }
}

function getPlayerLabel(player) {
  const parts = []
  if (player.gender) {
    parts.push(player.gender === 'male' ? '男' : player.gender === 'female' ? '女' : '其他')
  }
  if (player.number) parts.push(`编号: ${player.number}`)
  return parts.join(' | ')
}

function formatDateTime(tournament) {
  const parts = []
  if (tournament.start_date) {
    const date = new Date(tournament.start_date)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    parts.push(`${year}-${month}-${day}`)
  }
  if (tournament.start_time) {
    parts.push(tournament.start_time)
  }
  return parts.join(' ') || ''
}

// 已移除审核状态显示，添加后直接通过

function goToMatch(id) {
  // 传递tournament_id，确保加载正确的比赛
  const tournamentId = tournament.value?.id
  if (tournamentId) {
    router.push(`/match/${id}?tournament=${tournamentId}`)
  } else {
    router.push(`/match/${id}`)
  }
}

// 获取所有比赛的小组列表
function getMatchGroups() {
  if (!tournament.value || !tournament.value.matches) return []
  const groups = new Set()
  tournament.value.matches.forEach(match => {
    if (match.group && (!match.round || match.round === 'group')) {
      groups.add(match.group)
    }
  })
  return Array.from(groups).sort()
}

// 获取指定小组的比赛列表
function getGroupMatches(group) {
  if (!tournament.value || !tournament.value.matches) return []
  return tournament.value.matches
    .filter(m => m.group === group && (!m.round || m.round === 'group' || typeof m.round === 'number'))
    .sort((a, b) => {
      // 优先按matchNumber排序（场次编号）
      if (a.matchNumber !== undefined && b.matchNumber !== undefined) {
        return a.matchNumber - b.matchNumber
      }
      // 其次按round（轮次）排序
      if (a.round !== undefined && b.round !== undefined && typeof a.round === 'number' && typeof b.round === 'number') {
        return a.round - b.round
      }
      // 最后按创建时间排序
      const timeA = new Date(a.created_at || 0).getTime()
      const timeB = new Date(b.created_at || 0).getTime()
      return timeA - timeB
    })
}

// 获取指定轮次的比赛列表
function getRoundMatches(round) {
  if (!tournament.value || !tournament.value.matches) return []
  return tournament.value.matches
    .filter(m => m.round === round)
    .sort((a, b) => {
      // 按创建时间排序
      const timeA = new Date(a.created_at || 0).getTime()
      const timeB = new Date(b.created_at || 0).getTime()
      return timeA - timeB
    })
}

// 获取不分组模式的第一轮、第二轮等
function getRoundNumberMatches(roundNumber) {
  if (!tournament.value || !tournament.value.matches) return []
  return tournament.value.matches
    .filter(m => m.round === `round-${roundNumber}`)
    .sort((a, b) => {
      const timeA = new Date(a.created_at || 0).getTime()
      const timeB = new Date(b.created_at || 0).getTime()
      return timeA - timeB
    })
}

// 获取轮次显示名称
function getRoundDisplayName(round) {
  const roundNames = {
    'round-1': '第一轮',
    'round-2': '第二轮',
    'round-3': '第三轮',
    'round-of-16': '16强',
    'quarter-final': '8强',
    'semi-final': '半决赛',
    'final': '决赛'
  }
  return roundNames[round] || round
}

async function loadTournament() {
  try {
    const response = await getTournament(route.params.id)
    if (response.success) {
      tournament.value = response.data
    } else {
      showFailToast(response.message || '加载失败')
    }
  } catch (error) {
    showFailToast('加载失败：' + error.message)
  }
}

function handlePlayersAdded() {
  // 重新加载比赛数据
  loadTournament()
  showAddPlayers.value = false
}

function handleDrawSuccess() {
  // 重新加载比赛数据
  loadTournament()
  showDrawGroups.value = false
  // 分组完成后，自动打开分组详情（小组排名）
  setTimeout(() => {
    showRanking.value = true
  }, 300)
}

async function handleQuickDraw() {
  if (!tournament.value || !tournament.value.players || tournament.value.players.length === 0) {
    showFailToast('没有选手可以分组')
    return
  }
  
  try {
    // 导入必要的函数
    const { updateTournament, getTournament } = await import('../api/tournaments')
    const { generateGroupMatches } = await import('../utils/draw')
    
    // 获取当前比赛数据
    const tournamentResponse = await getTournament(tournament.value.id)
    if (!tournamentResponse.success) {
      throw new Error(tournamentResponse.message || '获取比赛数据失败')
    }
    
    const currentTournament = tournamentResponse.data
    
    // 执行自动分组
    const groupCount = tournament.value.group_method === '2-groups' ? 2 : 
                      tournament.value.group_method === '4-groups' ? 4 : 1
    const groupNames = ['A', 'B', 'C', 'D']
    const groups = []
    for (let i = 0; i < groupCount; i++) {
      groups.push({
        name: groupNames[i],
        players: []
      })
    }
    
    // 随机打乱选手顺序
    const shuffled = [...currentTournament.players].sort(() => Math.random() - 0.5)
    
    // 均分到各组
    const updatedPlayers = shuffled.map((player, index) => {
      const groupIndex = index % groupCount
      return {
        ...player,
        group: groups[groupIndex].name
      }
    })
    
    // 生成小组赛对阵
    const matches = generateGroupMatches(updatedPlayers)
    
    // 保存更新
    const updateResponse = await updateTournament(tournament.value.id, {
      players: updatedPlayers,
      matches: matches,
      status: 'group-stage'
    })
    
    if (updateResponse.success) {
      showSuccessToast('分组完成，已生成比赛对阵')
      // 重新加载数据
      await loadTournament()
      // 延迟打开分组详情
      setTimeout(() => {
        showRanking.value = true
      }, 300)
    } else {
      throw new Error(updateResponse.message || '保存失败')
    }
  } catch (error) {
    showFailToast('分组失败：' + error.message)
  }
}

function getGroupStatus() {
  if (!tournament.value || !tournament.value.players) return '未分组'
  const grouped = tournament.value.players.filter(p => p.group).length
  const total = tournament.value.players.length
  if (grouped === 0) return '未分组'
  if (grouped === total) return '已分组'
  return `部分分组 (${grouped}/${total})`
}

onMounted(() => {
  loadTournament()
  
  // 监听数据更新事件（防抖处理）
  let refreshTimer = null
  window.addEventListener('data-updated', () => {
    if (refreshTimer) {
      clearTimeout(refreshTimer)
    }
    refreshTimer = setTimeout(() => {
      loadTournament()
    }, 300)
  })
})
</script>

<style scoped>
.tournament-detail {
  min-height: 100vh;
  background: #f8fafc;
  padding-top: 46px;
  padding-bottom: 50px; /* 为底部导航留出空间 */
}

.content {
  padding: 16px;
}

.players-tags {
  padding: 8px 16px;
}

/* 浮动分组按钮 */
.fab-buttons {
  position: fixed;
  right: 20px;
  bottom: 70px; /* 在底部导航上方 */
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
</style>

