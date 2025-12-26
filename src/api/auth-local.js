// 纯前端版本 - 认证（使用localStorage）
import { storage } from '../utils/storage'

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
    
    // 简化版：直接存储密码（实际应该加密，但纯前端无法安全加密）
    // 这里为了简单，直接存储明文密码
    data.users = defaultUsers.map(u => ({
      ...u,
      password: u.password // 纯前端版本，简化处理
    }))
    
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
  return new Promise(async (resolve) => {
    // 从Firebase读取数据（确保多账号共享）
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

export function register(username, password) {
  return new Promise(async (resolve) => {
    // 从Firebase读取数据（确保多账号共享）
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
      password, // 纯前端版本，简化处理
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

