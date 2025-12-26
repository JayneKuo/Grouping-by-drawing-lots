// API调用 - 自动选择本地存储或远程API
import { storage } from '../utils/storage'

// 检测是否使用本地存储（纯前端模式）
const USE_LOCAL_STORAGE = true // 设置为true使用localStorage，false使用远程API

// 初始化默认账号（异步，确保从Firebase读取）
async function initDefaultUsers() {
  const data = await storage.getAll()
  if (!data.users || data.users.length === 0) {
    const defaultUsers = [
      { id: 1, username: 'admin', password: 'admin123', role: 'admin' },
      { id: 2, username: 'user1', password: 'user123', role: 'user' },
      { id: 3, username: 'user2', password: 'user123', role: 'user' },
      { id: 4, username: 'user3', password: 'user123', role: 'user' }
    ]
    
    data.users = defaultUsers
    await storage.saveAll(data)
    console.log('✅ 默认账号已初始化到Firebase')
  } else {
    console.log('✅ 账号已存在，数量:', data.users.length)
  }
}

// 初始化（异步执行，不阻塞应用启动）
initDefaultUsers().catch(err => {
  console.error('初始化账号失败:', err)
})

export function login(username, password) {
  if (USE_LOCAL_STORAGE) {
    return new Promise(async (resolve) => {
      const data = await storage.getAll()
      const user = data.users?.find(u => u.username === username)
      
      if (!user || user.password !== password) {
        resolve({
          success: false,
          message: '用户名或密码错误'
        })
        return
      }
      
      const token = `token-${user.id}-${Date.now()}`
      
      resolve({
        success: true,
        message: '登录成功',
        data: {
          token,
          user: {
            id: user.id,
            username: user.username,
            role: user.role
          }
        }
      })
    })
  }
  
  const request = require('./request').default
  return request.post('/auth/login', { username, password })
}

export function register(username, password) {
  if (USE_LOCAL_STORAGE) {
    return new Promise(async (resolve) => {
      const data = await storage.getAll()
      
      if (!data.users) {
        data.users = []
      }
      
      const existing = data.users.find(u => u.username === username)
      if (existing) {
        resolve({
          success: false,
          message: '用户名已存在'
        })
        return
      }
      
      const newUser = {
        id: data.users.length > 0 ? Math.max(...data.users.map(u => u.id)) + 1 : 1,
        username,
        password,
        role: 'user',
        created_at: new Date().toISOString()
      }
      
      data.users.push(newUser)
      await storage.saveAll(data)
      
      resolve({
        success: true,
        message: '注册成功',
        data: { userId: newUser.id, username }
      })
    })
  }
  
  const request = require('./request').default
  return request.post('/auth/register', { username, password })
}
