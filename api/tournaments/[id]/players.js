// Vercel Serverless Function - 添加单个选手
const { kv } = require('@vercel/kv');

module.exports = async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const { id } = req.query;
      const player = req.body;
      
      const tournaments = await kv.get('tournaments') || [];
      const tournamentIndex = tournaments.findIndex(t => t.id === parseInt(id));
      
      if (tournamentIndex === -1) {
        return res.status(200).json({ success: false, message: '比赛不存在' });
      }
      
      const tournament = tournaments[tournamentIndex];
      if (!tournament.players) {
        tournament.players = [];
      }
      
      const newPlayer = {
        id: Date.now().toString(),
        ...player,
        tournament_id: parseInt(id),
        status: player.status || 'pending'
      };
      
      tournament.players.push(newPlayer);
      tournaments[tournamentIndex] = tournament;
      await kv.set('tournaments', tournaments);
      
      return res.status(200).json({ success: true, message: '选手添加成功', data: newPlayer });
    } catch (error) {
      console.error('添加选手错误:', error);
      return res.status(200).json({ success: false, message: error.message });
    }
  }
  
  return res.status(405).json({ success: false, message: '方法不允许' });
}
