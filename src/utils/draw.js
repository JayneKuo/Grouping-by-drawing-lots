// 抽签分组工具函数

/**
 * 自动抽签分组
 * @param {Array} players 选手列表
 * @param {Number} groupCount 分组数量
 * @returns {Array} 分组结果
 */
export function autoDraw(players, groupCount) {
  if (!players || players.length === 0) {
    return []
  }
  
  const groupNames = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']
  const groups = []
  
  // 初始化分组
  for (let i = 0; i < groupCount; i++) {
    groups.push({
      name: groupNames[i],
      players: []
    })
  }
  
  // 随机打乱选手顺序
  const shuffled = [...players].sort(() => Math.random() - 0.5)
  
  // 均分到各组（轮询分配）
  shuffled.forEach((player, index) => {
    const groupIndex = index % groupCount
    groups[groupIndex].players.push({
      ...player,
      group: groups[groupIndex].name
    })
  })
  
  return groups
}

/**
 * 生成小组赛对阵（优化：错开同一选手的比赛）
 * @param {Array} players 选手列表（已分组）
 * @returns {Array} 对阵列表
 */
export function generateGroupMatches(players) {
  const matches = []
  const groups = {}
  
  // 按组分类
  players.forEach(player => {
    const group = player.group || 'A'
    if (!groups[group]) {
      groups[group] = []
    }
    groups[group].push(player)
  })
  
  // 为每组生成循环赛对阵（错开安排）
  Object.keys(groups).forEach(groupName => {
    const groupPlayers = groups[groupName]
    const groupMatches = scheduleGroupMatches(groupPlayers, groupName)
    matches.push(...groupMatches)
  })
  
  return matches
}

/**
 * 为单个组安排比赛（错开同一选手的比赛）
 * 使用轮询调度算法（Round-Robin Tournament Scheduling）
 * @param {Array} groupPlayers 组内选手列表
 * @param {String} groupName 组名
 * @returns {Array} 安排好的比赛列表
 */
function scheduleGroupMatches(groupPlayers, groupName) {
  const matches = []
  const n = groupPlayers.length
  
  if (n < 2) {
    return matches
  }
  
  // 如果是奇数个选手，添加一个"轮空"选手
  const isOdd = n % 2 === 1
  const players = isOdd ? [...groupPlayers, null] : [...groupPlayers]
  const numPlayers = players.length
  
  // 轮询调度算法：固定第一个选手，其他选手轮换
  // 对于n个选手，需要n-1轮（如果是奇数，实际是n-1轮，但每轮有一个轮空）
  const numRounds = numPlayers - 1
  
  for (let round = 0; round < numRounds; round++) {
    // 每一轮，固定第一个位置，其他位置轮换
    for (let i = 0; i < numPlayers / 2; i++) {
      const player1 = players[i]
      const player2 = players[numPlayers - 1 - i]
      
      // 跳过轮空
      if (player1 === null || player2 === null) {
        continue
      }
      
      // 计算场次编号：当前组内的第几场比赛
      const matchNumber = matches.length + 1
      
      matches.push({
        id: Date.now() + matches.length,
        tournament_id: player1.tournament_id,
        player1_id: player1.id,
        player1_name: player1.name,
        player2_id: player2.id,
        player2_name: player2.name,
        group: groupName,
        round: round, // 轮次（用于错开安排）
        matchNumber: matchNumber, // 场次编号（组内第几场）
        status: 'pending',
        sets: [],
        created_at: new Date().toISOString()
      })
    }
    
    // 轮换：除了第一个选手，其他选手顺时针旋转
    // 将最后一个选手移到第二个位置，其他选手依次后移
    const lastPlayer = players[numPlayers - 1]
    for (let i = numPlayers - 1; i > 1; i--) {
      players[i] = players[i - 1]
    }
    players[1] = lastPlayer
  }
  
  return matches
}

/**
 * 生成淘汰赛对阵（根据出线选手数量自动生成对应轮次）
 * @param {Array} qualifiedPlayers 出线选手列表（按排名排序）
 * @param {Number} tournamentId 比赛ID
 * @param {String} groupMethod 分组方式（'2-groups', '4-groups', 'no-groups'）
 * @returns {Array} 对阵列表
 */
export function generateKnockoutMatches(qualifiedPlayers, tournamentId, groupMethod = '2-groups') {
  const matches = []
  
  if (qualifiedPlayers.length < 2) {
    return matches
  }
  
  const numPlayers = qualifiedPlayers.length
  
  // 按组和排名排序
  const sorted = [...qualifiedPlayers].sort((a, b) => {
    if (a.group && b.group && a.group !== b.group) {
      return a.group.localeCompare(b.group)
    }
    if (a.rank !== undefined && b.rank !== undefined) {
      return a.rank - b.rank
    }
    return 0
  })
  
  // 判断是2组模式还是4组模式
  const groups = new Set(sorted.map(p => p.group).filter(g => g))
  const isTwoGroups = groups.size === 2
  const hasGroups = groups.size > 0
  
  let baseId = Date.now()
  
  // 如果有分组（2组或4组），只生成半决赛
  if (hasGroups && (groupMethod === '2-groups' || groupMethod === '4-groups')) {
    if (numPlayers >= 4) {
      // 4人：生成半决赛
      if (isTwoGroups) {
        // 2组模式：A组第1 vs B组第2, B组第1 vs A组第2
        const a1 = sorted.find(p => p.group === 'A' && p.rank === 1)
        const a2 = sorted.find(p => p.group === 'A' && p.rank === 2)
        const b1 = sorted.find(p => p.group === 'B' && p.rank === 1)
        const b2 = sorted.find(p => p.group === 'B' && p.rank === 2)
        
        if (a1 && b2) {
          matches.push({
            id: baseId++,
            tournament_id: tournamentId,
            player1_id: a1.id,
            player1_name: a1.name,
            player2_id: b2.id,
            player2_name: b2.name,
            round: 'semi-final',
            status: 'pending',
            sets: [],
            created_at: new Date().toISOString()
          })
        }
        
        if (b1 && a2) {
          matches.push({
            id: baseId++,
            tournament_id: tournamentId,
            player1_id: b1.id,
            player1_name: b1.name,
            player2_id: a2.id,
            player2_name: a2.name,
            round: 'semi-final',
            status: 'pending',
            sets: [],
            created_at: new Date().toISOString()
          })
        }
      } else {
        // 4组模式：A组第1 vs B组第1, C组第1 vs D组第1
        const a1 = sorted.find(p => p.group === 'A' && p.rank === 1)
        const b1 = sorted.find(p => p.group === 'B' && p.rank === 1)
        const c1 = sorted.find(p => p.group === 'C' && p.rank === 1)
        const d1 = sorted.find(p => p.group === 'D' && p.rank === 1)
        
        if (a1 && b1) {
          matches.push({
            id: baseId++,
            tournament_id: tournamentId,
            player1_id: a1.id,
            player1_name: a1.name,
            player2_id: b1.id,
            player2_name: b1.name,
            round: 'semi-final',
            status: 'pending',
            sets: [],
            created_at: new Date().toISOString()
          })
        }
        
        if (c1 && d1) {
          matches.push({
            id: baseId++,
            tournament_id: tournamentId,
            player1_id: c1.id,
            player1_name: c1.name,
            player2_id: d1.id,
            player2_name: d1.name,
            round: 'semi-final',
            status: 'pending',
            sets: [],
            created_at: new Date().toISOString()
          })
        }
      }
    } else if (numPlayers === 2) {
      // 2人：直接决赛
      matches.push({
        id: baseId++,
        tournament_id: tournamentId,
        player1_id: sorted[0].id,
        player1_name: sorted[0].name,
        player2_id: sorted[1].id,
        player2_name: sorted[1].name,
        round: 'final',
        status: 'pending',
        sets: [],
        created_at: new Date().toISOString()
      })
    }
  } else {
    // 不分组模式：根据人数生成第一轮、第二轮等
    // 16人 -> 第一轮(16进8) -> 第二轮(8进4) -> 半决赛(4进2) -> 决赛(2进1)
    // 8人 -> 第一轮(8进4) -> 半决赛(4进2) -> 决赛(2进1)
    // 4人 -> 半决赛(4进2) -> 决赛(2进1)
    
    if (numPlayers >= 16) {
      // 16人：生成第一轮（16进8）
      for (let i = 0; i < 8; i++) {
        const p1 = sorted[i * 2]
        const p2 = sorted[i * 2 + 1]
        if (p1 && p2) {
          matches.push({
            id: baseId++,
            tournament_id: tournamentId,
            player1_id: p1.id,
            player1_name: p1.name,
            player2_id: p2.id,
            player2_name: p2.name,
            round: 'round-1',
            status: 'pending',
            sets: [],
            created_at: new Date().toISOString()
          })
        }
      }
    } else if (numPlayers >= 8) {
      // 8人：生成第一轮（8进4）
      for (let i = 0; i < 4; i++) {
        const p1 = sorted[i * 2]
        const p2 = sorted[i * 2 + 1]
        if (p1 && p2) {
          matches.push({
            id: baseId++,
            tournament_id: tournamentId,
            player1_id: p1.id,
            player1_name: p1.name,
            player2_id: p2.id,
            player2_name: p2.name,
            round: 'round-1',
            status: 'pending',
            sets: [],
            created_at: new Date().toISOString()
          })
        }
      }
    } else if (numPlayers >= 4) {
      // 4人：生成半决赛
      for (let i = 0; i < 2; i++) {
        const p1 = sorted[i * 2]
        const p2 = sorted[i * 2 + 1]
        if (p1 && p2) {
          matches.push({
            id: baseId++,
            tournament_id: tournamentId,
            player1_id: p1.id,
            player1_name: p1.name,
            player2_id: p2.id,
            player2_name: p2.name,
            round: 'semi-final',
            status: 'pending',
            sets: [],
            created_at: new Date().toISOString()
          })
        }
      }
    } else if (numPlayers === 2) {
      // 2人：直接决赛
      matches.push({
        id: baseId++,
        tournament_id: tournamentId,
        player1_id: sorted[0].id,
        player1_name: sorted[0].name,
        player2_id: sorted[1].id,
        player2_name: sorted[1].name,
        round: 'final',
        status: 'pending',
        sets: [],
        created_at: new Date().toISOString()
      })
    }
  }
  
  return matches
}

/**
 * 根据上一轮比赛结果生成下一轮对阵
 * @param {Array} completedMatches 已完成的比赛列表
 * @param {String} currentRound 当前轮次
 * @param {Number} tournamentId 比赛ID
 * @returns {Array} 下一轮对阵列表
 */
export function generateNextRoundMatches(completedMatches, currentRound, tournamentId) {
  const matches = []
  
  // 获取当前轮次的所有已完成比赛
  const roundMatches = completedMatches.filter(m => m.round === currentRound && m.status === 'finished')
  
  if (roundMatches.length === 0) {
    return matches
  }
  
  // 确定下一轮次
  let nextRound = null
  if (currentRound === 'round-of-16') {
    nextRound = 'quarter-final'
  } else if (currentRound === 'quarter-final') {
    nextRound = 'semi-final'
  } else if (currentRound === 'semi-final') {
    nextRound = 'final'
  } else {
    return matches // 决赛没有下一轮
  }
  
  // 获取胜者
  const winners = []
  roundMatches.forEach(match => {
    if (match.winner === 'player1') {
      winners.push({
        id: match.player1_id,
        name: match.player1_name,
        fromMatch: match.id
      })
    } else if (match.winner === 'player2') {
      winners.push({
        id: match.player2_id,
        name: match.player2_name,
        fromMatch: match.id
      })
    }
  })
  
  // 生成下一轮对阵（两两配对）
  let baseId = Date.now()
  for (let i = 0; i < winners.length; i += 2) {
    if (i + 1 < winners.length) {
      matches.push({
        id: baseId++,
        tournament_id: tournamentId,
        player1_id: winners[i].id,
        player1_name: winners[i].name,
        player2_id: winners[i + 1].id,
        player2_name: winners[i + 1].name,
        round: nextRound,
        status: 'pending',
        sets: [],
        created_at: new Date().toISOString()
      })
    }
  }
  
  return matches
}

