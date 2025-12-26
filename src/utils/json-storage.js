// 简单JSON文件存储方案
// 使用Vercel API存储JSON数据

// API基础URL - 优先使用环境变量，否则使用当前域名
const getApiBaseUrl = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL
  }
  if (import.meta.env.DEV) {
    const vercelUrl = import.meta.env.VITE_VERCEL_URL
    if (vercelUrl) {
      return `${vercelUrl}/api`
    }
    return '/api'
  }
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/api`
  }
  return '/api'
}

const API_BASE_URL = getApiBaseUrl()
const DATA_FILE_URL = `${API_BASE_URL}/data`
const DATA_KEY = 'tennis_tournament_data'

// 同步状态管理
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
  useJsonFile: true,
  
  // 从JSON文件读取数据
  async getAll() {
    try {
      console.log('📖 开始从JSON文件读取数据...')
      
      // 先尝试从localStorage读取缓存
      const cachedData = localStorage.getItem(DATA_KEY)
      if (cachedData) {
        try {
          const parsed = JSON.parse(cachedData)
          console.log('📖 从localStorage读取缓存数据，比赛数:', parsed.tournaments?.length || 0)
        } catch (e) {
          // 忽略缓存解析错误
        }
      }
      
      // 从JSON文件读取（带超时处理）
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000) // 5秒超时
      
      let response
      try {
        response = await fetch(DATA_FILE_URL, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache'
          },
          signal: controller.signal
        })
        clearTimeout(timeoutId)
      } catch (fetchError) {
        clearTimeout(timeoutId)
        if (fetchError.name === 'AbortError' || fetchError.message.includes('Failed to fetch')) {
          console.warn('⚠️ 无法访问JSON文件，使用localStorage缓存数据')
          throw new Error('FILE_NOT_ACCESSIBLE')
        }
        throw fetchError
      }
      
      if (!response.ok) {
        // 如果文件不存在（404），返回空数据
        if (response.status === 404) {
          console.log('📄 JSON文件不存在，返回空数据')
          const emptyData = {
            tournaments: [],
            users: [],
            matches: [],
            lastSync: null
          }
          localStorage.setItem(DATA_KEY, JSON.stringify(emptyData))
          return emptyData
        }
        throw new Error(`HTTP错误: ${response.status}`)
      }
      
      const data = await response.json()
      
      // 确保数据结构正确
      const cleanData = {
        tournaments: data.tournaments || [],
        users: data.users || [],
        matches: data.matches || [],
        lastSync: data.lastSync || null
      }
      
      console.log('✅ 从JSON文件读取数据成功，比赛数:', cleanData.tournaments.length)
      
      // 缓存到localStorage
      try {
        localStorage.setItem(DATA_KEY, JSON.stringify(cleanData))
        console.log('✅ 已缓存到localStorage')
      } catch (e) {
        console.warn('⚠️ localStorage缓存失败:', e)
      }
      
      return cleanData
    } catch (error) {
      // 如果无法访问文件，使用localStorage
      if (error.message === 'FILE_NOT_ACCESSIBLE') {
        console.warn('⚠️ 使用localStorage缓存数据')
      } else {
        console.error('❌ 读取JSON文件失败:', error.message || error)
      }
      
      // 降级到localStorage
      try {
        const localData = localStorage.getItem(DATA_KEY)
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
  
  // 保存数据到JSON文件
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
      localStorage.setItem(DATA_KEY, JSON.stringify(cleanData))
      console.log('✅ 已保存到localStorage（快速响应）')
    } catch (error) {
      console.error('❌ localStorage保存失败:', error)
      return false
    }
    
    // 然后异步同步到JSON文件（后台执行，不阻塞）
    syncStatus.setState('syncing')
    
    Promise.resolve().then(async () => {
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 10000) // 10秒超时
        
        let response
        try {
          // 使用POST方法上传JSON数据到Vercel API
          response = await fetch(DATA_FILE_URL, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(cleanData),
            signal: controller.signal
          })
          clearTimeout(timeoutId)
        } catch (fetchError) {
          clearTimeout(timeoutId)
          if (fetchError.name === 'AbortError' || fetchError.message.includes('Failed to fetch')) {
            console.warn('⚠️ 无法上传JSON文件，仅保存到localStorage')
            syncStatus.setState('idle')
            return
          }
          throw fetchError
        }
        
        if (!response.ok) {
          throw new Error(`HTTP错误: ${response.status}`)
        }
        
        console.log('✅ 数据已同步到JSON文件（后台）')
        syncStatus.setState('success')
        
        // 3秒后自动重置为idle状态
        setTimeout(() => {
          if (syncStatus.state === 'success') {
            syncStatus.setState('idle')
          }
        }, 3000)
      } catch (error) {
        console.error('❌ JSON文件同步失败:', error)
        syncStatus.setState('error', error.message || '同步失败')
        
        // 5秒后自动重置为idle状态
        setTimeout(() => {
          if (syncStatus.state === 'error') {
            syncStatus.setState('idle')
          }
        }, 5000)
      }
    }).catch(err => {
      console.error('JSON文件异步保存错误:', err)
      syncStatus.setState('error', err.message || '同步失败')
    })
    
    return true
  },
  
  // 手动同步数据
  async manualSync() {
    try {
      syncStatus.setState('syncing')
      
      // 从localStorage读取最新数据
      const localData = localStorage.getItem(DATA_KEY)
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
        fetch(DATA_FILE_URL, {
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
    } catch (error) {
      console.error('❌ 手动同步失败:', error)
      let errorMessage = error.message || '同步失败'
      
      if (errorMessage.includes('超时') || errorMessage.includes('timeout')) {
        errorMessage = '同步超时，请检查网络连接'
      }
      
      syncStatus.setState('error', errorMessage)
      
      setTimeout(() => {
        if (syncStatus.state === 'error') {
          syncStatus.setState('idle')
        }
      }, 5000)
      
      return false
    }
  },
  
  // 监听数据变化（轮询方式）
  onDataChange(callback) {
    let lastDataHash = null
    const pollInterval = setInterval(async () => {
      try {
        const data = await this.getAll()
        const dataHash = JSON.stringify(data)
        if (dataHash !== lastDataHash) {
          lastDataHash = dataHash
          callback(data)
          console.log('📥 收到JSON文件数据更新')
        }
      } catch (error) {
        console.error('轮询数据失败:', error)
      }
    }, 5000) // 每5秒轮询一次
    
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
    const tournaments = data.tournaments || []
    
    const tournament = tournaments.find(t => {
      const tId = String(t.id)
      const searchId = String(id)
      return tId === searchId
    })
    
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
  },

  async saveTournaments(tournaments) {
    const data = await this.getAll()
    data.tournaments = tournaments
    return await this.saveAll(data)
  }
}

