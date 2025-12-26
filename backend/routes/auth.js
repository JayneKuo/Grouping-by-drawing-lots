const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');

// 注册
router.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.json({ success: false, message: '用户名和密码不能为空' });
    }
    
    if (username.length < 2 || username.length > 20) {
      return res.json({ success: false, message: '用户名长度2-20个字符' });
    }
    
    if (password.length < 6) {
      return res.json({ success: false, message: '密码至少6个字符' });
    }
    
    // 检查用户名是否已存在
    const [existing] = await db.execute(
      'SELECT id FROM users WHERE username = ?',
      [username]
    );
    
    if (existing.length > 0) {
      return res.json({ success: false, message: '用户名已存在' });
    }
    
    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // 创建用户
    const [result] = await db.execute(
      'INSERT INTO users (username, password) VALUES (?, ?)',
      [username, hashedPassword]
    );
    
    res.json({
      success: true,
      message: '注册成功',
      data: { userId: result.insertId, username }
    });
  } catch (error) {
    console.error('注册错误:', error);
    res.json({ success: false, message: '注册失败：' + error.message });
  }
});

// 登录
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.json({ success: false, message: '用户名和密码不能为空' });
    }
    
    // 查找用户
    const [users] = await db.execute(
      'SELECT id, username, password, role FROM users WHERE username = ?',
      [username]
    );
    
    if (users.length === 0) {
      return res.json({ success: false, message: '用户名或密码错误' });
    }
    
    const user = users[0];
    
    // 验证密码
    const isValid = await bcrypt.compare(password, user.password);
    
    if (!isValid) {
      return res.json({ success: false, message: '用户名或密码错误' });
    }
    
    // 生成token
    const token = jwt.sign(
      { userId: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET || 'default-secret',
      { expiresIn: '7d' }
    );
    
    res.json({
      success: true,
      message: '登录成功',
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          role: user.role
        }
      }
    });
  } catch (error) {
    console.error('登录错误:', error);
    res.json({ success: false, message: '登录失败：' + error.message });
  }
});

module.exports = router;

