// API调用 - 自动选择本地存储或远程API
import { storage } from '../utils/storage'

// 检测是否使用本地存储（纯前端模式）
const USE_LOCAL_STORAGE = true // 设置为true使用localStorage，false使用远程API

export async function addPlayer(tournamentId, player) {
  if (USE_LOCAL_STORAGE) {
    // 统一ID类型
    const id = typeof tournamentId === 'string' && /^\d+$/.test(tournamentId) 
      ? parseInt(tournamentId) 
      : tournamentId
    
    console.log('📥 addPlayer: 请求ID:', tournamentId, '类型:', typeof tournamentId, '统一后:', id)
    
    const result = await storage.getTournament(id)
    const tournament = result.data
    
    if (!result.success || !tournament) {
      console.error('❌ addPlayer: 比赛不存在，ID:', id)
      return Promise.resolve({
        success: false,
        message: `比赛不存在 (ID: ${id})`
      })
    }
    
    // 验证比赛对象完整性
    if (!tournament.id) {
      console.error('❌ addPlayer: 比赛对象缺少ID字段', tournament)
      // 尝试从参数中恢复ID
      tournament.id = id
      console.warn('⚠️ 已从参数恢复ID:', id)
    }
    
    console.log('✅ addPlayer: 找到比赛:', tournament.name, 'ID:', tournament.id, '类型:', typeof tournament.id)
    
    if (!tournament.players) {
      tournament.players = []
    }
    
    const newPlayer = {
      id: Date.now().toString(),
      ...player,
      tournament_id: parseInt(tournamentId),
      status: player.status || 'approved' // 默认直接通过，无需审核
    }
    
    tournament.players.push(newPlayer)
    // 更新player_count（虽然列表页直接读取players.length，但保持数据一致性）
    tournament.player_count = tournament.players.length
    
    console.log('💾 保存比赛，ID:', tournament.id, '类型:', typeof tournament.id, '选手数:', tournament.players.length)
    const saveResult = await storage.saveTournament(tournament)
    
    if (!saveResult) {
      console.error('❌ 保存比赛失败')
      return Promise.resolve({
        success: false,
        message: '保存比赛失败'
      })
    }
    
    return Promise.resolve({
      success: true,
      message: '选手添加成功',
      data: newPlayer
    })
  }
  
  const request = require('./request').default
  return request.post(`/tournaments/${tournamentId}/players`, player)
}

export async function batchImportPlayers(tournamentId, players) {
  if (USE_LOCAL_STORAGE) {
    // 统一ID类型
    const id = typeof tournamentId === 'string' && /^\d+$/.test(tournamentId) 
      ? parseInt(tournamentId) 
      : tournamentId
    
    console.log('📥 batchImportPlayers: 请求ID:', tournamentId, '类型:', typeof tournamentId, '统一后:', id)
    
    const result = await storage.getTournament(id)
    const tournament = result.data
    
    if (!result.success || !tournament) {
      console.error('❌ batchImportPlayers: 比赛不存在，ID:', id)
      return Promise.resolve({
        success: false,
        message: `比赛不存在 (ID: ${id})`
      })
    }
    
    // 验证比赛对象完整性
    if (!tournament.id) {
      console.error('❌ batchImportPlayers: 比赛对象缺少ID字段', tournament)
      // 尝试从参数中恢复ID
      tournament.id = id
      console.warn('⚠️ 已从参数恢复ID:', id)
    }
    
    console.log('✅ batchImportPlayers: 找到比赛:', tournament.name, 'ID:', tournament.id, '类型:', typeof tournament.id)
    
    if (!tournament.players) {
      tournament.players = []
    }
    
    // 检查重复
    const existingNames = tournament.players.map(p => p.name.toLowerCase())
    const newPlayers = players
      .filter(p => !existingNames.includes(p.name.toLowerCase()))
      .map((p, index) => ({
        id: (Date.now() + index).toString(),
        ...p,
        tournament_id: parseInt(tournamentId),
        status: p.status || 'approved' // 默认直接通过，无需审核
      }))
    
    if (newPlayers.length === 0) {
      return Promise.resolve({
        success: false,
        message: '所有选手已存在'
      })
    }
    
    tournament.players.push(...newPlayers)
    // 更新player_count
    tournament.player_count = tournament.players.length
    
    // 确保ID存在且正确（关键修复）
    if (!tournament.id && tournament.id !== 0) {
      console.error('❌ batchImportPlayers: 保存前检查，比赛ID丢失！', {
        tournament: tournament,
        originalId: id
      })
      tournament.id = id
      console.warn('⚠️ 已重新设置ID:', id)
    }
    
    // 确保ID类型一致
    const originalId = tournament.id
    console.log('💾 保存比赛，原始ID:', originalId, '类型:', typeof originalId, '选手数:', tournament.players.length)
    
    // 最终验证
    if (!tournament.id && tournament.id !== 0) {
      console.error('❌ batchImportPlayers: 保存前最终验证失败，比赛ID无效！')
      return Promise.resolve({
        success: false,
        message: '比赛ID无效，无法保存'
      })
    }
    
    const saveResult = await storage.saveTournament(tournament)
    
    if (!saveResult) {
      console.error('❌ 保存比赛失败')
      return Promise.resolve({
        success: false,
        message: '保存比赛失败'
      })
    }
    
    return Promise.resolve({
      success: true,
      message: `成功导入${newPlayers.length}名选手${players.length > newPlayers.length ? `（跳过${players.length - newPlayers.length}个重复）` : ''}`,
      data: newPlayers
    })
  }
  
  const request = require('./request').default
  return request.post(`/tournaments/${tournamentId}/players/batch`, { players })
}

export async function deletePlayer(tournamentId, playerId) {
  if (USE_LOCAL_STORAGE) {
    const tournament = await storage.getTournament(tournamentId)
    if (!tournament) {
      return Promise.resolve({
        success: false,
        message: '比赛不存在'
      })
    }
    
    if (tournament.players) {
      tournament.players = tournament.players.filter(p => p.id !== playerId)
      // 更新player_count
      tournament.player_count = tournament.players.length
      await storage.saveTournament(tournament)
    }
    
    return Promise.resolve({
      success: true,
      message: '选手删除成功'
    })
  }
  
  const request = require('./request').default
  return request.delete(`/tournaments/${tournamentId}/players/${playerId}`)
}

export async function getPlayers(tournamentId) {
  if (USE_LOCAL_STORAGE) {
    const tournament = await storage.getTournament(tournamentId)
    if (!tournament) {
      return Promise.resolve({
        success: false,
        message: '比赛不存在'
      })
    }
    
    return Promise.resolve({
      success: true,
      data: tournament.players || []
    })
  }
  
  const request = require('./request').default
  return request.get(`/tournaments/${tournamentId}/players`)
}
