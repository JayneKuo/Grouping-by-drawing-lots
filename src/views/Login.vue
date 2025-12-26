<template>
  <div class="login">
    <van-nav-bar title="登录" left-arrow @click-left="$router.back()" fixed />
    
    <div class="login-content">
      <div class="logo">🎾</div>
      <h2 class="title">我的球搭子</h2>
      <p class="subtitle">登录以继续使用</p>
      
      <van-tabs v-model:active="activeTab" class="login-tabs">
        <van-tab title="登录" name="login">
          <van-form @submit="onLogin">
            <van-cell-group inset>
              <van-field
                v-model="loginForm.username"
                name="username"
                label="用户名"
                placeholder="请输入用户名"
                :rules="[{ required: true, message: '请填写用户名' }]"
                left-icon="user-o"
              />
              <van-field
                v-model="loginForm.password"
                type="password"
                name="password"
                label="密码"
                placeholder="请输入密码"
                :rules="[{ required: true, message: '请填写密码' }]"
                left-icon="lock"
              />
            </van-cell-group>
            
            <!-- 快速登录提示 -->
            <div class="quick-login">
              <div class="quick-login-title">快速登录（内置账号）：</div>
              <div class="quick-login-buttons">
                <van-button 
                  size="small" 
                  type="primary" 
                  plain
                  @click="quickLogin('admin', 'admin123')"
                >
                  管理员
                </van-button>
                <van-button 
                  size="small" 
                  type="success" 
                  plain
                  @click="quickLogin('user1', 'user123')"
                >
                  用户1
                </van-button>
                <van-button 
                  size="small" 
                  type="warning" 
                  plain
                  @click="quickLogin('user2', 'user123')"
                >
                  用户2
                </van-button>
                <van-button 
                  size="small" 
                  type="danger" 
                  plain
                  @click="quickLogin('user3', 'user123')"
                >
                  用户3
                </van-button>
              </div>
            </div>
            
            <div class="login-button">
              <van-button round block type="primary" native-type="submit" :loading="loading">
                登录
              </van-button>
            </div>
          </van-form>
        </van-tab>
        
        <van-tab title="注册" name="register">
          <van-form @submit="onRegister">
            <van-cell-group inset>
              <van-field
                v-model="registerForm.username"
                name="username"
                label="用户名"
                placeholder="2-20个字符"
                :rules="[
                  { required: true, message: '请填写用户名' },
                  { pattern: /^.{2,20}$/, message: '用户名长度2-20个字符' }
                ]"
                left-icon="user-o"
              />
              <van-field
                v-model="registerForm.password"
                type="password"
                name="password"
                label="密码"
                placeholder="至少6个字符"
                :rules="[
                  { required: true, message: '请填写密码' },
                  { pattern: /^.{6,}$/, message: '密码至少6个字符' }
                ]"
                left-icon="lock"
              />
              <van-field
                v-model="registerForm.confirmPassword"
                type="password"
                name="confirmPassword"
                label="确认密码"
                placeholder="请再次输入密码"
                :rules="[
                  { required: true, message: '请确认密码' },
                  { validator: validateConfirmPassword }
                ]"
                left-icon="lock"
              />
            </van-cell-group>
            <div class="login-button">
              <van-button round block type="primary" native-type="submit" :loading="loading">
                注册
              </van-button>
            </div>
          </van-form>
        </van-tab>
      </van-tabs>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '../store/user'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const activeTab = ref('login')
const loading = ref(false)

const loginForm = ref({
  username: '',
  password: ''
})

const registerForm = ref({
  username: '',
  password: '',
  confirmPassword: ''
})

const validateConfirmPassword = (val) => {
  if (val !== registerForm.value.password) {
    return '两次密码不一致'
  }
  return true
}

async function onLogin() {
  loading.value = true
  const success = await userStore.handleLogin(loginForm.value.username, loginForm.value.password)
  loading.value = false
  
  if (success) {
    const redirect = route.query.redirect || '/tournaments'
    router.push(redirect)
  }
}

function quickLogin(username, password) {
  loginForm.value.username = username
  loginForm.value.password = password
  onLogin()
}

async function onRegister() {
  loading.value = true
  const success = await userStore.handleRegister(
    registerForm.value.username,
    registerForm.value.password,
    registerForm.value.confirmPassword
  )
  loading.value = false
  
  if (success) {
    activeTab.value = 'login'
    loginForm.value.username = registerForm.value.username
  }
}
</script>

<style scoped>
.login {
  min-height: 100vh;
  background: #f8fafc;
}

.login-content {
  padding: 40px 20px;
  max-width: 400px;
  margin: 0 auto;
}

.logo {
  text-align: center;
  font-size: 60px;
  margin-bottom: 20px;
}

.title {
  text-align: center;
  font-size: 24px;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 8px;
}

.subtitle {
  text-align: center;
  font-size: 14px;
  color: #64748b;
  margin-bottom: 40px;
}

.login-tabs {
  margin-top: 20px;
}

.login-button {
  margin-top: 24px;
  padding: 0 16px;
}

:deep(.van-tabs__wrap) {
  background: white;
  border-radius: 8px;
  margin-bottom: 20px;
}

:deep(.van-cell-group) {
  margin-bottom: 0;
}

.quick-login {
  margin: 20px 16px;
  padding: 16px;
  background: #f7f8fa;
  border-radius: 8px;
}

.quick-login-title {
  font-size: 12px;
  color: #969799;
  margin-bottom: 12px;
  text-align: center;
}

.quick-login-buttons {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: center;
}

.quick-login-buttons .van-button {
  flex: 1;
  min-width: 70px;
}
</style>

