import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { login, register } from '../api/auth'
import { showSuccessToast, showFailToast } from 'vant'

export const useUserStore = defineStore('user', () => {
  const token = ref(localStorage.getItem('token') || '')
  const user = ref(JSON.parse(localStorage.getItem('user') || 'null'))
  
  const isLoggedIn = computed(() => !!token.value && !!user.value)
  
  async function handleLogin(username, password) {
    try {
      const response = await login(username, password)
      if (response.success) {
        token.value = response.data.token
        user.value = response.data.user
        localStorage.setItem('token', response.data.token)
        localStorage.setItem('user', JSON.stringify(response.data.user))
        showSuccessToast('登录成功')
        return true
      } else {
        showFailToast(response.message || '登录失败')
        return false
      }
    } catch (error) {
      showFailToast('登录失败：' + error.message)
      return false
    }
  }
  
  async function handleRegister(username, password, confirmPassword) {
    if (password !== confirmPassword) {
      showFailToast('两次密码不一致')
      return false
    }
    
    try {
      const response = await register(username, password)
      if (response.success) {
        showSuccessToast('注册成功，请登录')
        return true
      } else {
        showFailToast(response.message || '注册失败')
        return false
      }
    } catch (error) {
      showFailToast('注册失败：' + error.message)
      return false
    }
  }
  
  function logout() {
    token.value = ''
    user.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }
  
  function restoreLoginState() {
    const savedToken = localStorage.getItem('token')
    const savedUser = localStorage.getItem('user')
    if (savedToken && savedUser) {
      token.value = savedToken
      user.value = JSON.parse(savedUser)
    }
  }
  
  return {
    token,
    user,
    isLoggedIn,
    handleLogin,
    handleRegister,
    logout,
    restoreLoginState
  }
})

