const express = require('express');
const router = express.Router();
const db = require('../config/database');
const auth = require('../middleware/auth');

// 获取比赛列表
router.get('/tournament/:tournamentId', auth, async (req, res) => {
  try {
    const { tournamentId } = req.params;
    
    const [matches] = await db.execute(`
      SELECT m.*, 
      p1.name as player1_name, p2.name as player2_name
      FROM matches m
      LEFT JOIN players p1 ON m.player1_id = p1.id
      LEFT JOIN players p2 ON m.player2_id = p2.id
      WHERE m.tournament_id = ?
      ORDER BY m.group_name, m.round_type, m.created_at
    `, [tournamentId]);
    
    res.json({ success: true, data: matches });
  } catch (error) {
    console.error('获取比赛列表错误:', error);
    res.json({ success: false, message: error.message });
  }
});

// 创建比赛
router.post('/', auth, async (req, res) => {
  try {
    const { tournamentId, player1Id, player2Id, groupName, roundType } = req.body;
    
    const [result] = await db.execute(
      `INSERT INTO matches (tournament_id, player1_id, player2_id, group_name, round_type)
       VALUES (?, ?, ?, ?, ?)`,
      [tournamentId, player1Id, player2Id, groupName || null, roundType || 'group']
    );
    
    res.json({
      success: true,
      message: '比赛创建成功',
      data: { id: result.insertId }
    });
  } catch (error) {
    console.error('创建比赛错误:', error);
    res.json({ success: false, message: error.message });
  }
});

module.exports = router;

