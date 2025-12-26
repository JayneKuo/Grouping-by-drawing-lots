/**
 * 生成占位符淘汰赛对阵（分组完成后立即显示，选手为"待定"）
 * @param {String} groupMethod 分组方式（'2-groups', '4-groups'）
 * @param {Number} tournamentId 比赛ID
 * @returns {Array} 占位符对阵列表
 */
export function generatePlaceholderKnockoutMatches(groupMethod, tournamentId) {
  const matches = []
  let baseId = Date.now() + 10000 // 确保ID不冲突
  
  if (groupMethod === '2-groups') {
    // 2组模式：生成2场半决赛和1场决赛
    // 半决赛1：A组第1 vs B组第2
    matches.push({
      id: baseId++,
      tournament_id: tournamentId,
      player1_id: null,
      player1_name: 'A组第1名（待定）',
      player2_id: null,
      player2_name: 'B组第2名（待定）',
      round: 'semi-final',
      status: 'pending',
      sets: [],
      isPlaceholder: true,
      created_at: new Date().toISOString()
    })
    
    // 半决赛2：B组第1 vs A组第2
    matches.push({
      id: baseId++,
      tournament_id: tournamentId,
      player1_id: null,
      player1_name: 'B组第1名（待定）',
      player2_id: null,
      player2_name: 'A组第2名（待定）',
      round: 'semi-final',
      status: 'pending',
      sets: [],
      isPlaceholder: true,
      created_at: new Date().toISOString()
    })
    
    // 决赛：半决赛1胜者 vs 半决赛2胜者
    matches.push({
      id: baseId++,
      tournament_id: tournamentId,
      player1_id: null,
      player1_name: '半决赛1胜者（待定）',
      player2_id: null,
      player2_name: '半决赛2胜者（待定）',
      round: 'final',
      status: 'pending',
      sets: [],
      isPlaceholder: true,
      created_at: new Date().toISOString()
    })
  } else if (groupMethod === '4-groups') {
    // 4组模式：生成2场半决赛和1场决赛
    // 半决赛1：A组第1 vs B组第1
    matches.push({
      id: baseId++,
      tournament_id: tournamentId,
      player1_id: null,
      player1_name: 'A组第1名（待定）',
      player2_id: null,
      player2_name: 'B组第1名（待定）',
      round: 'semi-final',
      status: 'pending',
      sets: [],
      isPlaceholder: true,
      created_at: new Date().toISOString()
    })
    
    // 半决赛2：C组第1 vs D组第1
    matches.push({
      id: baseId++,
      tournament_id: tournamentId,
      player1_id: null,
      player1_name: 'C组第1名（待定）',
      player2_id: null,
      player2_name: 'D组第1名（待定）',
      round: 'semi-final',
      status: 'pending',
      sets: [],
      isPlaceholder: true,
      created_at: new Date().toISOString()
    })
    
    // 决赛：半决赛1胜者 vs 半决赛2胜者
    matches.push({
      id: baseId++,
      tournament_id: tournamentId,
      player1_id: null,
      player1_name: '半决赛1胜者（待定）',
      player2_id: null,
      player2_name: '半决赛2胜者（待定）',
      round: 'final',
      status: 'pending',
      sets: [],
      isPlaceholder: true,
      created_at: new Date().toISOString()
    })
  }
  
  return matches
}

