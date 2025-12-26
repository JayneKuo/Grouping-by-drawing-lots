// 测试 KV 连接的 API
module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  const result = {
    env: {
      hasRedisUrl: !!process.env.REDIS_URL,
      hasKvRestApiUrl: !!process.env.KV_REST_API_URL,
      hasKvRestApiToken: !!process.env.KV_REST_API_TOKEN,
      redisUrlPrefix: process.env.REDIS_URL ? process.env.REDIS_URL.substring(0, 20) + '...' : null
    },
    tests: {}
  }

  // 测试 @vercel/kv
  try {
    const kvModule = require('@vercel/kv')
    result.tests.vercelKv = {
      available: true,
      kvType: typeof kvModule.kv
    }
  } catch (e) {
    result.tests.vercelKv = {
      available: false,
      error: e.message
    }
  }

  // 测试 redis 包
  try {
    const redis = require('redis')
    result.tests.redis = {
      available: true,
      version: redis.version || 'unknown'
    }
  } catch (e) {
    result.tests.redis = {
      available: false,
      error: e.message
    }
  }

  return res.status(200).json({
    success: true,
    result
  })
}

