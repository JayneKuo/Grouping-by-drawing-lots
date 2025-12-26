<template>
  <div class="create-tournament">
    <van-nav-bar title="创建比赛" left-arrow @click-left="$emit('cancel')" />
    
    <van-form @submit="onSubmit" class="form">
      <van-cell-group inset>
        <van-field
          v-model="form.name"
          name="name"
          label="比赛名称"
          placeholder="请输入比赛名称"
          :rules="[{ required: true, message: '请输入比赛名称' }]"
        />
        
        <van-field
          v-model="form.format"
          name="format"
          label="赛制"
          placeholder="选择赛制"
          is-link
          readonly
          @click="showFormatPicker = true"
        />
        
        <van-field
          v-model="form.scoringMethod"
          name="scoringMethod"
          label="计分方式"
          placeholder="选择计分方式"
          is-link
          readonly
          @click="showScoringPicker = true"
        />
        
        <van-field
          v-model="form.groupMethod"
          name="groupMethod"
          label="分组方式"
          placeholder="选择分组方式"
          is-link
          readonly
          @click="showGroupPicker = true"
        />
        
        <van-field
          v-model="form.startDate"
          name="startDate"
          label="比赛日期"
          placeholder="选择比赛日期"
          is-link
          readonly
          @click="showDatePicker = true"
        />
        
        <van-field
          v-model="form.startTime"
          name="startTime"
          label="开始时间"
          placeholder="选择开始时间"
          is-link
          readonly
          @click="showTimePicker = true"
        />
        
        <van-field
          v-model="form.location"
          name="location"
          label="比赛地点"
          placeholder="请输入比赛地点"
        />
      </van-cell-group>
      
      <div class="form-button">
        <van-button round block type="primary" native-type="submit" :loading="loading">
          创建比赛
        </van-button>
      </div>
    </van-form>
    
    <van-popup v-model:show="showFormatPicker" position="bottom">
      <van-picker
        :columns="formatColumns"
        @confirm="onFormatConfirm"
        @cancel="showFormatPicker = false"
      />
    </van-popup>
    
    <van-popup v-model:show="showScoringPicker" position="bottom">
      <van-picker
        :columns="scoringColumns"
        @confirm="onScoringConfirm"
        @cancel="showScoringPicker = false"
      />
    </van-popup>
    
    <van-popup v-model:show="showGroupPicker" position="bottom">
      <van-picker
        :columns="groupColumns"
        @confirm="onGroupConfirm"
        @cancel="showGroupPicker = false"
      />
    </van-popup>
    
    <van-popup v-model:show="showDatePicker" position="bottom">
      <van-picker
        v-model="currentDate"
        title="选择比赛日期"
        :columns="dateColumns"
        @confirm="onDateConfirm"
        @cancel="showDatePicker = false"
      />
    </van-popup>
    
    <van-popup v-model:show="showTimePicker" position="bottom">
      <van-picker
        v-model="currentTime"
        title="选择开始时间"
        :columns="timeColumns"
        @confirm="onTimeConfirm"
        @cancel="showTimePicker = false"
      />
    </van-popup>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { createTournament } from '../api/tournaments'
import { showSuccessToast, showFailToast } from 'vant'

const emit = defineEmits(['success', 'cancel'])

const loading = ref(false)
const showFormatPicker = ref(false)
const showScoringPicker = ref(false)
const showGroupPicker = ref(false)
const showDatePicker = ref(false)
const showTimePicker = ref(false)

const form = ref({
  name: '',
  format: 'short-set',
  scoringMethod: 'no-ad',
  groupMethod: '2-groups',
  startDate: '',
  startTime: '',
  location: ''
})

// 日期和时间选择器的当前值
const currentDate = ref([new Date().getFullYear(), new Date().getMonth() + 1, new Date().getDate()])
const currentTime = ref([new Date().getHours(), new Date().getMinutes()])

// 生成日期列（年份2024-2030，月份1-12，日期1-31）
const dateColumns = computed(() => {
  const years = Array.from({ length: 7 }, (_, i) => ({ text: `${2024 + i}年`, value: 2024 + i }))
  const months = Array.from({ length: 12 }, (_, i) => ({ text: `${i + 1}月`, value: i + 1 }))
  const days = Array.from({ length: 31 }, (_, i) => ({ text: `${i + 1}日`, value: i + 1 }))
  return [years, months, days]
})

// 生成时间列（小时0-23，分钟0-59）
const timeColumns = computed(() => {
  const hours = Array.from({ length: 24 }, (_, i) => ({ text: `${String(i).padStart(2, '0')}时`, value: i }))
  const minutes = Array.from({ length: 60 }, (_, i) => ({ text: `${String(i).padStart(2, '0')}分`, value: i }))
  return [hours, minutes]
})

const formatColumns = [
  { text: '短盘制（先胜4局，3-3抢七）', value: 'short-set' },
  { text: '三盘两胜制', value: 'best-of-3' },
  { text: '五盘三胜制', value: 'best-of-5' }
]

const scoringColumns = [
  { text: '金球制（40-40时下一分直接决定胜负）', value: 'no-ad' },
  { text: '占先制（40-40后需领先2分）', value: 'ad' }
]

const groupColumns = [
  { text: '2组（每组前2名出线）', value: '2-groups' },
  { text: '4组（每组第1名出线）', value: '4-groups' },
  { text: '无分组（直接淘汰赛）', value: 'no-groups' }
]

function onFormatConfirm({ selectedOptions }) {
  form.value.format = selectedOptions[0].value
  showFormatPicker.value = false
}

function onScoringConfirm({ selectedOptions }) {
  form.value.scoringMethod = selectedOptions[0].value
  showScoringPicker.value = false
}

function onGroupConfirm({ selectedOptions }) {
  form.value.groupMethod = selectedOptions[0].value
  showGroupPicker.value = false
}

function onDateConfirm({ selectedOptions }) {
  if (selectedOptions && selectedOptions.length >= 3) {
    const year = selectedOptions[0].value
    const month = selectedOptions[1].value
    const day = selectedOptions[2].value
    form.value.startDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    currentDate.value = [year, month, day]
  }
  showDatePicker.value = false
}

function onTimeConfirm({ selectedOptions }) {
  if (selectedOptions && selectedOptions.length >= 2) {
    const hour = selectedOptions[0].value
    const minute = selectedOptions[1].value
    form.value.startTime = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
    currentTime.value = [hour, minute]
  }
  showTimePicker.value = false
}

async function onSubmit() {
  loading.value = true
  try {
    const response = await createTournament(form.value)
    if (response.success) {
      showSuccessToast('创建成功')
      // 传递比赛ID，让父组件跳转到详情页
      emit('success', response.data.id)
    } else {
      showFailToast(response.message || '创建失败')
    }
  } catch (error) {
    showFailToast('创建失败：' + error.message)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.create-tournament {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.form {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.form-button {
  margin-top: 24px;
  padding: 0 16px;
}
</style>

