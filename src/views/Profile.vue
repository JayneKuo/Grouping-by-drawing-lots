<template>
  <div class="profile">
    <van-nav-bar title="我的" fixed />
    
    <div class="content">
      <van-cell-group inset>
        <van-cell 
          title="当前用户" 
          :value="userStore.user?.username || '未登录'"
        />
        <van-cell 
          title="角色" 
          :value="userStore.user?.role === 'admin' ? '管理员' : '普通用户'"
        />
      </van-cell-group>
      
      <van-cell-group inset style="margin-top: 16px;">
        <van-cell title="数据管理" label="导出/导入数据" is-link @click="showDataManage = true" />
        <van-cell title="存储信息" :value="`已使用 ${storageSize} KB`" />
      </van-cell-group>
      
      <div class="logout-button">
        <van-button round block type="danger" @click="handleLogout">
          退出登录
        </van-button>
      </div>
      
      <!-- 数据管理弹窗 -->
      <van-popup v-model:show="showDataManage" position="bottom" :style="{ height: '50%' }">
        <div class="data-manage">
          <van-nav-bar title="数据管理" @click-left="showDataManage = false" left-arrow />
          <div class="manage-content">
            <van-cell-group inset>
              <van-cell title="导出数据" label="将当前数据导出为JSON文件" is-link @click="handleExport" />
              <van-cell title="导入数据" label="从JSON文件恢复数据" is-link>
                <template #right-icon>
                  <input type="file" ref="fileInput" accept=".json" @change="handleImport" style="display: none" />
                  <van-icon name="arrow" @click="$refs.fileInput.click()" />
                </template>
              </van-cell>
              <van-cell title="清空数据" label="清除所有本地数据" is-link @click="handleClear" />
            </van-cell-group>
            <div class="tips">
              <van-notice-bar left-icon="info-o" color="#1989fa" background="#ecf9ff">
                提示：导出数据可以备份或分享给其他用户
              </van-notice-bar>
            </div>
          </div>
        </div>
      </van-popup>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../store/user'
import { showSuccessToast, showFailToast, showConfirmDialog } from 'vant'
import { storage } from '../utils/storage'

const router = useRouter()
const userStore = useUserStore()
const showDataManage = ref(false)
const fileInput = ref(null)

const storageSize = computed(() => {
  return storage.getStorageSize()
})

function handleExport() {
  try {
    storage.exportData()
    showSuccessToast('数据导出成功')
    showDataManage.value = false
  } catch (error) {
    showFailToast('导出失败：' + error.message)
  }
}

async function handleImport(event) {
  const file = event.target.files[0]
  if (!file) return
  
  try {
    await storage.importData(file)
    showSuccessToast('数据导入成功，请刷新页面')
    showDataManage.value = false
    // 刷新页面以更新数据
    setTimeout(() => {
      window.location.reload()
    }, 1000)
  } catch (error) {
    showFailToast('导入失败：' + error.message)
  }
  
  // 清空文件输入
  event.target.value = ''
}

function handleClear() {
  showConfirmDialog({
    title: '确认清空',
    message: '此操作将清除所有本地数据，且无法恢复！确定要继续吗？'
  }).then(() => {
    storage.clearAll()
    showSuccessToast('数据已清空')
    showDataManage.value = false
    setTimeout(() => {
      window.location.reload()
    }, 1000)
  }).catch(() => {})
}

function handleLogout() {
  userStore.logout()
  showSuccessToast('已退出登录')
  router.push('/login')
}
</script>

<style scoped>
.profile {
  min-height: 100vh;
  background: #f8fafc;
  padding-top: 46px;
  padding-bottom: 50px;
}

.content {
  padding: 16px;
}

.logout-button {
  margin-top: 32px;
  padding: 0 16px;
}

.data-manage {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.manage-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.tips {
  margin-top: 24px;
}
</style>

