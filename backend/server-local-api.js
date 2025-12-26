// 本地开发API服务器 - 连接到线上Redis数据库
// 用于本地测试，连接到Vercel KV（Redis）

const express = require('express')
const cors = require('cors')
require('dotenv').config()

const app = express()
const PORT = 3001 // 使用3001端口，避免与后端服务器冲突

const DATA_KEY = 'tennis_tournament_data'

// Redis 客户端
let redisClient = null

// 中间件
app.use(cors())
app.use(express.json())

// 初始化 Redis 客户端
async function initRedis() {
  const redisUrl = process.env.REDIS_URL
  
  if (!redisUrl) {
    console.error('❌ 错误: 未设置 REDIS_URL 环境变量')
    console.error('💡 请在 backend/.env 文件中设置 REDIS_URL')
    console.error('   例如: REDIS_URL=redis://default:password@host:port')
    process.exit(1)
  }
  
  try {
    const redis = require('redis')
    
    redisClient = redis.createClient({
      url: redisUrl,
      socket: {
        connectTimeout: 10000,
        reconnectStrategy: false
      }
    })

    redisClient.on('error', (err) => {
      console.error('❌ Redis客户端错误:', err.message)
    })

    await redisClient.connect()
    console.log('✅ Redis 客户端已连接到线上数据库')
    console.log(`📡 Redis URL: ${redisUrl.replace(/:[^:@]+@/, ':****@')}`) // 隐藏密码
  } catch (error) {
    console.error('❌ Redis 连接失败:', error.message)
    console.error('💡 请检查 REDIS_URL 是否正确，以及网络连接是否正常')
    process.exit(1)
  }
}

// 读取数据
async function readData() {
  try {
    if (!redisClient || !redisClient.isOpen) {
      await redisClient.connect()
    }
    const value = await redisClient.get(DATA_KEY)
    if (!value) {
      return {
        tournaments: [],
        users: [],
        matches: [],
        lastSync: null
      }
    }
    return JSON.parse(value)
  } catch (error) {
    console.error('读取Redis数据失败:', error.message)
    // 如果连接断开，尝试重连
    if (!redisClient.isOpen) {
      try {
        await redisClient.connect()
        const value = await redisClient.get(DATA_KEY)
        return value ? JSON.parse(value) : {
          tournaments: [],
          users: [],
          matches: [],
          lastSync: null
        }
      } catch (retryErr) {
        console.error('Redis 重连失败:', retryErr.message)
        throw retryErr
      }
    }
    throw error
  }
}

// 保存数据
async function saveData(data) {
  try {
    if (!redisClient || !redisClient.isOpen) {
      await redisClient.connect()
    }
    data.lastSync = new Date().toISOString()
    await redisClient.set(DATA_KEY, JSON.stringify(data))
    return true
  } catch (error) {
    console.error('保存Redis数据失败:', error.message)
    // 如果连接断开，尝试重连
    if (!redisClient.isOpen) {
      try {
        await redisClient.connect()
        await redisClient.set(DATA_KEY, JSON.stringify(data))
        return true
      } catch (retryErr) {
        console.error('Redis 重连失败:', retryErr.message)
        return false
      }
    }
    return false
  }
}

// API路由 - 模拟 /api/data
app.get('/api/data', async (req, res) => {
  try {
    console.log('📖 [GET] /api/data - 读取数据')
    const data = await readData()
    
    res.status(200).json({
      success: true,
      data: data
    })
  } catch (error) {
    console.error('❌ [GET] /api/data 错误:', error)
    res.status(500).json({
      success: false,
      message: '服务器错误: ' + error.message
    })
  }
})

app.post('/api/data', async (req, res) => {
  try {
    console.log('💾 [POST] /api/data - 保存数据')
    const { tournaments, users, matches, lastSync } = req.body

    const data = {
      tournaments: tournaments || [],
      users: users || [],
      matches: matches || [],
      lastSync: lastSync || new Date().toISOString()
    }

    const saved = await saveData(data)
    
    if (saved) {
      res.status(200).json({
        success: true,
        message: '数据保存成功',
        data: data
      })
    } else {
      res.status(500).json({
        success: false,
        message: '数据保存失败'
      })
    }
  } catch (error) {
    console.error('❌ [POST] /api/data 错误:', error)
    res.status(500).json({
      success: false,
      message: '服务器错误: ' + error.message
    })
  }
})

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: '本地API服务器运行中' })
})

// 启动服务器
async function start() {
  // 先连接Redis
  await initRedis()
  
  app.listen(PORT, () => {
    console.log('')
    console.log('🚀 本地API服务器已启动')
    console.log(`📡 监听端口: http://localhost:${PORT}`)
    console.log(`📊 数据存储: Redis (线上数据库)`)
    console.log('')
    console.log('可用端点:')
    console.log(`  GET  http://localhost:${PORT}/api/data  - 读取数据`)
    console.log(`  POST http://localhost:${PORT}/api/data  - 保存数据`)
    console.log(`  GET  http://localhost:${PORT}/api/health - 健康检查`)
    console.log('')
    console.log('💡 提示:')
    console.log('   - 前端会自动连接到这个本地API服务器')
    console.log('   - 数据会保存到线上Redis数据库（与生产环境共享）')
    console.log('')
  })
}

// 优雅关闭
process.on('SIGINT', async () => {
  console.log('\n正在关闭服务器...')
  if (redisClient && redisClient.isOpen) {
    await redisClient.quit()
    console.log('✅ Redis连接已关闭')
  }
  process.exit(0)
})

start().catch(console.error)

