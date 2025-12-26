// Vercel Serverless Function - 数据存储API
// 使用Vercel KV（Redis）作为数据库，免费且快速

// 注意：需要先安装 @vercel/kv
// npm install @vercel/kv

let kv
try {
  // 动态导入，避免构建错误
  const kvModule = require('@vercel/kv')
  // @vercel/kv 会自动从环境变量读取 REDIS_URL 或 KV_REST_API_URL
  kv = kvModule.kv
  console.log('✅ Vercel KV 已初始化')
} catch (e) {
  console.warn('@vercel/kv未安装，使用内存存储（仅用于开发）')
  // 开发环境使用内存存储
  let memoryStore = {}
  kv = {
    get: async (key) => memoryStore[key] || null,
    set: async (key, value) => { memoryStore[key] = value }
  }
}

const DATA_KEY = 'tennis_tournament_data'

module.exports = async function handler(req, res) {
  // 设置CORS头，允许跨域请求
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  // 处理OPTIONS请求（CORS预检）
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  try {
    if (req.method === 'GET') {
      // 获取所有数据
      const data = await kv.get(DATA_KEY)
      
      if (!data) {
        // 如果没有数据，返回空数据
        return res.status(200).json({
          success: true,
          data: {
            tournaments: [],
            users: [],
            matches: [],
            lastSync: null
          }
        })
      }

      return res.status(200).json({
        success: true,
        data: data
      })
    } else if (req.method === 'POST') {
      // 保存所有数据
      const { tournaments, users, matches, lastSync } = req.body

      const data = {
        tournaments: tournaments || [],
        users: users || [],
        matches: matches || [],
        lastSync: lastSync || new Date().toISOString()
      }

      await kv.set(DATA_KEY, data)

      return res.status(200).json({
        success: true,
        message: '数据保存成功',
        data: data
      })
    } else {
      return res.status(405).json({
        success: false,
        message: '方法不允许'
      })
    }
  } catch (error) {
    console.error('API错误:', error)
    return res.status(500).json({
      success: false,
      message: '服务器错误: ' + error.message
    })
  }
}

