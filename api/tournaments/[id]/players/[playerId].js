// Vercel Serverless Function - 删除选手
const { kv } = require('@vercel/kv');

module.exports = async function handler(req, res) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ success: false, message: '方法不允许' });
  }

  try {
    const { id, playerId } = req.query;
    
    const tournaments = await kv.get('tournaments') || [];
    const tournamentIndex = tournaments.findIndex(t => t.id === parseInt(id));
    
    if (tournamentIndex === -1) {
      return res.status(200).json({ success: false, message: '比赛不存在' });
    }
    
    const tournament = tournaments[tournamentIndex];
    if (tournament.players) {
      tournament.players = tournament.players.filter(p => p.id !== playerId);
      tournaments[tournamentIndex] = tournament;
      await kv.set('tournaments', tournaments);
    }
    
    return res.status(200).json({ success: true, message: '选手删除成功' });
  } catch (error) {
    return res.status(200).json({ success: false, message: error.message });
  }
}
