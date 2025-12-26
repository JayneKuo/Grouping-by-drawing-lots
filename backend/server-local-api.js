// 本地开发API服务器 - 模拟Vercel API
// 用于本地测试，使用文件存储模拟Redis

const express = require('express')
const cors = require('cors')
const fs = require('fs').promises
const path = require('path')

const app = express()
const PORT = 3001 // 使用3001端口，避免与后端服务器冲突

// 数据存储文件路径
const DATA_FILE = path.join(__dirname, 'local-data.json')

// 中间件
app.use(cors())
app.use(express.json())

// 初始化数据文件
async function initDataFile() {
  try {
    await fs.access(DATA_FILE)
  } catch {
    // 文件不存在，创建默认数据
    const defaultData = {
      tournaments: [],
      users: [],
      matches: [],
      lastSync: null
    }
    await fs.writeFile(DATA_FILE, JSON.stringify(defaultData, null, 2))
    console.log('✅ 创建本地数据文件:', DATA_FILE)
  }
}

// 读取数据
async function readData() {
  try {
    const content = await fs.readFile(DATA_FILE, 'utf-8')
    return JSON.parse(content)
  } catch (error) {
    console.error('读取数据文件失败:', error)
    return {
      tournaments: [],
      users: [],
      matches: [],
      lastSync: null
    }
  }
}

// 保存数据
async function saveData(data) {
  try {
    data.lastSync = new Date().toISOString()
    await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2))
    return true
  } catch (error) {
    console.error('保存数据文件失败:', error)
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
  await initDataFile()
  
  app.listen(PORT, () => {
    console.log('🚀 本地API服务器已启动')
    console.log(`📡 监听端口: http://localhost:${PORT}`)
    console.log(`📊 数据文件: ${DATA_FILE}`)
    console.log('')
    console.log('可用端点:')
    console.log(`  GET  http://localhost:${PORT}/api/data  - 读取数据`)
    console.log(`  POST http://localhost:${PORT}/api/data  - 保存数据`)
    console.log(`  GET  http://localhost:${PORT}/api/health - 健康检查`)
    console.log('')
    console.log('💡 提示: 前端会自动连接到这个本地API服务器')
  })
}

start().catch(console.error)

