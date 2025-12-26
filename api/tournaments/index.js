// Vercel Serverless Function - 获取比赛列表/创建比赛
const { kv } = require('@vercel/kv');

module.exports = async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const tournaments = await kv.get('tournaments') || [];
      return res.status(200).json({ success: true, data: tournaments });
    } catch (error) {
      return res.status(200).json({ success: false, message: error.message });
    }
  }
  
  if (req.method === 'POST') {
    try {
      const { name, format, scoringMethod, groupMethod } = req.body;
      if (!name) {
        return res.status(200).json({ success: false, message: '比赛名称不能为空' });
      }
      
      const tournaments = await kv.get('tournaments') || [];
      const newTournament = {
        id: Date.now(),
        name,
        format: format || 'short-set',
        scoring_method: scoringMethod || 'no-ad',
        group_method: groupMethod || '2-groups',
        status: 'draft',
        players: [],
        created_at: new Date().toISOString()
      };
      
      tournaments.push(newTournament);
      await kv.set('tournaments', tournaments);
      
      return res.status(200).json({ success: true, message: '比赛创建成功', data: { id: newTournament.id } });
    } catch (error) {
      return res.status(200).json({ success: false, message: error.message });
    }
  }
  
  return res.status(405).json({ success: false, message: '方法不允许' });
}
