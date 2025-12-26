// API调用 - 自动选择本地存储或远程API
import { storage } from '../utils/storage'

// 检测是否使用本地存储（纯前端模式）
const USE_LOCAL_STORAGE = true // 设置为true使用localStorage，false使用远程API

export async function addPlayer(tournamentId, player) {
  if (USE_LOCAL_STORAGE) {
    const tournament = await storage.getTournament(tournamentId)
    if (!tournament) {
      return Promise.resolve({
        success: false,
        message: '比赛不存在'
      })
    }
    
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
    await storage.saveTournament(tournament)
    
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
    const tournament = await storage.getTournament(tournamentId)
    if (!tournament) {
      return Promise.resolve({
        success: false,
        message: '比赛不存在'
      })
    }
    
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
    await storage.saveTournament(tournament)
    
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
