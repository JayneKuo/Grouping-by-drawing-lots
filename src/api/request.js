import axios from 'axios'
import { showFailToast } from 'vant'
import { useUserStore } from '../store/user'

// 自动检测环境：Vercel部署使用绝对路径，本地开发使用相对路径
const isVercel = window.location.hostname.includes('vercel.app') || 
                 window.location.hostname.includes('localhost') === false;

const request = axios.create({
  baseURL: isVercel ? '/api' : '/api', // Vercel会自动处理/api路由
  timeout: 10000
})

// 请求拦截器
request.interceptors.request.use(
  config => {
    const userStore = useUserStore()
    if (userStore.token) {
      config.headers.Authorization = `Bearer ${userStore.token}`
    }
    // 添加请求日志
    console.log('📤 [请求]', config.method?.toUpperCase(), config.url, config.data)
    return config
  },
  error => {
    return Promise.reject(error)
  }
)

// 响应拦截器
request.interceptors.response.use(
  response => {
    return response.data
  },
  error => {
    console.error('API请求错误:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    })
    
    if (error.response) {
      const { status, data } = error.response
      if (status === 401) {
        const userStore = useUserStore()
        userStore.logout()
        showFailToast('登录已过期，请重新登录')
        window.location.href = '/login'
      } else if (status === 404) {
        showFailToast(`请求的资源不存在 (404): ${error.config?.url}`)
      } else {
        showFailToast(data?.message || `请求失败 (${status})`)
      }
    } else {
      showFailToast('网络错误，请检查网络连接')
    }
    return Promise.reject(error)
  }
)

export default request

