// 积分排名计算工具函数

/**
 * 计算小组积分排名
 * @param {Array} players 选手列表（已分组）
 * @param {Array} matches 比赛列表
 * @param {String} groupName 组名
 * @returns {Array} 排名列表
 */
export function calculateGroupRanking(players, matches, groupName) {
  // 筛选该组的选手和比赛
  const groupPlayers = players.filter(p => p.group === groupName)
  const groupMatches = matches.filter(m => m.group === groupName && m.status === 'finished')
  
  // 初始化统计数据
  const stats = {}
  groupPlayers.forEach(player => {
    stats[player.id] = {
      player: player,
      wins: 0,
      losses: 0,
      gamesWon: 0,
      gamesLost: 0,
      setsWon: 0,
      setsLost: 0,
      aces: 0,
      pointsWon: 0,
      pointsLost: 0
    }
  })
  
  // 统计比赛数据
  groupMatches.forEach(match => {
    const p1Id = match.player1_id
    const p2Id = match.player2_id
    
    if (!stats[p1Id] || !stats[p2Id]) return
    
    // 计算盘数
    const p1Sets = match.sets?.filter(s => s.winner === 'player1').length || 0
    const p2Sets = match.sets?.filter(s => s.winner === 'player2').length || 0
    
    // 计算局数
    let p1Games = 0
    let p2Games = 0
    match.sets?.forEach(set => {
      p1Games += set.player1Games || 0
      p2Games += set.player2Games || 0
    })
    
    // 更新统计
    if (match.winner === 'player1') {
      stats[p1Id].wins++
      stats[p2Id].losses++
    } else if (match.winner === 'player2') {
      stats[p1Id].losses++
      stats[p2Id].wins++
    }
    
    stats[p1Id].setsWon += p1Sets
    stats[p1Id].setsLost += p2Sets
    stats[p1Id].gamesWon += p1Games
    stats[p1Id].gamesLost += p2Games
    
    stats[p2Id].setsWon += p2Sets
    stats[p2Id].setsLost += p1Sets
    stats[p2Id].gamesWon += p2Games
    stats[p2Id].gamesLost += p1Games
  })
  
  // 转换为数组并计算积分
  const rankings = Object.values(stats).map(stat => ({
    ...stat,
    points: stat.wins * 3 + stat.losses * 0, // 胜3分，负0分
    gamesDifference: stat.gamesWon - stat.gamesLost,
    setsDifference: stat.setsWon - stat.setsLost
  }))
  
  // 排序：积分 -> 局数差 -> 直胜关系 -> ACE数 -> 净胜分
  rankings.sort((a, b) => {
    // 1. 积分
    if (b.points !== a.points) {
      return b.points - a.points
    }
    
    // 2. 局数差
    if (b.gamesDifference !== a.gamesDifference) {
      return b.gamesDifference - a.gamesDifference
    }
    
    // 3. 直胜关系
    const headToHead = getHeadToHead(a.player.id, b.player.id, groupMatches)
    if (headToHead !== 0) {
      return headToHead
    }
    
    // 4. ACE数差
    if (b.aces !== a.aces) {
      return b.aces - a.aces
    }
    
    // 5. 净胜分
    const aPointDiff = a.pointsWon - a.pointsLost
    const bPointDiff = b.pointsWon - b.pointsLost
    if (bPointDiff !== aPointDiff) {
      return bPointDiff - aPointDiff
    }
    
    return 0
  })
  
  // 添加排名
  rankings.forEach((rank, index) => {
    rank.rank = index + 1
  })
  
  return rankings
}

/**
 * 获取直胜关系
 * @param {String} player1Id 选手1 ID
 * @param {String} player2Id 选手2 ID
 * @param {Array} matches 比赛列表
 * @returns {Number} -1: player1胜, 1: player2胜, 0: 未交手或平局
 */
function getHeadToHead(player1Id, player2Id, matches) {
  const match = matches.find(m => 
    (m.player1_id === player1Id && m.player2_id === player2Id) ||
    (m.player1_id === player2Id && m.player2_id === player1Id)
  )
  
  if (!match || match.winner === 'player1') {
    if (match?.player1_id === player1Id) return -1
    if (match?.player1_id === player2Id) return 1
  } else if (match.winner === 'player2') {
    if (match?.player2_id === player1Id) return -1
    if (match?.player2_id === player2Id) return 1
  }
  
  return 0
}

/**
 * 获取所有组的排名
 * @param {Array} players 选手列表
 * @param {Array} matches 比赛列表
 * @returns {Object} 按组分类的排名
 */
export function getAllGroupRankings(players, matches) {
  const groups = {}
  
  // 按组分类
  players.forEach(player => {
    const group = player.group || 'A'
    if (!groups[group]) {
      groups[group] = []
    }
    groups[group].push(player)
  })
  
  // 计算每组排名
  const rankings = {}
  Object.keys(groups).forEach(groupName => {
    rankings[groupName] = calculateGroupRanking(players, matches, groupName)
  })
  
  return rankings
}

/**
 * 获取出线选手（每组前2名）
 * @param {Object} rankings 所有组的排名
 * @returns {Array} 出线选手列表（按排名排序）
 */
export function getQualifiedPlayers(rankings) {
  const qualified = []
  
  Object.keys(rankings).forEach(groupName => {
    const groupRanking = rankings[groupName]
    // 取前2名
    const top2 = groupRanking.slice(0, 2)
    top2.forEach(player => {
      qualified.push({
        ...player.player,
        group: groupName,
        rank: player.rank
      })
    })
  })
  
  // 按组和排名排序
  qualified.sort((a, b) => {
    if (a.group !== b.group) {
      return a.group.localeCompare(b.group)
    }
    return a.rank - b.rank
  })
  
  return qualified
}

