<template>
  <div class="add-players">
    <van-nav-bar title="添加参赛选手" left-arrow @click-left="$emit('cancel')" />
    
    <van-tabs v-model:active="activeTab" class="tabs">
      <van-tab title="手动添加" name="manual">
        <div class="form-content">
          <!-- 单个添加模式 -->
          <van-form @submit="onAddPlayer">
            <van-cell-group inset>
              <van-field
                v-model="playerForm.name"
                name="name"
                label="姓名"
                placeholder="请输入选手姓名"
                :rules="[{ required: true, message: '请输入选手姓名' }]"
                left-icon="user-o"
              />
              <van-field
                v-model="playerForm.gender"
                name="gender"
                label="性别"
                placeholder="选择性别"
                is-link
                readonly
                @click="showGenderPicker = true"
              />
              <van-field
                v-model="playerForm.number"
                name="number"
                label="编号"
                placeholder="选手编号（可选）"
                left-icon="orders-o"
              />
              <van-field
                v-model="playerForm.phone"
                name="phone"
                label="联系方式"
                placeholder="手机号（可选）"
                type="tel"
                left-icon="phone-o"
              />
            </van-cell-group>
            <div class="form-button">
              <van-button round block type="primary" native-type="submit">
                添加选手
              </van-button>
            </div>
          </van-form>
          
          <!-- 批量添加模式 -->
          <van-cell-group inset style="margin-top: 16px;">
            <van-cell title="批量添加" label="每行一个姓名，支持换行" />
            <van-field
              v-model="batchNames"
              type="textarea"
              rows="8"
              placeholder="请输入选手姓名，每行一个&#10;例如：&#10;张三&#10;李四&#10;王五"
              show-word-limit
              maxlength="1000"
              autosize
            />
            <div class="form-button">
              <van-button round block type="success" @click="onBatchAdd">
                批量添加（{{ batchPlayerCount }}人）
              </van-button>
            </div>
          </van-cell-group>
          
          <van-popup v-model:show="showGenderPicker" position="bottom">
            <van-picker
              :columns="genderColumns"
              @confirm="onGenderConfirm"
              @cancel="showGenderPicker = false"
            />
          </van-popup>
        </div>
      </van-tab>
      
      <van-tab title="批量导入" name="batch">
        <div class="batch-content">
          <van-uploader
            v-model="fileList"
            :after-read="afterRead"
            accept=".xlsx,.xls"
            :max-count="1"
          >
            <van-button icon="plus" type="primary">选择Excel文件</van-button>
          </van-uploader>
          
          <div class="template-download">
            <van-button icon="down" plain @click="downloadTemplate">
              下载导入模板
            </van-button>
          </div>
          
          <div class="batch-preview" v-if="previewPlayers.length > 0">
            <van-cell title="预览（共{{ previewPlayers.length }}人）" />
            <van-cell
              v-for="(player, index) in previewPlayers"
              :key="index"
              :title="player.name"
              :label="`${player.gender || ''} ${player.number || ''}`"
            />
            <div class="form-button">
              <van-button round block type="primary" @click="onBatchImport">
                确认导入
              </van-button>
            </div>
          </div>
        </div>
      </van-tab>
    </van-tabs>
    
    <!-- 已添加选手列表 -->
    <div class="players-list" v-if="players.length > 0">
      <van-cell-group inset>
        <van-cell title="已添加选手" :value="`共${players.length}人`" />
        <van-cell
          v-for="(player, index) in players"
          :key="player.id || index"
          :title="player.name"
          :label="getPlayerLabel(player)"
          is-link
          @click="showPlayerActions(player, index)"
        />
      </van-cell-group>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import { showSuccessToast, showFailToast, showConfirmDialog } from 'vant'
import { addPlayer, deletePlayer, batchImportPlayers } from '../api/players'

const props = defineProps({
  tournamentId: {
    type: [String, Number],
    required: true
  },
  existingPlayers: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['success', 'cancel'])

const activeTab = ref('manual')
const showGenderPicker = ref(false)
const fileList = ref([])
const previewPlayers = ref([])
const players = ref([...props.existingPlayers])

// 监听existingPlayers变化，更新本地players
watch(() => props.existingPlayers, (newPlayers) => {
  if (newPlayers && Array.isArray(newPlayers)) {
    players.value = [...newPlayers]
    console.log('📥 AddPlayers: 更新选手列表，数量:', players.value.length)
  }
}, { immediate: true, deep: true })
const batchNames = ref('')

const playerForm = ref({
  name: '',
  gender: '',
  number: '',
  phone: ''
})

const genderColumns = [
  { text: '男', value: 'male' },
  { text: '女', value: 'female' },
  { text: '其他', value: 'other' }
]

function onGenderConfirm({ selectedOptions }) {
  playerForm.value.gender = selectedOptions[0].value
  showGenderPicker.value = false
}

async function onAddPlayer() {
  if (!playerForm.value.name.trim()) {
    showFailToast('请输入选手姓名')
    return
  }
  
  const playerData = {
    name: playerForm.value.name.trim(),
    gender: playerForm.value.gender,
    number: playerForm.value.number.trim(),
    phone: playerForm.value.phone.trim(),
    status: 'approved' // 直接通过，无需审核
  }
  
  try {
    const response = await addPlayer(props.tournamentId, playerData)
    if (response.success && response.data) {
      players.value.push(response.data)
      showSuccessToast('添加成功')
      
      // 清空表单
      playerForm.value = {
        name: '',
        gender: '',
        number: '',
        phone: ''
      }
      
      // 通知父组件更新
      emit('success', [...players.value])
      console.log('✅ 单个添加成功，当前选手数:', players.value.length)
    } else {
      showFailToast(response.message || '添加失败')
    }
  } catch (error) {
    showFailToast('添加失败：' + error.message)
  }
}

// 批量添加选手
async function onBatchAdd() {
  if (!batchNames.value.trim()) {
    showFailToast('请输入选手姓名')
    return
  }
  
  // 解析每行姓名，自动识别数字并提取序号
  const parsedLines = batchNames.value
    .split('\n')
    .map((line, index) => {
      const trimmed = line.trim()
      if (!trimmed) return null
      
      // 尝试匹配数字开头的格式：如 "1. 张三"、"1 张三"、"1-张三"、"1、张三"
      const numberMatch = trimmed.match(/^(\d+)[.\-\s、]?\s*(.+)$/)
      if (numberMatch) {
        return {
          number: numberMatch[1],
          name: numberMatch[2].trim()
        }
      }
      
      // 如果没有数字，使用行号作为序号
      return {
        number: String(index + 1),
        name: trimmed
      }
    })
    .filter(item => item && item.name.length > 0)
  
  if (parsedLines.length === 0) {
    showFailToast('请输入至少一个选手姓名')
    return
  }
  
  // 提取姓名列表
  const names = parsedLines.map(item => item.name)
  
  // 检查是否有重复姓名
  const duplicates = names.filter((name, index) => names.indexOf(name) !== index)
  if (duplicates.length > 0) {
    showFailToast(`发现重复姓名：${duplicates.join('、')}`)
    return
  }
  
  // 检查是否已存在
  const existingNames = players.value.map(p => p.name)
  const newPlayers = parsedLines.filter(item => !existingNames.includes(item.name))
  
  if (newPlayers.length === 0) {
    showFailToast('所有选手已存在')
    return
  }
  
  if (newPlayers.length < parsedLines.length) {
    const skipped = parsedLines.length - newPlayers.length
    showFailToast(`跳过${skipped}个已存在的选手`)
  }
  
  // 批量添加（使用批量API）
  try {
    const playerDataList = newPlayers.map(item => ({
      name: item.name,
      number: item.number, // 保存识别到的序号
      gender: '',
      phone: '',
      status: 'approved' // 直接通过，无需审核
    }))
    
    console.log('批量添加请求:', {
      tournamentId: props.tournamentId,
      players: playerDataList
    })
    
    const response = await batchImportPlayers(props.tournamentId, playerDataList)
    console.log('批量添加响应:', response)
    
    if (response.success && response.data) {
      // 添加新选手到列表
      const newPlayers = Array.isArray(response.data) ? response.data : [response.data]
      players.value.push(...newPlayers)
      
      console.log('✅ 批量添加成功，新增选手数:', newPlayers.length, '当前总数:', players.value.length)
      
      showSuccessToast(response.message || `成功添加${newPlayers.length}名选手`)
      batchNames.value = '' // 清空输入框
      
      // 通知父组件更新（传递完整的选手列表）
      emit('success', [...players.value])
    } else {
      showFailToast(response.message || '批量添加失败')
    }
  } catch (error) {
    console.error('批量添加错误:', error)
    const errorMsg = error.response?.data?.message || error.message || '批量添加失败'
    showFailToast(errorMsg)
  }
}

// 计算批量添加的选手数量
const batchPlayerCount = computed(() => {
  if (!batchNames.value.trim()) return 0
  return batchNames.value
    .split('\n')
    .map(name => name.trim())
    .filter(name => name.length > 0).length
})

function afterRead(file) {
  // Excel解析（简化版，实际需要使用xlsx库）
  showFailToast('Excel导入功能开发中，请使用手动添加')
}

function downloadTemplate() {
  showFailToast('模板下载功能开发中')
}

function onBatchImport() {
  if (previewPlayers.value.length === 0) {
    showFailToast('没有可导入的数据')
    return
  }
  
  players.value.push(...previewPlayers.value)
  previewPlayers.value = []
  fileList.value = []
  showSuccessToast('导入成功')
}

function getPlayerLabel(player) {
  const parts = []
  if (player.gender) parts.push(player.gender === 'male' ? '男' : player.gender === 'female' ? '女' : '其他')
  if (player.number) parts.push(`编号: ${player.number}`)
  if (player.phone) parts.push(player.phone)
  return parts.join(' | ') || '未填写'
}

async function showPlayerActions(player, index) {
  showConfirmDialog({
    title: '操作',
    message: `删除选手"${player.name}"？`
  }).then(async () => {
    try {
      const response = await deletePlayer(props.tournamentId, player.id)
      if (response.success) {
        players.value.splice(index, 1)
        showSuccessToast('已删除')
        emit('success', players.value)
      } else {
        showFailToast(response.message || '删除失败')
      }
    } catch (error) {
      showFailToast('删除失败：' + error.message)
    }
  }).catch(() => {})
}

// 监听existingPlayers变化
watch(() => props.existingPlayers, (newVal) => {
  players.value = [...newVal]
}, { immediate: true })
</script>

<style scoped>
.add-players {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #f8fafc;
}

.tabs {
  flex: 1;
  overflow-y: auto;
}

.form-content,
.batch-content {
  padding: 16px;
}

.form-button {
  margin-top: 24px;
}

.template-download {
  margin-top: 16px;
  text-align: center;
}

.batch-preview {
  margin-top: 24px;
}

.players-list {
  padding: 16px;
  border-top: 1px solid #ebedf0;
}
</style>

