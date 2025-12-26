const express = require('express');
const router = express.Router();
const db = require('../config/database');
const auth = require('../middleware/auth');

// 记录比分
router.post('/', auth, async (req, res) => {
  try {
    const { matchId, setNumber, playerId, pointType, gameScore, servingPlayer, isTiebreak } = req.body;
    const userId = req.user.userId;
    
    // 这里需要实现完整的计分逻辑
    // 简化版本，实际需要根据比赛规则计算
    
    res.json({ success: true, message: '比分记录成功' });
  } catch (error) {
    console.error('记录比分错误:', error);
    res.json({ success: false, message: error.message });
  }
});

// 获取比赛比分
router.get('/match/:matchId', auth, async (req, res) => {
  try {
    const { matchId } = req.params;
    
    const [sets] = await db.execute(
      'SELECT * FROM sets WHERE match_id = ? ORDER BY set_number',
      [matchId]
    );
    
    const [scores] = await db.execute(
      'SELECT * FROM scores WHERE match_id = ? ORDER BY recorded_at',
      [matchId]
    );
    
    res.json({ success: true, data: { sets, scores } });
  } catch (error) {
    console.error('获取比分错误:', error);
    res.json({ success: false, message: error.message });
  }
});

module.exports = router;

