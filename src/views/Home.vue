<template>
  <div class="home">
    <van-nav-bar title="球搭子网球赛事管理系统" fixed />
    
    <div class="home-content">
      <div class="logo-section">
        <div class="logo">🎾</div>
        <h1 class="title">球搭子网球赛事管理系统</h1>
        <p class="subtitle">专业的网球赛事管理平台</p>
      </div>
      
      <van-button 
        type="primary" 
        size="large" 
        block 
        round
        @click="goToLogin"
        class="start-btn"
      >
        开始使用
        <van-icon name="arrow" />
      </van-button>
      
      <div class="features">
        <div class="feature-item">
          <van-icon name="success" color="#10b981" />
          <span>专业的计分系统</span>
        </div>
        <div class="feature-item">
          <van-icon name="success" color="#10b981" />
          <span>实时比分录入</span>
        </div>
        <div class="feature-item">
          <van-icon name="success" color="#10b981" />
          <span>自动积分排名</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { useUserStore } from '../store/user'

const router = useRouter()
const userStore = useUserStore()

function goToLogin() {
  console.log('点击开始使用按钮，当前登录状态:', userStore.isLoggedIn)
  if (userStore.isLoggedIn) {
    console.log('已登录，跳转到赛事列表')
    router.push('/tournaments')
  } else {
    console.log('未登录，跳转到登录页')
    router.push('/login')
  }
}
</script>

<style scoped>
.home {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding-top: 46px;
}

.home-content {
  padding: 60px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  min-height: calc(100vh - 46px);
}

.logo-section {
  text-align: center;
  margin-bottom: 60px;
}

.logo {
  font-size: 80px;
  margin-bottom: 20px;
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
}

.title {
  font-size: 24px;
  font-weight: 700;
  color: white;
  margin-bottom: 10px;
}

.subtitle {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.9);
}

.start-btn {
  width: 100%;
  max-width: 300px;
  margin-bottom: 60px;
  height: 50px;
  font-size: 18px;
  font-weight: 600;
}

.features {
  display: flex;
  flex-direction: column;
  gap: 20px;
  width: 100%;
  max-width: 300px;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 12px;
  color: white;
  font-size: 16px;
}

.feature-item .van-icon {
  font-size: 20px;
}
</style>

