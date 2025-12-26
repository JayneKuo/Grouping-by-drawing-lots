// Vercel Serverless Function - 数据存储API
// 使用Vercel KV（Redis）作为数据库

const DATA_KEY = 'tennis_tournament_data'

// 全局内存存储（作为降级方案）
let memoryStore = {}

// Redis 客户端缓存（在同一个函数实例中复用）
let redisClient = null

// 获取 KV 客户端
async function getKV() {
  // 方案1: 使用 redis 包配合 REDIS_URL（优先，因为你有 REDIS_URL）
  if (process.env.REDIS_URL) {
    try {
      const redis = require('redis')
      
      // 如果客户端已存在且已连接，直接使用
      if (redisClient && redisClient.isOpen) {
        console.log('✅ 复用现有 Redis 连接')
      } else {
        // 创建新连接
        redisClient = redis.createClient({
          url: process.env.REDIS_URL,
          socket: {
            connectTimeout: 10000,
            reconnectStrategy: false
          }
        })

        // 连接 Redis
        if (!redisClient.isOpen) {
          await redisClient.connect()
        }
        console.log('✅ Redis 客户端已连接')
      }

      return {
        get: async (key) => {
          try {
            if (!redisClient.isOpen) {
              await redisClient.connect()
            }
            const value = await redisClient.get(key)
            if (!value) return null
            return JSON.parse(value)
          } catch (err) {
            console.error('Redis GET 错误:', err.message)
            // 如果连接断开，尝试重连
            if (!redisClient.isOpen) {
              try {
                await redisClient.connect()
                const value = await redisClient.get(key)
                return value ? JSON.parse(value) : null
              } catch (retryErr) {
                console.error('Redis 重连失败:', retryErr.message)
                return null
              }
            }
            return null
          }
        },
        set: async (key, value) => {
          try {
            if (!redisClient.isOpen) {
              await redisClient.connect()
            }
            await redisClient.set(key, JSON.stringify(value))
          } catch (err) {
            console.error('Redis SET 错误:', err.message)
            // 如果连接断开，尝试重连
            if (!redisClient.isOpen) {
              try {
                await redisClient.connect()
                await redisClient.set(key, JSON.stringify(value))
              } catch (retryErr) {
                console.error('Redis 重连失败:', retryErr.message)
                throw retryErr
              }
            } else {
              throw err
            }
          }
        }
      }
    } catch (error) {
      console.error('❌ Redis 连接失败:', error.message)
      console.error('错误详情:', error)
    }
  }

  // 方案2: 尝试使用 @vercel/kv（备用方案）
  try {
    const { kv } = require('@vercel/kv')
    console.log('✅ 使用 @vercel/kv')
    return {
      get: async (key) => {
        const value = await kv.get(key)
        return value || null
      },
      set: async (key, value) => {
        await kv.set(key, value)
      }
    }
  } catch (e) {
    console.log('⚠️ @vercel/kv 不可用:', e.message)
  }

  // 方案3: 降级到内存存储（至少让应用能运行）
  console.warn('⚠️ 使用内存存储（数据不会持久化，仅用于测试）')
  return {
    get: async (key) => {
      return memoryStore[key] || null
    },
    set: async (key, value) => {
      memoryStore[key] = value
    }
  }
}

module.exports = async function handler(req, res) {
  // 设置CORS头
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  // 处理OPTIONS请求
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  try {
    const kv = await getKV()
    
    if (req.method === 'GET') {
      const data = await kv.get(DATA_KEY)
      
      return res.status(200).json({
        success: true,
        data: data || {
          tournaments: [],
          users: [],
          matches: [],
          lastSync: null
        }
      })
    } 
    
    if (req.method === 'POST') {
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
    }
    
    return res.status(405).json({
      success: false,
      message: '方法不允许'
    })
  } catch (error) {
    console.error('❌ API错误:', error)
    console.error('错误堆栈:', error.stack)
    return res.status(500).json({
      success: false,
      message: '服务器错误: ' + error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    })
  }
}
