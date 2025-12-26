// API调用 - 自动选择本地存储或远程API
import { storage } from '../utils/storage'

// 检测是否使用本地存储（纯前端模式）
const USE_LOCAL_STORAGE = true // 设置为true使用localStorage，false使用远程API

export async function getTournaments() {
  if (USE_LOCAL_STORAGE) {
    const tournaments = await storage.getTournaments()
    return Promise.resolve({
      success: true,
      data: tournaments
    })
  }
  
  // 远程API调用（如果需要）
  const request = require('./request').default
  return request.get('/tournaments')
}

export async function getTournament(id) {
  if (USE_LOCAL_STORAGE) {
    const tournament = await storage.getTournament(id)
    if (tournament) {
      return Promise.resolve({
        success: true,
        data: tournament
      })
    } else {
      return Promise.resolve({
        success: false,
        message: '比赛不存在'
      })
    }
  }
  
  const request = require('./request').default
  return request.get(`/tournaments/${id}`)
}

export async function createTournament(tournamentData) {
  if (USE_LOCAL_STORAGE) {
    try {
      console.log('📝 开始创建比赛:', tournamentData)
      const tournaments = await storage.getTournaments()
      
      // 统一字段名（前端用驼峰，后端用下划线）
      const startDate = tournamentData.startDate || ''
      const startTime = tournamentData.startTime || ''
      const startDateTime = startDate && startTime 
        ? `${startDate} ${startTime}:00`
        : new Date().toISOString()
      
      const newTournament = {
        id: Date.now(),
        name: tournamentData.name,
        format: tournamentData.format,
        scoring_method: tournamentData.scoringMethod || tournamentData.scoring_method || 'no-ad',
        group_method: tournamentData.groupMethod || tournamentData.group_method || '2-groups',
        start_date: startDate || null,
        start_time: startTime || null,
        start_datetime: startDateTime,
        location: tournamentData.location || '',
        players: [],
        matches: [],
        status: 'draft',
        created_at: new Date().toISOString()
      }
      
      console.log('✅ 新比赛数据:', newTournament)
      
      tournaments.push(newTournament)
      const saveResult = await storage.saveTournaments(tournaments)
      
      console.log('💾 保存结果:', saveResult)
      
      // 验证保存是否成功
      const verifyTournaments = await storage.getTournaments()
      console.log('🔍 验证数据，当前比赛数:', verifyTournaments.length)
      
      return Promise.resolve({
        success: true,
        message: '比赛创建成功',
        data: { id: newTournament.id }
      })
    } catch (error) {
      console.error('❌ 创建比赛失败:', error)
      return Promise.resolve({
        success: false,
        message: '创建失败：' + error.message
      })
    }
  }
  
  const request = require('./request').default
  return request.post('/tournaments', tournamentData)
}

export async function updateTournament(id, updates) {
  if (USE_LOCAL_STORAGE) {
    const tournament = await storage.getTournament(id)
    if (!tournament) {
      return Promise.resolve({
        success: false,
        message: '比赛不存在'
      })
    }
    
    const updated = { ...tournament, ...updates }
    await storage.saveTournament(updated)
    
    return Promise.resolve({
      success: true,
      message: '更新成功',
      data: updated
    })
  }
  
  const request = require('./request').default
  return request.put(`/tournaments/${id}`, updates)
}
