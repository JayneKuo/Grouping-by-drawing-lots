const express = require('express');
const router = express.Router();
const db = require('../config/database');
const auth = require('../middleware/auth');

// 获取所有比赛
router.get('/', auth, async (req, res) => {
  try {
    const [tournaments] = await db.execute(`
      SELECT t.*, u.username as creator_name,
      (SELECT COUNT(*) FROM players p WHERE p.tournament_id = t.id) as player_count
      FROM tournaments t
      LEFT JOIN users u ON t.created_by = u.id
      ORDER BY t.created_at DESC
    `);
    
    res.json({ success: true, data: tournaments });
  } catch (error) {
    console.error('获取比赛列表错误:', error);
    res.json({ success: false, message: error.message });
  }
});

// 获取单个比赛详情
router.get('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    
    const [tournaments] = await db.execute(
      'SELECT * FROM tournaments WHERE id = ?',
      [id]
    );
    
    if (tournaments.length === 0) {
      return res.json({ success: false, message: '比赛不存在' });
    }
    
    const tournament = tournaments[0];
    
    // 获取选手列表
    const [players] = await db.execute(
      'SELECT * FROM players WHERE tournament_id = ? ORDER BY group_name, name',
      [id]
    );
    
    // 获取比赛列表
    const [matches] = await db.execute(`
      SELECT m.*, 
      p1.name as player1_name, p2.name as player2_name
      FROM matches m
      LEFT JOIN players p1 ON m.player1_id = p1.id
      LEFT JOIN players p2 ON m.player2_id = p2.id
      WHERE m.tournament_id = ?
      ORDER BY m.group_name, m.round_type, m.created_at
    `, [id]);
    
    tournament.players = players;
    tournament.matches = matches;
    
    res.json({ success: true, data: tournament });
  } catch (error) {
    console.error('获取比赛详情错误:', error);
    res.json({ success: false, message: error.message });
  }
});

// 创建比赛
router.post('/', auth, async (req, res) => {
  try {
    const { name, format, scoringMethod, groupMethod } = req.body;
    const userId = req.user.userId;
    
    if (!name) {
      return res.json({ success: false, message: '比赛名称不能为空' });
    }
    
    const [result] = await db.execute(
      `INSERT INTO tournaments (name, format, scoring_method, group_method, created_by, status)
       VALUES (?, ?, ?, ?, ?, 'draft')`,
      [name, format || 'short-set', scoringMethod || 'no-ad', groupMethod || '2-groups', userId]
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

// 更新比赛
router.put('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, status, rulesLocked } = req.body;
    
    const updates = [];
    const values = [];
    
    if (name !== undefined) {
      updates.push('name = ?');
      values.push(name);
    }
    if (status !== undefined) {
      updates.push('status = ?');
      values.push(status);
    }
    if (rulesLocked !== undefined) {
      updates.push('rules_locked = ?');
      values.push(rulesLocked);
    }
    
    values.push(id);
    
    await db.execute(
      `UPDATE tournaments SET ${updates.join(', ')} WHERE id = ?`,
      values
    );
    
    res.json({ success: true, message: '更新成功' });
  } catch (error) {
    console.error('更新比赛错误:', error);
    res.json({ success: false, message: error.message });
  }
});

module.exports = router;

