// Vercel Serverless Function - 批量导入选手
const { kv } = require('@vercel/kv');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: '方法不允许' });
  }

  try {
    const { id } = req.query;
    const { players } = req.body;
    
    if (!players || !Array.isArray(players)) {
      return res.status(200).json({ success: false, message: 'players参数必须是数组' });
    }
    
    const tournaments = await kv.get('tournaments') || [];
    const tournamentIndex = tournaments.findIndex(t => t.id === parseInt(id));
    
    if (tournamentIndex === -1) {
      return res.status(200).json({ success: false, message: '比赛不存在' });
    }
    
    const tournament = tournaments[tournamentIndex];
    if (!tournament.players) {
      tournament.players = [];
    }
    
    // 检查重复
    const existingNames = tournament.players.map(p => p.name.toLowerCase());
    const newPlayers = players
      .filter(p => !existingNames.includes(p.name.toLowerCase()))
      .map((p, index) => ({
        id: (Date.now() + index).toString(),
        ...p,
        tournament_id: parseInt(id),
        status: p.status || 'pending'
      }));
    
    if (newPlayers.length === 0) {
      return res.status(200).json({ success: false, message: '所有选手已存在' });
    }
    
    tournament.players.push(...newPlayers);
    tournaments[tournamentIndex] = tournament;
    await kv.set('tournaments', tournaments);
    
    return res.status(200).json({
      success: true,
      message: `成功导入${newPlayers.length}名选手${players.length > newPlayers.length ? `（跳过${players.length - newPlayers.length}个重复）` : ''}`,
      data: newPlayers
    });
  } catch (error) {
    console.error('批量导入错误:', error);
    return res.status(200).json({ success: false, message: error.message });
  }
}
