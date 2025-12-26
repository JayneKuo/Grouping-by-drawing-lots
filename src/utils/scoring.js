// 网球计分工具函数

/**
 * 记录得分
 * @param {Object} match 比赛对象
 * @param {Number} playerIndex 得分选手索引 (0或1)
 * @param {String} scoringMethod 计分方式 ('ad' 或 'no-ad')
 * @param {String} format 比赛格式 ('short-set' | 'best-of-3' | 'best-of-5')
 * @returns {Object} 更新后的比赛对象
 */
export function recordPoint(match, playerIndex, scoringMethod = 'no-ad', format = null) {
  // 确保match有format属性
  if (!match.format) {
    match.format = 'short-set'
  }
  
  if (!match.currentSet) {
    match.currentSet = {
      player1Games: 0,
      player2Games: 0,
      player1Points: 0,
      player2Points: 0,
      isTiebreak: false,
      tiebreakScore: { player1: 0, player2: 0 },
      currentServer: 0, // 默认player1发球
      serveState: 'first', // 一发/二发状态: 'first' | 'second'
      isGoldenPoint: false, // 是否是金球
      games: [] // 记录每一局的比分
    }
  }
  
  // 确保有发球方设置
  if (match.currentSet.currentServer === undefined) {
    match.currentSet.currentServer = 0
  }
  
  // 确保有发球状态
  if (match.currentSet.serveState === undefined) {
    match.currentSet.serveState = 'first'
  }
  
  // 确保有games数组
  if (!match.currentSet.games) {
    match.currentSet.games = []
  }
  
  const set = match.currentSet
  const isTiebreak = set.isTiebreak
  
  if (isTiebreak) {
    // 抢七计分
    if (playerIndex === 0) {
      set.tiebreakScore.player1++
    } else {
      set.tiebreakScore.player2++
    }
    
    // 抢七发球方切换规则（网球标准规则）：
    // 第1分：当前发球方发球
    // 第2-3分：对手连续发球（第1分后切换）
    // 第4-5分：当前发球方连续发球（第3分后切换）
    // 第6-7分：对手连续发球（第5分后切换）
    // 之后每2分切换一次
    const totalPoints = set.tiebreakScore.player1 + set.tiebreakScore.player2
    
    // 切换时机：第1分后、第3分后、第5分后、第7分后...
    // 即：totalPoints 为奇数且 >= 1 时切换（但第1分后切换，第3、5、7...分后也切换）
    if (totalPoints === 1) {
      // 第1分后，切换到对手发球（第2-3分由对手发）
      if (set.currentServer !== undefined) {
        set.currentServer = set.currentServer === 0 ? 1 : 0
      }
    } else if (totalPoints >= 3 && totalPoints % 2 === 1) {
      // 第3分、第5分、第7分...后切换发球方
      // 即：第3分后（第4分开始），第5分后（第6分开始），第7分后（第8分开始）...
      if (set.currentServer !== undefined) {
        set.currentServer = set.currentServer === 0 ? 1 : 0
      }
    }
    
    // 检查抢七是否结束（先到7分且领先2分，或先到10分）
    const p1Score = set.tiebreakScore.player1
    const p2Score = set.tiebreakScore.player2
    
    if ((p1Score >= 7 && p1Score - p2Score >= 2) || p1Score >= 10) {
      // 选手1赢得抢七
      set.player1Games++
      finishSet(match, 0)
    } else if ((p2Score >= 7 && p2Score - p1Score >= 2) || p2Score >= 10) {
      // 选手2赢得抢七
      set.player2Games++
      finishSet(match, 1)
    }
  } else {
    // 正常局分
    if (playerIndex === 0) {
      set.player1Points++
    } else {
      set.player2Points++
    }
    
    const p1Points = set.player1Points
    const p2Points = set.player2Points
    
    // 检查是否赢得这一局
    let gameWon = false
    let winner = null
    
    // 检查是否是金球情况（40-40时）
    const isDeuce = p1Points >= 3 && p2Points >= 3 && p1Points === p2Points
    const isGoldenPointSituation = isDeuce && set.isGoldenPoint
    
    if (scoringMethod === 'no-ad') {
      // 金球制：40-40时下一分直接决定胜负
      if (p1Points >= 4 && p1Points > p2Points) {
        gameWon = true
        winner = 0
      } else if (p2Points >= 4 && p2Points > p1Points) {
        gameWon = true
        winner = 1
      } else if (p1Points >= 3 && p2Points >= 3 && p1Points !== p2Points) {
        // 40-40后，下一分直接决定胜负（金球）
        gameWon = true
        winner = p1Points > p2Points ? 0 : 1
      }
    } else {
      // 占先制：需要领先2分
      if (p1Points >= 4 && p1Points - p2Points >= 2) {
        gameWon = true
        winner = 0
      } else if (p2Points >= 4 && p2Points - p1Points >= 2) {
        gameWon = true
        winner = 1
      } else if (p1Points >= 3 && p2Points >= 3) {
        // Deuce情况：40-40
        // 如果设置了金球，下一分直接决定胜负
        if (isGoldenPointSituation && p1Points !== p2Points) {
          gameWon = true
          winner = p1Points > p2Points ? 0 : 1
        }
      }
    }
    
    if (gameWon) {
      // 记录这一局的比分
      const gameScore = {
        gameNumber: set.games.length + 1,
        player1Points: set.player1Points,
        player2Points: set.player2Points,
        winner: winner === 0 ? 'player1' : 'player2',
        server: set.currentServer,
        firstServeIn: true, // 默认一发成功，如果是一发失误会在外部设置
        isAce: false, // 是否ACE球，需要在外部设置
        isDoubleFault: false // 是否双误，需要在外部设置
      }
      set.games.push(gameScore)
      
      // 赢得这一局
      if (winner === 0) {
        set.player1Games++
      } else {
        set.player2Games++
      }
      
      // 重置局分
      set.player1Points = 0
      set.player2Points = 0
      set.serveState = 'first' // 重置为一发
      set.isGoldenPoint = false // 重置金球状态
      
      // 切换发球方（每局结束后）
      if (set.currentServer !== undefined) {
        set.currentServer = set.currentServer === 0 ? 1 : 0
      }
      
      // 使用传入的format参数，如果没有则使用match.format
      const matchFormat = format || match.format || 'short-set'
      
      // 短盘制：先胜4局就赢，3-3时抢七
      if (matchFormat === 'short-set') {
        const p1Games = set.player1Games
        const p2Games = set.player2Games
        
        // 检查是否需要抢七（3-3时）
        if (p1Games === 3 && p2Games === 3) {
          set.isTiebreak = true
          set.tiebreakScore = { player1: 0, player2: 0 }
          // 抢七第一分由当前发球方发球（不切换）
          // currentServer已经在上面设置好了，不需要改变
        } else {
          // 检查是否赢得这一盘（先到4局）
          if (p1Games >= 4) {
            finishSet(match, 0, matchFormat)
          } else if (p2Games >= 4) {
            finishSet(match, 1, matchFormat)
          }
        }
      } else {
        // 标准制：6-6时抢七，先到6局且领先2局
        if (set.player1Games === 6 && set.player2Games === 6) {
          set.isTiebreak = true
          set.tiebreakScore = { player1: 0, player2: 0 }
          // 抢七第一分由当前发球方发球（不切换）
          // currentServer已经在上面设置好了，不需要改变
        } else {
          // 检查是否赢得这一盘
          const p1Games = set.player1Games
          const p2Games = set.player2Games
          
          if (p1Games >= 6 && p1Games - p2Games >= 2) {
            finishSet(match, 0, matchFormat)
          } else if (p2Games >= 6 && p2Games - p1Games >= 2) {
            finishSet(match, 1, matchFormat)
          }
        }
      }
    }
  }
  
  return match
}

/**
 * 完成一盘
 * @param {Object} match 比赛对象
 * @param {Number} winnerIndex 获胜选手索引
 */
function finishSet(match, winnerIndex, format = null) {
  if (!match.sets) {
    match.sets = []
  }
  
  const set = match.currentSet
  match.sets.push({
    player1Games: set.player1Games,
    player2Games: set.player2Games,
    winner: winnerIndex === 0 ? 'player1' : 'player2',
    isTiebreak: set.isTiebreak,
    tiebreakScore: set.isTiebreak ? { ...set.tiebreakScore } : null,
    games: set.games ? [...set.games] : [] // 保存所有局的比分记录
  })
  
  // 检查比赛是否结束
  const matchFormat = format || match.format || 'short-set'
  let setsToWin = 1
  
  if (matchFormat === 'best-of-3') {
    setsToWin = 2
  } else if (matchFormat === 'best-of-5') {
    setsToWin = 3
  }
  
  const player1Sets = match.sets.filter(s => s.winner === 'player1').length
  const player2Sets = match.sets.filter(s => s.winner === 'player2').length
  
  if (player1Sets >= setsToWin || player2Sets >= setsToWin) {
    match.status = 'finished'
    match.winner = player1Sets >= setsToWin ? 'player1' : 'player2'
  } else {
    // 开始新的一盘
    // 第一盘由player1发球，之后每盘交替
    const setNumber = match.sets.length + 1
    const newSetServer = setNumber % 2 === 1 ? 0 : 1
    
    match.currentSet = {
      player1Games: 0,
      player2Games: 0,
      player1Points: 0,
      player2Points: 0,
      isTiebreak: false,
      tiebreakScore: { player1: 0, player2: 0 },
      currentServer: newSetServer,
      serveState: 'first', // 新的一盘，重置为一发
      isGoldenPoint: false, // 重置金球状态
      games: [] // 新的一盘，重置局分记录
    }
  }
}

/**
 * 获取比分显示文本
 * @param {Object} match 比赛对象
 * @returns {String} 比分文本
 */
export function getScoreText(match) {
  if (!match.currentSet) {
    return '0-0'
  }
  
  const set = match.currentSet
  
  if (set.isTiebreak) {
    return `${set.player1Games}-${set.player2Games} (${set.tiebreakScore.player1}-${set.tiebreakScore.player2})`
  }
  
  const pointMap = { 0: '0', 1: '15', 2: '30', 3: '40', 4: 'AD' }
  const p1Point = pointMap[set.player1Points] || set.player1Points
  const p2Point = pointMap[set.player2Points] || set.player2Points
  
  return `${set.player1Games}-${set.player2Games} (${p1Point}-${p2Point})`
}

/**
 * 记录一发失误
 * @param {Object} match 比赛对象
 * @param {Number} playerIndex 发球方索引 (0或1)
 * @returns {Object} 更新后的比赛对象
 */
export function recordFirstServeFault(match, playerIndex) {
  if (!match.currentSet) {
    return match
  }
  
  const set = match.currentSet
  
  // 只有当前发球方才能有一发失误
  if (set.currentServer !== playerIndex) {
    return match
  }
  
  // 如果是一发，切换到二发
  if (set.serveState === 'first') {
    set.serveState = 'second'
  }
  
  return match
}

/**
 * 记录二发失误（双误）
 * @param {Object} match 比赛对象
 * @param {Number} playerIndex 发球方索引 (0或1)
 * @param {String} scoringMethod 计分方式
 * @returns {Object} 更新后的比赛对象
 */
export function recordDoubleFault(match, playerIndex, scoringMethod = 'no-ad') {
  if (!match.currentSet) {
    return match
  }
  
  const set = match.currentSet
  
  // 只有当前发球方才能有双误
  if (set.currentServer !== playerIndex) {
    return match
  }
  
  // 双误：接球方得分
  const receiver = playerIndex === 0 ? 1 : 0
  return recordPoint(match, receiver, scoringMethod)
}

/**
 * 设置金球状态
 * @param {Object} match 比赛对象
 * @param {Boolean} isGoldenPoint 是否是金球
 * @returns {Object} 更新后的比赛对象
 */
export function setGoldenPoint(match, isGoldenPoint) {
  if (!match.currentSet) {
    return match
  }
  
  match.currentSet.isGoldenPoint = isGoldenPoint
  return match
}

/**
 * 撤销上一步操作
 * @param {Object} match 比赛对象
 * @param {Array} history 操作历史
 * @returns {Object} 更新后的比赛对象
 */
export function undoLastAction(match, history) {
  if (!history || history.length === 0) {
    return match
  }
  
  // 这里可以实现撤销逻辑
  // 简化版：重新计算比分
  return match
}

