// GitHub Gist存储方案（纯前端，无需后端）
// 使用GitHub Gist存储JSON数据

// Gist配置（需要用户提供）
const GIST_ID = import.meta.env.VITE_GIST_ID || ''
const GIST_FILENAME = 'data.json'
const GIST_TOKEN = import.meta.env.VITE_GIST_TOKEN || '' // 可选，用于更新

// Gist API地址
const GIST_API_BASE = 'https://api.github.com/gists'
const GIST_RAW_BASE = 'https://gist.githubusercontent.com'

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

const DATA_KEY = 'tennis_tournament_data'
const ETAG_KEY = 'tennis_tournament_etag' // 存储ETag用于乐观锁

export const storage = {
  useGist: true,
  currentETag: null, // 当前数据的ETag
  
  // 从Gist读取数据
  async getAll() {
    try {
      console.log('📖 开始从GitHub Gist读取数据...')
      
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
      
      if (!GIST_ID) {
        console.warn('⚠️ 未配置GIST_ID，使用localStorage')
        throw new Error('GIST_NOT_CONFIGURED')
      }
      
      // 使用GitHub API读取Gist（避免CORS问题）
      // GitHub API支持CORS，且公开Gist无需Token即可读取
      const apiUrl = `${GIST_API_BASE}/${GIST_ID}`
      
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000) // 10秒超时
      
      let response
      try {
        response = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'Accept': 'application/vnd.github.v3+json'
            // 注意：GitHub API不允许自定义Cache-Control请求头，会导致CORS错误
          },
          signal: controller.signal,
          cache: 'no-cache' // 使用fetch的cache选项而不是请求头
        })
        clearTimeout(timeoutId)
      } catch (fetchError) {
        clearTimeout(timeoutId)
        if (fetchError.name === 'AbortError' || fetchError.message.includes('Failed to fetch')) {
          console.warn('⚠️ 无法访问Gist API，使用localStorage缓存数据')
          throw new Error('GIST_NOT_ACCESSIBLE')
        }
        throw fetchError
      }
      
      if (!response.ok) {
        // 如果文件不存在（404），返回空数据
        if (response.status === 404) {
          console.log('📄 Gist不存在，返回空数据')
          const emptyData = {
            tournaments: [],
            users: [],
            matches: [],
            lastSync: null
          }
          localStorage.setItem(DATA_KEY, JSON.stringify(emptyData))
          this.currentETag = null
          return emptyData
        }
        throw new Error(`HTTP错误: ${response.status} - ${response.statusText}`)
      }
      
      // 保存ETag用于乐观锁
      const etag = response.headers.get('ETag') || response.headers.get('etag')
      if (etag) {
        this.currentETag = etag.replace(/"/g, '') // 移除引号
        try {
          localStorage.setItem(ETAG_KEY, this.currentETag)
        } catch (e) {
          console.warn('⚠️ 保存ETag失败:', e)
        }
        console.log('📌 保存ETag:', this.currentETag)
      }
      
      // 从GitHub API响应中提取文件内容
      const gistResponse = await response.json()
      const fileContent = gistResponse.files?.[GIST_FILENAME]?.content
      
        if (!fileContent) {
          console.warn('⚠️ Gist文件内容为空，返回空数据')
          const emptyData = {
            tournaments: [],
            users: [],
            matches: [],
            lastSync: null,
            matchLocks: {}
          }
          localStorage.setItem(DATA_KEY, JSON.stringify(emptyData))
          return emptyData
        }
      
      // 解析JSON内容
      const data = JSON.parse(fileContent)
      
      // 确保数据结构正确
      const cleanData = {
        tournaments: data.tournaments || [],
        users: data.users || [],
        matches: data.matches || [],
        lastSync: data.lastSync || null,
        matchLocks: data.matchLocks || {} // 比赛锁定信息
      }
      
      console.log('✅ 从Gist读取数据成功，比赛数:', cleanData.tournaments.length)
      
      // 缓存到localStorage
      try {
        localStorage.setItem(DATA_KEY, JSON.stringify(cleanData))
        console.log('✅ 已缓存到localStorage')
      } catch (e) {
        console.warn('⚠️ localStorage缓存失败:', e)
      }
      
      return cleanData
    } catch (error) {
      // 如果无法访问Gist，使用localStorage
      if (error.message === 'GIST_NOT_ACCESSIBLE' || error.message === 'GIST_NOT_CONFIGURED') {
        console.warn('⚠️ 使用localStorage缓存数据')
      } else {
        console.error('❌ 读取Gist失败:', error.message || error)
      }
      
      // 降级到localStorage
      try {
        const localData = localStorage.getItem(DATA_KEY)
        if (localData) {
          const parsed = JSON.parse(localData)
          console.log('📖 从localStorage读取数据（降级模式），比赛数:', parsed.tournaments?.length || 0)
          
          // 尝试恢复ETag
          try {
            const savedETag = localStorage.getItem(ETAG_KEY)
            if (savedETag) {
              this.currentETag = savedETag
            }
          } catch (e) {
            console.warn('⚠️ 恢复ETag失败:', e)
          }
          
          return {
            tournaments: parsed.tournaments || [],
            users: parsed.users || [],
            matches: parsed.matches || [],
            lastSync: parsed.lastSync || null,
            matchLocks: parsed.matchLocks || {}
          }
        }
      } catch (e) {
        console.error('❌ 读取localStorage失败:', e)
      }
      
      // 返回空数据
      console.log('⚠️ 没有找到数据，返回空数据')
      this.currentETag = null
      return {
        tournaments: [],
        users: [],
        matches: [],
        lastSync: null,
        matchLocks: {}
      }
    }
  },
  
  // 锁定比赛（返回是否成功）
  async lockMatch(matchId, userId, userName) {
    const LOCK_TIMEOUT = 5 * 60 * 1000 // 5分钟超时
    const data = await this.getAll()
    
    // 清理过期的锁定
    const now = Date.now()
    const locks = data.matchLocks || {}
    Object.keys(locks).forEach(id => {
      if (locks[id].expiresAt < now) {
        delete locks[id]
      }
    })
    
    // 检查是否已被其他用户锁定
    const existingLock = locks[matchId]
    if (existingLock && existingLock.expiresAt > now) {
      if (existingLock.userId !== userId) {
        return {
          success: false,
          message: `该比赛正在被 ${existingLock.userName} 锁定，不能作为该比赛场次裁判`,
          lockedBy: existingLock.userName
        }
      } else {
        // 如果是自己锁定的，更新过期时间
        existingLock.expiresAt = now + LOCK_TIMEOUT
        existingLock.lockedAt = now
      }
    } else {
      // 创建新锁定
      locks[matchId] = {
        userId,
        userName,
        lockedAt: now,
        expiresAt: now + LOCK_TIMEOUT
      }
    }
    
    data.matchLocks = locks
    await this.saveAll(data)
    
    return {
      success: true,
      message: '锁定成功'
    }
  },
  
  // 释放锁定
  async unlockMatch(matchId, userId) {
    const data = await this.getAll()
    const locks = data.matchLocks || {}
    
    const lock = locks[matchId]
    if (lock && lock.userId === userId) {
      delete locks[matchId]
      data.matchLocks = locks
      await this.saveAll(data)
      return true
    }
    
    return false
  },
  
  // 刷新锁定（心跳机制）
  async refreshMatchLock(matchId, userId) {
    const LOCK_TIMEOUT = 5 * 60 * 1000 // 5分钟超时
    const data = await this.getAll()
    const locks = data.matchLocks || {}
    
    const lock = locks[matchId]
    if (lock && lock.userId === userId) {
      const now = Date.now()
      lock.expiresAt = now + LOCK_TIMEOUT
      data.matchLocks = locks
      await this.saveAll(data)
      return true
    }
    
    return false
  },
  
  // 检查比赛是否被锁定
  async checkMatchLock(matchId) {
    const data = await this.getAll()
    const locks = data.matchLocks || {}
    const now = Date.now()
    
    const lock = locks[matchId]
    if (lock && lock.expiresAt > now) {
      return {
        isLocked: true,
        lockedBy: lock.userName,
        userId: lock.userId,
        expiresAt: lock.expiresAt
      }
    }
    
    // 清理过期锁定
    if (lock && lock.expiresAt <= now) {
      delete locks[matchId]
      data.matchLocks = locks
      await this.saveAll(data)
    }
    
    return {
      isLocked: false
    }
  },
  
  // 初始化：从localStorage恢复ETag
  init() {
    try {
      const savedETag = localStorage.getItem(ETAG_KEY)
      if (savedETag) {
        this.currentETag = savedETag
        console.log('📌 恢复ETag:', this.currentETag)
      }
    } catch (e) {
      console.warn('⚠️ 初始化ETag失败:', e)
    }
  },
  
    // 合并数据（智能合并策略）
  mergeData(oldData, newData) {
    const merged = {
      tournaments: [...(oldData.tournaments || [])],
      users: [...(oldData.users || [])],
      matches: [...(oldData.matches || [])],
      lastSync: newData.lastSync || oldData.lastSync,
      matchLocks: { ...(oldData.matchLocks || {}) } // 合并锁定信息
    }
    
    // 合并matchLocks：保留最新的锁定信息
    if (newData.matchLocks) {
      Object.keys(newData.matchLocks).forEach(matchId => {
        const newLock = newData.matchLocks[matchId]
        const oldLock = merged.matchLocks[matchId]
        
        // 如果新锁定的过期时间更晚，使用新的
        if (!oldLock || newLock.expiresAt > oldLock.expiresAt) {
          merged.matchLocks[matchId] = newLock
        }
      })
    }
    
    // 合并tournaments：以ID为准，新数据覆盖旧数据
    if (newData.tournaments) {
      newData.tournaments.forEach(newTournament => {
        const index = merged.tournaments.findIndex(t => String(t.id) === String(newTournament.id))
        if (index >= 0) {
          // 合并tournament数据：保留旧数据的matches，但更新其他字段
          const oldTournament = merged.tournaments[index]
          merged.tournaments[index] = {
            ...oldTournament,
            ...newTournament,
            // 智能合并matches：保留双方都有的match，新数据优先
            matches: this.mergeMatches(oldTournament.matches || [], newTournament.matches || [])
          }
        } else {
          merged.tournaments.push(newTournament)
        }
      })
    }
    
    // 合并users
    if (newData.users) {
      newData.users.forEach(newUser => {
        const index = merged.users.findIndex(u => String(u.id) === String(newUser.id))
        if (index >= 0) {
          merged.users[index] = { ...merged.users[index], ...newUser }
        } else {
          merged.users.push(newUser)
        }
      })
    }
    
    // 合并matches：以ID为准，新数据覆盖旧数据
    if (newData.matches) {
      newData.matches.forEach(newMatch => {
        const index = merged.matches.findIndex(m => String(m.id) === String(newMatch.id))
        if (index >= 0) {
          merged.matches[index] = newMatch // 新数据完全覆盖
        } else {
          merged.matches.push(newMatch)
        }
      })
    }
    
    return merged
  },
  
  // 合并matches数组
  mergeMatches(oldMatches, newMatches) {
    const merged = [...oldMatches]
    newMatches.forEach(newMatch => {
      const index = merged.findIndex(m => String(m.id) === String(newMatch.id))
      if (index >= 0) {
        merged[index] = newMatch // 新数据完全覆盖
      } else {
        merged.push(newMatch)
      }
    })
    return merged
  },
  
  // 保存数据到Gist（带乐观锁和冲突解决）
  async saveAll(data, retryCount = 0) {
    const MAX_RETRIES = 3
    
    // 确保数据是纯对象
    const cleanData = JSON.parse(JSON.stringify({
      tournaments: data.tournaments || [],
      users: data.users || [],
      matches: data.matches || [],
      lastSync: new Date().toISOString(),
      matchLocks: data.matchLocks || {} // 保留锁定信息
    }))
    
    console.log('💾 保存数据，比赛数:', cleanData.tournaments.length, '重试次数:', retryCount)
    
    // 先快速保存到localStorage（立即响应，不阻塞）
    try {
      localStorage.setItem(DATA_KEY, JSON.stringify(cleanData))
      console.log('✅ 已保存到localStorage（快速响应）')
    } catch (error) {
      console.error('❌ localStorage保存失败:', error)
      return false
    }
    
    // 如果没有配置Gist，只保存到localStorage
    if (!GIST_ID) {
      console.warn('⚠️ 未配置GIST_ID，仅保存到localStorage')
      return true
    }
    
    // 如果没有Token，无法更新Gist（只读模式）
    if (!GIST_TOKEN) {
      console.warn('⚠️ 未配置GIST_TOKEN，无法更新Gist，仅保存到localStorage')
      console.warn('💡 如需多用户同步，请配置GIST_TOKEN')
      return true
    }
    
    // 然后异步同步到Gist（后台执行，不阻塞）
    syncStatus.setState('syncing')
    
    Promise.resolve().then(async () => {
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 10000) // 10秒超时
        
        // 获取当前ETag（用于乐观锁）
        let currentETag = this.currentETag
        if (!currentETag) {
          try {
            currentETag = localStorage.getItem(ETAG_KEY)
          } catch (e) {
            console.warn('⚠️ 读取ETag失败:', e)
          }
        }
        
        // 如果有ETag，先检查数据是否已被其他用户修改（实现乐观锁）
        if (currentETag) {
          console.log('🔒 检查数据冲突，当前ETag:', currentETag)
          try {
            const checkResponse = await fetch(`${GIST_API_BASE}/${GIST_ID}`, {
              method: 'GET',
              headers: {
                'Accept': 'application/vnd.github.v3+json'
              },
              signal: controller.signal,
              cache: 'no-cache'
            })
            
            if (checkResponse.ok) {
              const latestETag = checkResponse.headers.get('ETag')?.replace(/"/g, '') || 
                                 checkResponse.headers.get('etag')?.replace(/"/g, '')
              
              if (latestETag && latestETag !== currentETag) {
                console.warn('⚠️ 检测到数据冲突（ETag已变化），尝试合并数据...')
                console.log('   旧ETag:', currentETag, '新ETag:', latestETag)
                
                if (retryCount < MAX_RETRIES) {
                  // 重新读取最新数据
                  const latestData = await this.getAll()
                  
                  // 合并数据
                  const mergedData = this.mergeData(latestData, cleanData)
                  
                  // 更新ETag
                  this.currentETag = latestETag
                  
                  // 重试保存（递归调用）
                  console.log('🔄 重试保存（合并后数据）...')
                  return await this.saveAll(mergedData, retryCount + 1)
                } else {
                  throw new Error('数据冲突：多次重试后仍无法保存，请刷新页面后重试')
                }
              }
            }
          } catch (checkError) {
            console.warn('⚠️ 检查ETag失败，继续保存:', checkError)
            // 继续执行保存操作
          }
        }
        
        // 使用GitHub API更新Gist
        const gistData = {
          files: {
            [GIST_FILENAME]: {
              content: JSON.stringify(cleanData, null, 2)
            }
          }
        }
        
        const headers = {
          'Authorization': `token ${GIST_TOKEN}`,
          'Content-Type': 'application/json',
          'Accept': 'application/vnd.github.v3+json'
        }
        
        let response
        try {
          response = await fetch(`${GIST_API_BASE}/${GIST_ID}`, {
            method: 'PATCH',
            headers,
            body: JSON.stringify(gistData),
            signal: controller.signal
          })
          clearTimeout(timeoutId)
        } catch (fetchError) {
          clearTimeout(timeoutId)
          if (fetchError.name === 'AbortError' || fetchError.message.includes('Failed to fetch')) {
            console.warn('⚠️ 无法更新Gist，仅保存到localStorage')
            syncStatus.setState('idle')
            return
          }
          throw fetchError
        }
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.message || `HTTP错误: ${response.status}`)
        }
        
        // 更新ETag
        const etag = response.headers.get('ETag') || response.headers.get('etag')
        if (etag) {
          this.currentETag = etag.replace(/"/g, '')
          try {
            localStorage.setItem(ETAG_KEY, this.currentETag)
          } catch (e) {
            console.warn('⚠️ 保存ETag失败:', e)
          }
          console.log('✅ 更新ETag:', this.currentETag)
        }
        
        console.log('✅ 数据已同步到Gist（后台）')
        syncStatus.setState('success')
        
        // 触发数据更新事件，通知其他用户
        window.dispatchEvent(new CustomEvent('data-updated', { detail: cleanData }))
        
        // 3秒后自动重置为idle状态
        setTimeout(() => {
          if (syncStatus.state === 'success') {
            syncStatus.setState('idle')
          }
        }, 3000)
      } catch (error) {
        console.error('❌ Gist同步失败:', error)
        syncStatus.setState('error', error.message || '同步失败')
        
        // 5秒后自动重置为idle状态
        setTimeout(() => {
          if (syncStatus.state === 'error') {
            syncStatus.setState('idle')
          }
        }, 5000)
      }
    }).catch(err => {
      console.error('Gist异步保存错误:', err)
      syncStatus.setState('error', err.message || '同步失败')
    })
    
    return true
  },
  
  // 手动同步数据
  async manualSync() {
    if (!GIST_ID || !GIST_TOKEN) {
      throw new Error('未配置GIST_ID或GIST_TOKEN')
    }
    
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
      const gistData = {
        files: {
          [GIST_FILENAME]: {
            content: JSON.stringify(cleanData, null, 2)
          }
        }
      }
      
      const response = await Promise.race([
        fetch(`${GIST_API_BASE}/${GIST_ID}`, {
          method: 'PATCH',
          headers: {
            'Authorization': `token ${GIST_TOKEN}`,
            'Content-Type': 'application/json',
            'Accept': 'application/vnd.github.v3+json'
          },
          body: JSON.stringify(gistData)
        }),
        timeoutPromise
      ])
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `HTTP错误: ${response.status}`)
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
    if (!GIST_ID) {
      console.warn('⚠️ 未配置GIST_ID，无法轮询数据')
      return () => {}
    }
    
    let lastDataHash = null
    const pollInterval = setInterval(async () => {
      try {
        const data = await this.getAll()
        const dataHash = JSON.stringify(data)
        if (dataHash !== lastDataHash) {
          lastDataHash = dataHash
          callback(data)
          console.log('📥 收到Gist数据更新')
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
    if (!tournament) {
      console.error('❌ saveTournament: 比赛对象为空')
      return false
    }
    
    if (!tournament.id && tournament.id !== 0) {
      console.error('❌ saveTournament: 比赛ID无效', {
        id: tournament.id,
        idType: typeof tournament.id,
        tournament: tournament
      })
      return false
    }
    
    const data = await this.getAll()
    const tournaments = data.tournaments || []
    
    // 统一ID类型进行比较
    const searchId = String(tournament.id)
    const index = tournaments.findIndex(t => {
      const tId = String(t.id)
      const match = tId === searchId
      if (!match && Math.abs(Number(tId) - Number(searchId)) < 0.001) {
        // 数字类型可能因为精度问题导致字符串比较失败，但数值相等
        console.warn('⚠️ ID数值相等但字符串不同:', tId, 'vs', searchId)
      }
      return match
    })
    
    console.log('💾 saveTournament: 比赛ID:', tournament.id, '类型:', typeof tournament.id, '找到索引:', index)
    console.log('💾 saveTournament: 当前比赛列表:', tournaments.map(t => ({ id: t.id, name: t.name, idType: typeof t.id })))
    
    if (index >= 0) {
      // 更新现有比赛
      tournaments[index] = tournament
      console.log('✅ 更新现有比赛:', tournament.name, 'ID:', tournament.id)
    } else {
      // 如果找不到，警告并检查是否应该创建新比赛
      console.warn('⚠️ saveTournament: 找不到匹配的比赛，ID:', tournament.id)
      console.warn('⚠️ 当前比赛列表ID:', tournaments.map(t => ({ id: t.id, name: t.name })))
      
      // 检查是否是因为ID类型不匹配
      const numericMatch = tournaments.findIndex(t => {
        const tIdNum = Number(t.id)
        const searchIdNum = Number(tournament.id)
        return !isNaN(tIdNum) && !isNaN(searchIdNum) && tIdNum === searchIdNum
      })
      
      if (numericMatch >= 0) {
        console.log('✅ 通过数值匹配找到比赛，索引:', numericMatch)
        tournaments[numericMatch] = tournament
      } else {
        // 只有在明确是新比赛时才添加（这里不应该发生，因为是从现有比赛更新的）
        console.error('❌ saveTournament: 无法找到匹配的比赛，这可能是数据不一致问题')
        console.error('❌ 比赛数据:', tournament)
        // 不创建新比赛，返回false
        return false
      }
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
  },
  
  async deleteTournament(id) {
    if (!id && id !== 0) {
      console.error('❌ deleteTournament: ID无效', id)
      return {
        success: false,
        message: '比赛ID无效'
      }
    }
    
    const data = await this.getAll()
    const tournaments = data.tournaments || []
    
    // 统一ID类型进行比较
    const searchId = String(id)
    const index = tournaments.findIndex(t => {
      const tId = String(t.id)
      return tId === searchId
    })
    
    console.log('🗑️ deleteTournament: 比赛ID:', id, '找到索引:', index)
    
    if (index >= 0) {
      // 删除比赛
      const deletedTournament = tournaments[index]
      tournaments.splice(index, 1)
      console.log('✅ 删除比赛:', deletedTournament.name, 'ID:', deletedTournament.id)
      
      // 同时删除相关的比赛记录（matches）
      if (data.matches && Array.isArray(data.matches)) {
        const initialMatchCount = data.matches.length
        data.matches = data.matches.filter(m => {
          const matchTournamentId = String(m.tournament_id || m.tournamentId)
          return matchTournamentId !== searchId
        })
        const deletedMatchCount = initialMatchCount - data.matches.length
        if (deletedMatchCount > 0) {
          console.log('✅ 同时删除相关比赛记录:', deletedMatchCount, '条')
        }
      }
      
      const saveResult = await this.saveAll({
        ...data,
        tournaments
      })
      
      return {
        success: saveResult,
        message: saveResult ? '删除成功' : '删除失败'
      }
    } else {
      console.warn('⚠️ deleteTournament: 找不到比赛，ID:', id)
      return {
        success: false,
        message: '比赛不存在'
      }
    }
  },
  
  // 获取存储大小（KB）
  getStorageSize() {
    try {
      const data = localStorage.getItem(DATA_KEY)
      if (!data) return 0
      // 计算JSON字符串的大小（字节），转换为KB
      const sizeInBytes = new Blob([data]).size
      return Math.round(sizeInBytes / 1024)
    } catch (error) {
      console.error('计算存储大小失败:', error)
      return 0
    }
  },
  
  // 导出数据
  exportData() {
    try {
      const data = localStorage.getItem(DATA_KEY)
      if (!data) {
        throw new Error('没有数据可导出')
      }
      
      const blob = new Blob([data], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `tennis-tournament-data-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('导出数据失败:', error)
      throw error
    }
  },
  
  // 导入数据
  async importData(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = async (e) => {
        try {
          const content = e.target.result
          const data = JSON.parse(content)
          
          // 验证数据结构
          if (!data.tournaments || !Array.isArray(data.tournaments)) {
            throw new Error('数据格式不正确')
          }
          
          // 保存到localStorage
          localStorage.setItem(DATA_KEY, JSON.stringify({
            tournaments: data.tournaments || [],
            users: data.users || [],
            matches: data.matches || [],
            lastSync: null
          }))
          
          // 同步到Gist
          await this.saveAll({
            tournaments: data.tournaments || [],
            users: data.users || [],
            matches: data.matches || []
          })
          
          resolve()
        } catch (error) {
          reject(error)
        }
      }
      reader.onerror = () => reject(new Error('文件读取失败'))
      reader.readAsText(file)
    })
  },
  
  // 清空所有数据
  clearAll() {
    try {
      localStorage.removeItem(DATA_KEY)
      localStorage.removeItem(ETAG_KEY)
      this.currentETag = null
      // 也尝试清空Gist（如果有Token）
      if (GIST_ID && GIST_TOKEN) {
        this.saveAll({
          tournaments: [],
          users: [],
          matches: []
        }).catch(err => {
          console.warn('清空Gist失败:', err)
        })
      }
    } catch (error) {
      console.error('清空数据失败:', error)
      throw error
    }
  }
}

// 初始化：恢复ETag
storage.init()

