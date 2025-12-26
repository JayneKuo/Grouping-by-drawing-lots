// Vercel Serverless Function - 登录
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
    
    // 初始化默认账号（如果不存在）
    await initDefaultUsers();
    
    // 从KV获取用户
    const userKey = `user:${username}`;
    const user = await kv.get(userKey);
    
    if (!user) {
      return res.status(200).json({ success: false, message: '用户名或密码错误' });
    }
    
    // 验证密码
    const isValid = await bcrypt.compare(password, user.password);
    
    if (!isValid) {
      return res.status(200).json({ success: false, message: '用户名或密码错误' });
    }
    
    // 生成简单token
    const token = `token-${user.id}-${Date.now()}`;
    
    return res.status(200).json({
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
    return res.status(200).json({ success: false, message: '登录失败：' + error.message });
  }
}

async function initDefaultUsers() {
  const defaultUsers = [
    { id: 1, username: 'admin', password: 'admin123', role: 'admin' },
    { id: 2, username: 'user1', password: 'user123', role: 'user' },
    { id: 3, username: 'user2', password: 'user123', role: 'user' },
    { id: 4, username: 'user3', password: 'user123', role: 'user' }
  ];
  
  for (const user of defaultUsers) {
    const userKey = `user:${user.username}`;
    const exists = await kv.get(userKey);
    if (!exists) {
      const hashedPassword = await bcrypt.hash(user.password, 10);
      await kv.set(userKey, {
        ...user,
        password: hashedPassword
      });
    }
  }
}
