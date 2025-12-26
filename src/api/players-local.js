// 纯前端版本 - 选手操作
import { storage } from '../utils/storage'

export function addPlayer(tournamentId, player) {
  const tournament = storage.getTournament(tournamentId)
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
    status: player.status || 'pending'
  }
  
  tournament.players.push(newPlayer)
  storage.saveTournament(tournament)
  
  return Promise.resolve({
    success: true,
    message: '选手添加成功',
    data: newPlayer
  })
}

export function batchImportPlayers(tournamentId, players) {
  const tournament = storage.getTournament(tournamentId)
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
      status: p.status || 'pending'
    }))
  
  if (newPlayers.length === 0) {
    return Promise.resolve({
      success: false,
      message: '所有选手已存在'
    })
  }
  
  tournament.players.push(...newPlayers)
  storage.saveTournament(tournament)
  
  return Promise.resolve({
    success: true,
    message: `成功导入${newPlayers.length}名选手${players.length > newPlayers.length ? `（跳过${players.length - newPlayers.length}个重复）` : ''}`,
    data: newPlayers
  })
}

export function deletePlayer(tournamentId, playerId) {
  const tournament = storage.getTournament(tournamentId)
  if (!tournament) {
    return Promise.resolve({
      success: false,
      message: '比赛不存在'
    })
  }
  
  if (tournament.players) {
    tournament.players = tournament.players.filter(p => p.id !== playerId)
    storage.saveTournament(tournament)
  }
  
  return Promise.resolve({
    success: true,
    message: '选手删除成功'
  })
}

export function getPlayers(tournamentId) {
  const tournament = storage.getTournament(tournamentId)
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

