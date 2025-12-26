// 纯前端版本 - 使用localStorage存储
import { storage } from '../utils/storage'

export function getTournaments() {
  return Promise.resolve({
    success: true,
    data: storage.getTournaments()
  })
}

export function getTournament(id) {
  const tournament = storage.getTournament(id)
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

export function createTournament(tournamentData) {
  const tournaments = storage.getTournaments()
  const newTournament = {
    id: Date.now(),
    ...tournamentData,
    players: [],
    matches: [],
    status: 'draft',
    created_at: new Date().toISOString()
  }
  
  tournaments.push(newTournament)
  storage.saveTournaments(tournaments)
  
  return Promise.resolve({
    success: true,
    message: '比赛创建成功',
    data: { id: newTournament.id }
  })
}

export function updateTournament(id, updates) {
  const tournament = storage.getTournament(id)
  if (!tournament) {
    return Promise.resolve({
      success: false,
      message: '比赛不存在'
    })
  }
  
  const updated = { ...tournament, ...updates }
  storage.saveTournament(updated)
  
  return Promise.resolve({
    success: true,
    message: '更新成功',
    data: updated
  })
}

