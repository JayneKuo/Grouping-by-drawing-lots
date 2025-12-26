// Vercel API数据存储工具 - 替代Firebase
// 使用Vercel Serverless Functions + KV存储

// API基础URL - 优先使用环境变量，否则使用当前域名
const getApiBaseUrl = () => {
  // 如果设置了环境变量，使用环境变量
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL
  }
  // 否则自动使用当前域名
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/api`
  }
  // 默认值（构建时）
  return '/api'
}

const API_BASE_URL = getApiBaseUrl()

// 同步状态管理（与firebase.js保持一致）
export const syncStatus = {
  state: 'idle', // 'idle' | 'syncing' | 'success' | 'error'
  lastSyncTime: null,
  lastError: null,
  listeners: [],
  
  setState(newState, error = null) {
    this.state = newState
    if (error) {
      this.lastError = error
    }
    if (newState === 'success') {
      this.lastSyncTime = new Date()
    }
    // 通知所有监听器
    this.listeners.forEach(listener => listener(this.state, this.lastSyncTime, this.lastError))
  },
  
  onStateChange(listener) {
    this.listeners.push(listener)
    return () => {
      const index = this.listeners.indexOf(listener)
      if (index > -1) {
        this.listeners.splice(index, 1)
      }
    }
  }
}

export const storage = {
  // 是否使用Vercel API
  useVercel: true,
  
  // 获取所有数据
  async getAll() {
    try {
      console.log('📖 开始从Vercel API读取数据...')
      
      // 先尝试从localStorage读取缓存
      const cachedData = localStorage.getItem('tennis_tournament_data')
      if (cachedData) {
        try {
          const parsed = JSON.parse(cachedData)
          console.log('📖 从localStorage读取缓存数据，比赛数:', parsed.tournaments?.length || 0)
        } catch (e) {
          // 忽略缓存解析错误
        }
      }
      
      // 从Vercel API读取
      const response = await fetch(`${API_BASE_URL}/data`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      if (!response.ok) {
        throw new Error(`HTTP错误: ${response.status}`)
      }
      
      const result = await response.json()
      
      if (result.success && result.data) {
        const data = {
          tournaments: result.data.tournaments || [],
          users: result.data.users || [],
          matches: result.data.matches || [],
          lastSync: result.data.lastSync || null
        }
        
        console.log('✅ 从Vercel API读取数据成功，比赛数:', data.tournaments.length, '用户数:', data.users.length)
        
        // 缓存到localStorage
        try {
          localStorage.setItem('tennis_tournament_data', JSON.stringify(data))
          console.log('✅ 已缓存到localStorage')
        } catch (e) {
          console.warn('⚠️ localStorage缓存失败:', e)
        }
        
        return data
      } else {
        throw new Error(result.message || '读取数据失败')
      }
    } catch (error) {
      console.error('❌ 读取Vercel API失败:', error)
      
      // 降级到localStorage
      try {
        const localData = localStorage.getItem('tennis_tournament_data')
        if (localData) {
          const parsed = JSON.parse(localData)
          console.log('📖 从localStorage读取数据（降级模式），比赛数:', parsed.tournaments?.length || 0)
          
          return {
            tournaments: parsed.tournaments || [],
            users: parsed.users || [],
            matches: parsed.matches || [],
            lastSync: parsed.lastSync || null
          }
        }
      } catch (e) {
        console.error('❌ 读取localStorage失败:', e)
      }
      
      // 返回空数据
      console.log('⚠️ 没有找到数据，返回空数据')
      return {
        tournaments: [],
        users: [],
        matches: [],
        lastSync: null
      }
    }
  },
  
  // 保存所有数据（快速响应 + 后台同步）
  async saveAll(data) {
    // 确保数据是纯对象
    const cleanData = JSON.parse(JSON.stringify({
      tournaments: data.tournaments || [],
      users: data.users || [],
      matches: data.matches || [],
      lastSync: new Date().toISOString()
    }))
    
    console.log('💾 保存数据，比赛数:', cleanData.tournaments.length)
    
    // 先快速保存到localStorage（立即响应，不阻塞）
    try {
      localStorage.setItem('tennis_tournament_data', JSON.stringify(cleanData))
      console.log('✅ 已保存到localStorage（快速响应）')
    } catch (error) {
      console.error('❌ localStorage保存失败:', error)
      return false
    }
    
    // 然后异步同步到Vercel API（后台执行，不阻塞）
    syncStatus.setState('syncing')
    
    Promise.resolve().then(async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/data`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(cleanData)
        })
        
        if (!response.ok) {
          throw new Error(`HTTP错误: ${response.status}`)
        }
        
        const result = await response.json()
        
        if (result.success) {
          console.log('✅ 数据已同步到Vercel API（后台）')
          syncStatus.setState('success')
          
          // 3秒后自动重置为idle状态
          setTimeout(() => {
            if (syncStatus.state === 'success') {
              syncStatus.setState('idle')
            }
          }, 3000)
        } else {
          throw new Error(result.message || '同步失败')
        }
      } catch (error) {
        console.error('❌ Vercel API同步失败:', error)
        syncStatus.setState('error', error.message || '同步失败')
        
        // 5秒后自动重置为idle状态
        setTimeout(() => {
          if (syncStatus.state === 'error') {
            syncStatus.setState('idle')
          }
        }, 5000)
      }
    }).catch(err => {
      console.error('Vercel API异步保存错误:', err)
      syncStatus.setState('error', err.message || '同步失败')
    })
    
    return true
  },
  
  // 手动同步数据到Vercel API
  async manualSync() {
    try {
      syncStatus.setState('syncing')
      
      // 从localStorage读取最新数据
      const localData = localStorage.getItem('tennis_tournament_data')
      if (!localData) {
        throw new Error('本地没有数据可同步')
      }
      
      const parsed = JSON.parse(localData)
      const cleanData = {
        tournaments: parsed.tournaments || [],
        users: parsed.users || [],
        matches: parsed.matches || [],
        lastSync: new Date().toISOString()
      }
      
      console.log('🔄 开始手动同步，比赛数:', cleanData.tournaments.length)
      
      // 创建超时Promise（15秒超时）
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error('同步超时，请检查网络连接'))
        }, 15000)
      })
      
      // 执行同步，带超时控制
      const response = await Promise.race([
        fetch(`${API_BASE_URL}/data`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(cleanData)
        }),
        timeoutPromise
      ])
      
      if (!response.ok) {
        throw new Error(`HTTP错误: ${response.status}`)
      }
      
      const result = await response.json()
      
      if (result.success) {
        console.log('✅ 手动同步成功')
        syncStatus.setState('success')
        
        // 触发数据更新事件
        window.dispatchEvent(new CustomEvent('data-updated', { detail: cleanData }))
        
        // 3秒后自动重置为idle状态
        setTimeout(() => {
          if (syncStatus.state === 'success') {
            syncStatus.setState('idle')
          }
        }, 3000)
        
        return true
      } else {
        throw new Error(result.message || '同步失败')
      }
    } catch (error) {
      console.error('❌ 手动同步失败:', error)
      let errorMessage = error.message || '同步失败'
      
      if (errorMessage.includes('超时') || errorMessage.includes('timeout')) {
        errorMessage = '同步超时，请检查网络连接'
      } else if (errorMessage.includes('network') || errorMessage.includes('网络')) {
        errorMessage = '网络错误，请检查网络连接'
      }
      
      syncStatus.setState('error', errorMessage)
      
      // 5秒后自动重置为idle状态
      setTimeout(() => {
        if (syncStatus.state === 'error') {
          syncStatus.setState('idle')
        }
      }, 5000)
      
      return false
    }
  },
  
  // 监听数据变化（实时同步）
  onDataChange(callback) {
    // Vercel API不支持实时监听，使用轮询方式
    let lastDataHash = null
    const pollInterval = setInterval(async () => {
      try {
        const data = await this.getAll()
        const dataHash = JSON.stringify(data)
        if (dataHash !== lastDataHash) {
          lastDataHash = dataHash
          callback(data)
          console.log('📥 收到Vercel API数据更新')
        }
      } catch (error) {
        console.error('轮询数据失败:', error)
      }
    }, 3000) // 每3秒轮询一次
    
    // 返回取消函数
    return () => {
      clearInterval(pollInterval)
    }
  },
  
  // 其他方法（保持兼容性）
  async getTournaments() {
    const data = await this.getAll()
    return {
      success: true,
      data: data.tournaments || []
    }
  },
  
  async getTournament(id) {
    const data = await this.getAll()
    const tournament = (data.tournaments || []).find(t => t.id === id)
    return {
      success: !!tournament,
      data: tournament
    }
  },
  
  async saveTournament(tournament) {
    const data = await this.getAll()
    const tournaments = data.tournaments || []
    const index = tournaments.findIndex(t => t.id === tournament.id)
    
    if (index >= 0) {
      tournaments[index] = tournament
    } else {
      tournaments.push(tournament)
    }
    
    return await this.saveAll({
      ...data,
      tournaments
    })
  }
}

