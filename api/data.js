// Vercel Serverless Function - 数据存储API
// 使用Vercel KV（Redis）作为数据库，免费且快速

let kv = null

// 初始化 KV 客户端（每次请求都重新初始化，因为 Serverless Functions 是无状态的）
async function getKV() {
  if (kv) {
    return kv
  }

  try {
    // 优先尝试使用 @vercel/kv（需要 REST API 环境变量）
    // @vercel/kv 会自动从环境变量读取 KV_REST_API_URL 和 KV_REST_API_TOKEN
    const kvModule = require('@vercel/kv')
    if (process.env.KV_REST_API_URL || process.env.REDIS_URL) {
      kv = kvModule.kv
      console.log('✅ 使用 @vercel/kv，环境变量:', {
        hasRestApi: !!process.env.KV_REST_API_URL,
        hasRedisUrl: !!process.env.REDIS_URL
      })
      return kv
    } else {
      console.warn('⚠️ @vercel/kv 需要环境变量 KV_REST_API_URL 或 REDIS_URL')
    }
  } catch (e) {
    console.warn('@vercel/kv 不可用:', e.message)
  }

  try {
    // 尝试使用 redis 包配合 REDIS_URL
    const redis = require('redis')
    const redisUrl = process.env.REDIS_URL
    
    if (redisUrl) {
      const client = redis.createClient({
        url: redisUrl,
        socket: {
          reconnectStrategy: false // Serverless 环境中禁用自动重连
        }
      })

      await client.connect()
      console.log('✅ Redis 客户端已连接')

      kv = {
        get: async (key) => {
          try {
            const value = await client.get(key)
            return value ? JSON.parse(value) : null
          } catch (err) {
            console.error('Redis GET 错误:', err)
            return null
          }
        },
        set: async (key, value) => {
          try {
            await client.set(key, JSON.stringify(value))
          } catch (err) {
            console.error('Redis SET 错误:', err)
            throw err
          }
        }
      }
      return kv
    }
  } catch (error) {
    console.error('❌ Redis 初始化失败:', error.message)
  }

  // 降级到内存存储（临时方案，数据不会持久化）
  console.warn('⚠️ 使用内存存储（数据不会持久化）')
  let memoryStore = {}
  kv = {
    get: async (key) => memoryStore[key] || null,
    set: async (key, value) => { memoryStore[key] = value }
  }
  return kv
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
    // 获取 KV 客户端
    const kvClient = await getKV()
    
    if (req.method === 'GET') {
      // 获取所有数据
      const data = await kvClient.get(DATA_KEY)
      
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

      await kvClient.set(DATA_KEY, data)

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

