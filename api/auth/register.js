// Vercel Serverless Function - 注册
const { kv } = require('@vercel/kv');
const bcrypt = require('bcryptjs');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: '方法不允许' });
  }

  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(200).json({ success: false, message: '用户名和密码不能为空' });
    }
    
    // 检查用户名是否已存在
    const userKey = `user:${username}`;
    const existing = await kv.get(userKey);
    
    if (existing) {
      return res.status(200).json({ success: false, message: '用户名已存在' });
    }
    
    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // 获取下一个用户ID
    const userIds = await kv.get('user:ids') || [];
    const newUserId = userIds.length > 0 ? Math.max(...userIds) + 1 : 1;
    userIds.push(newUserId);
    await kv.set('user:ids', userIds);
    
    // 创建用户
    const newUser = {
      id: newUserId,
      username,
      password: hashedPassword,
      role: 'user',
      created_at: new Date().toISOString()
    };
    
    await kv.set(userKey, newUser);
    
    return res.status(200).json({
      success: true,
      message: '注册成功',
      data: { userId: newUserId, username }
    });
  } catch (error) {
    console.error('注册错误:', error);
    return res.status(200).json({ success: false, message: '注册失败：' + error.message });
  }
}
