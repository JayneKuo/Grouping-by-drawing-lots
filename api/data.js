// Vercel Serverless Function - 数据存储API
// 使用Vercel KV（Redis）作为数据库，免费且快速

let kv
let redisClient = null

// 初始化 Redis 客户端
async function initRedis() {
  if (redisClient) {
    return redisClient
  }

  try {
    // 优先尝试使用 @vercel/kv（需要 REST API 环境变量）
    const kvModule = require('@vercel/kv')
    if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
      kv = kvModule.kv
      console.log('✅ 使用 @vercel/kv (REST API)')
      return kv
    }
  } catch (e) {
    // @vercel/kv 不可用，继续尝试 redis 包
  }

  try {
    // 使用 redis 包配合 REDIS_URL
    const redis = require('redis')
    const redisUrl = process.env.REDIS_URL
    
    if (!redisUrl) {
      throw new Error('REDIS_URL 环境变量未设置')
    }

    redisClient = redis.createClient({
      url: redisUrl
    })

    redisClient.on('error', (err) => {
      console.error('Redis客户端错误:', err)
    })

    await redisClient.connect()
    console.log('✅ Redis 客户端已连接')

    // 创建兼容的 kv 接口
    kv = {
      get: async (key) => {
        const value = await redisClient.get(key)
        return value ? JSON.parse(value) : null
      },
      set: async (key, value) => {
        await redisClient.set(key, JSON.stringify(value))
      }
    }

    return kv
  } catch (error) {
    console.error('❌ Redis 初始化失败:', error.message)
    // 降级到内存存储
    console.warn('⚠️ 使用内存存储（仅用于开发）')
    let memoryStore = {}
    kv = {
      get: async (key) => memoryStore[key] || null,
      set: async (key, value) => { memoryStore[key] = value }
    }
    return kv
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

  // 初始化 Redis 客户端
  try {
    await initRedis()
  } catch (error) {
    console.error('❌ Redis 初始化失败:', error)
    return res.status(500).json({
      success: false,
      message: '数据库连接失败: ' + error.message
    })
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

