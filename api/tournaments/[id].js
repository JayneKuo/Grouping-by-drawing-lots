// Vercel Serverless Function - 获取比赛详情
const { kv } = require('@vercel/kv');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: '方法不允许' });
  }

  try {
    const { id } = req.query;
    const tournaments = await kv.get('tournaments') || [];
    const tournament = tournaments.find(t => t.id === parseInt(id));
    
    if (!tournament) {
      return res.status(200).json({ success: false, message: '比赛不存在' });
    }
    
    return res.status(200).json({ success: true, data: tournament });
  } catch (error) {
    return res.status(200).json({ success: false, message: error.message });
  }
}
