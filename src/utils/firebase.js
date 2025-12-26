// Firebase配置 - 自动同步数据
import { initializeApp } from 'firebase/app'
import { getFirestore, doc, getDoc, setDoc, onSnapshot, collection, query, orderBy } from 'firebase/firestore'

// Firebase配置
const firebaseConfig = {
  apiKey: "AIzaSyBUUrAAe-vN08uDMe1nOFW-R0Z882uDYXI",
  authDomain: "tennis-tournament-f2e6e.firebaseapp.com",
  projectId: "tennis-tournament-f2e6e",
  storageBucket: "tennis-tournament-f2e6e.firebasestorage.app",
  messagingSenderId: "716490471438",
  appId: "1:716490471438:web:24a8fba20520ea98cea45f",
  measurementId: "G-Q9T1414DG2"
}

// 初始化Firebase
let app, db
try {
  app = initializeApp(firebaseConfig)
  db = getFirestore(app)
} catch (error) {
  console.warn('Firebase未配置，使用localStorage模式')
}

// 数据存储工具 - 自动同步到Firebase
const STORAGE_KEY = 'tennis_tournament_data'
const FIREBASE_COLLECTION = 'tennis_tournaments'

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
  // 是否使用Firebase
  useFirebase: !!db,

  // 获取所有数据（优先Firebase，确保多用户同步）
  async getAll() {
    // 优先从Firebase读取（确保多用户数据同步）
    if (this.useFirebase && db) {
      try {
        console.log('📖 开始从Firebase读取数据...')
        const docRef = doc(db, FIREBASE_COLLECTION, 'main')
        const docSnap = await getDoc(docRef)
        if (docSnap.exists()) {
          const firebaseData = docSnap.data()
          const data = {
            tournaments: firebaseData.tournaments || [],
            users: firebaseData.users || [],
            matches: firebaseData.matches || [],
            lastSync: firebaseData.lastSync || null
          }
          console.log('✅ 从Firebase读取数据成功，比赛数:', data.tournaments.length, '用户数:', data.users.length)
          // 同步到localStorage作为缓存
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
            console.log('✅ 已缓存到localStorage')
          } catch (e) {
            console.warn('⚠️ localStorage缓存失败:', e)
          }
          return data
        } else {
          console.log('⚠️ Firebase中没有数据，尝试从localStorage读取')
        }
      } catch (error) {
        console.error('❌ 读取Firebase失败:', error)
        console.error('错误详情:', {
          code: error.code,
          message: error.message,
          stack: error.stack
        })
        // Firebase失败时，降级到localStorage
      }
    }
    
    // Firebase不可用时，从localStorage读取（降级方案）
    try {
      const localData = localStorage.getItem(STORAGE_KEY)
      if (localData) {
        const parsed = JSON.parse(localData)
        console.log('📖 从localStorage读取数据（降级模式），比赛数:', parsed.tournaments?.length || 0)
        
        const data = {
          tournaments: parsed.tournaments || [],
          users: parsed.users || [],
          matches: parsed.matches || [],
          lastSync: parsed.lastSync || null
        }
        return data
      }
    } catch (error) {
      console.error('❌ 读取localStorage失败:', error)
    }
    
    // 返回空数据
    console.log('⚠️ 没有找到数据，返回空数据')
    return {
      tournaments: [],
      users: [],
      matches: [],
      lastSync: null
    }
  },

  // 保存所有数据（快速响应 + 后台同步）
  async saveAll(data) {
    // 确保数据是纯对象，移除任何Promise或函数
    const cleanData = JSON.parse(JSON.stringify({
      tournaments: data.tournaments || [],
      users: data.users || [],
      matches: data.matches || [],
      lastSync: new Date().toISOString()
    }))
    
    console.log('💾 保存数据，比赛数:', cleanData.tournaments.length)
    
    // 先快速保存到localStorage（立即响应，不阻塞）
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cleanData))
      console.log('✅ 已保存到localStorage（快速响应）')
    } catch (error) {
      console.error('❌ localStorage保存失败:', error)
      return false
    }
    
    // 然后异步同步到Firebase（后台执行，不阻塞）
    if (this.useFirebase && db) {
      // 设置同步状态为"同步中"
      syncStatus.setState('syncing')
      
      // 使用Promise，但不等待（异步执行，不阻塞）
      Promise.resolve().then(async () => {
        try {
          const docRef = doc(db, FIREBASE_COLLECTION, 'main')
          
          // 创建超时Promise（20秒超时，后台同步可以稍长）
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => {
              reject(new Error('同步超时'))
            }, 20000)
          })
          
          // 执行同步，带超时控制
          await Promise.race([
            setDoc(docRef, cleanData, { merge: false }),
            timeoutPromise
          ])
          
          console.log('✅ 数据已同步到Firebase（后台）')
          // 设置同步状态为"成功"
          syncStatus.setState('success')
          
          // 3秒后自动重置为idle状态
          setTimeout(() => {
            if (syncStatus.state === 'success') {
              syncStatus.setState('idle')
            }
          }, 3000)
        } catch (error) {
          console.error('❌ Firebase同步失败:', error)
          let errorMessage = error.message || '同步失败'
          
          // 静默处理超时错误（后台同步失败不影响用户体验）
          if (errorMessage.includes('超时') || errorMessage.includes('timeout')) {
            console.warn('⚠️ 后台同步超时，数据已保存到本地')
            // 不显示错误状态，因为数据已保存到本地
            return
          }
          
          // 设置同步状态为"失败"
          syncStatus.setState('error', errorMessage)
          
          // 5秒后自动重置为idle状态
          setTimeout(() => {
            if (syncStatus.state === 'error') {
              syncStatus.setState('idle')
            }
          }, 5000)
        }
      }).catch(err => {
        console.error('Firebase异步保存错误:', err)
        // 静默处理，不显示错误状态
      })
    } else {
      // 不使用Firebase时，标记为成功（因为localStorage已保存）
      syncStatus.setState('success')
      setTimeout(() => {
        syncStatus.setState('idle')
      }, 2000)
    }
    
    return true
  },

  // 手动同步数据到Firebase（主动触发，带超时和重试）
  async manualSync() {
    if (!this.useFirebase || !db) {
      console.log('⚠️ Firebase未配置，无法同步')
      syncStatus.setState('error', 'Firebase未配置')
      setTimeout(() => {
        syncStatus.setState('idle')
      }, 3000)
      return false
    }
    
    try {
      // 设置同步状态为"同步中"
      syncStatus.setState('syncing')
      
      // 从localStorage读取最新数据
      const localData = localStorage.getItem(STORAGE_KEY)
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
      
      // 同步到Firebase（带超时控制）
      const docRef = doc(db, FIREBASE_COLLECTION, 'main')
      
      // 创建超时Promise（15秒超时）
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error('同步超时，请检查网络连接或使用VPN'))
        }, 15000)
      })
      
      // 执行同步，带超时控制
      await Promise.race([
        setDoc(docRef, cleanData, { merge: false }),
        timeoutPromise
      ])
      
      console.log('✅ 手动同步成功')
      syncStatus.setState('success')
      
      // 触发数据更新事件，通知其他页面刷新
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
      
      // 根据错误类型提供更友好的提示
      if (errorMessage.includes('超时') || errorMessage.includes('timeout')) {
        errorMessage = '同步超时，请检查网络连接。如果在中国大陆，可能需要使用VPN'
      } else if (errorMessage.includes('permission') || errorMessage.includes('权限')) {
        errorMessage = '权限不足，请检查Firebase权限配置'
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
    if (this.useFirebase && db) {
      try {
        const docRef = doc(db, FIREBASE_COLLECTION, 'main')
        let lastDataHash = null
        
        const unsubscribe = onSnapshot(docRef, (docSnap) => {
          if (docSnap.exists()) {
            const firebaseData = docSnap.data()
            const data = {
              tournaments: firebaseData.tournaments || [],
              users: firebaseData.users || [],
              matches: firebaseData.matches || [],
              lastSync: firebaseData.lastSync || null
            }
            
            // 计算数据哈希，避免重复触发
            const dataHash = JSON.stringify(data)
            
            // 只有数据真正变化时才触发回调
            if (dataHash !== lastDataHash) {
              lastDataHash = dataHash
              // 同步到localStorage
              try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
              } catch (e) {
                console.warn('localStorage同步失败:', e)
              }
              callback(data)
              console.log('📥 收到Firebase数据更新，比赛数:', data.tournaments.length)
            }
          } else {
            console.log('📥 Firebase文档不存在')
          }
        }, (error) => {
          // 离线错误不显示
          if (error.code !== 'unavailable' && !error.message.includes('offline')) {
            console.error('Firebase监听失败:', error)
          } else {
            console.log('📡 Firebase离线，使用本地缓存')
          }
        })
        
        return unsubscribe
      } catch (error) {
        console.error('Firebase监听设置失败:', error)
      }
    }
    return null
  },

  // 获取比赛列表
  async getTournaments() {
    const data = await this.getAll()
    const tournaments = data.tournaments || []
    console.log('📋 获取比赛列表，数量:', tournaments.length)
    if (tournaments.length > 0) {
      console.log('📋 比赛列表:', tournaments.map(t => ({ id: t.id, name: t.name })))
    }
    return tournaments
  },

  // 保存比赛列表
  async saveTournaments(tournaments) {
    console.log('💾 保存比赛列表，数量:', tournaments.length)
    const data = await this.getAll()
    console.log('📋 当前数据中的比赛数:', data.tournaments?.length || 0)
    data.tournaments = tournaments
    console.log('✅ 更新后的比赛数:', data.tournaments.length)
    const result = await this.saveAll(data)
    console.log('💾 保存结果:', result)
    
    // 验证保存
    const verifyData = await this.getAll()
    console.log('🔍 验证保存，当前比赛数:', verifyData.tournaments?.length || 0)
    
    return result
  },

  // 获取单个比赛
  async getTournament(id) {
    const tournaments = await this.getTournaments()
    return tournaments.find(t => t.id === parseInt(id))
  },

  // 保存/更新比赛
  async saveTournament(tournament) {
    const tournaments = await this.getTournaments()
    const index = tournaments.findIndex(t => t.id === tournament.id)
    
    if (index >= 0) {
      tournaments[index] = tournament
    } else {
      tournaments.push(tournament)
    }
    
    return await this.saveTournaments(tournaments)
  },

  // 删除比赛
  async deleteTournament(id) {
    const tournaments = await this.getTournaments()
    const filtered = tournaments.filter(t => t.id !== parseInt(id))
    return await this.saveTournaments(filtered)
  },

  // 导出数据（保留功能，用于备份）
  exportData() {
    return new Promise(async (resolve, reject) => {
      try {
        const data = await this.getAll()
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `tennis-tournament-${new Date().toISOString().split('T')[0]}.json`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
        resolve(true)
      } catch (error) {
        reject(error)
      }
    })
  },

  // 导入数据（保留功能，用于恢复）
  importData(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = async (e) => {
        try {
          const data = JSON.parse(e.target.result)
          if (data.tournaments && Array.isArray(data.tournaments)) {
            await this.saveAll(data)
            resolve(true)
          } else {
            reject(new Error('数据格式不正确'))
          }
        } catch (error) {
          reject(new Error('文件解析失败：' + error.message))
        }
      }
      reader.onerror = () => reject(new Error('文件读取失败'))
      reader.readAsText(file)
    })
  },

  // 清空所有数据
  async clearAll() {
    if (this.useFirebase && db) {
      try {
        const docRef = doc(db, FIREBASE_COLLECTION, 'main')
        await setDoc(docRef, {
          tournaments: [],
          users: [],
          matches: [],
          lastSync: new Date().toISOString()
        })
      } catch (error) {
        console.error('Firebase清空失败:', error)
      }
    }
    localStorage.removeItem(STORAGE_KEY)
    return true
  },

  // 获取存储大小（KB）
  async getStorageSize() {
    const data = await this.getAll()
    const jsonStr = JSON.stringify(data)
    return (new Blob([jsonStr]).size / 1024).toFixed(2)
  }
}

