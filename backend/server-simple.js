// 简化版服务器（无需MySQL）
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 使用简化版数据库
const db = require('./config/database-simple');

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: '服务器运行正常（简化版，无需MySQL）' });
});

// 注册
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.json({ success: false, message: '用户名和密码不能为空' });
    }
    
    const existing = await db.findUser(username);
    if (existing) {
      return res.json({ success: false, message: '用户名已存在' });
    }
    
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const user = await db.createUser({
      username,
      password: hashedPassword,
      role: 'user'
    });
    
    res.json({ success: true, message: '注册成功', data: { userId: user.id, username } });
  } catch (error) {
    res.json({ success: false, message: '注册失败：' + error.message });
  }
});

// 登录
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.json({ success: false, message: '用户名和密码不能为空' });
    }
    
    // 确保默认账号已初始化
    await db.initDefaultUsers();
    
    const user = await db.findUser(username);
    if (!user) {
      return res.json({ success: false, message: '用户名或密码错误' });
    }
    
    const bcrypt = require('bcryptjs');
    const isValid = await bcrypt.compare(password, user.password);
    
    if (!isValid) {
      return res.json({ success: false, message: '用户名或密码错误' });
    }
    
    // 简化版：不使用JWT，直接返回用户信息
    res.json({
      success: true,
      message: '登录成功',
      data: {
        token: 'simple-token-' + user.id,
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

// 获取比赛列表
app.get('/api/tournaments', async (req, res) => {
  try {
    const tournaments = await db.getTournaments();
    res.json({ success: true, data: tournaments });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

// 获取比赛详情
app.get('/api/tournaments/:id', async (req, res) => {
  try {
    const tournament = await db.getTournament(req.params.id);
    if (!tournament) {
      return res.json({ success: false, message: '比赛不存在' });
    }
    res.json({ success: true, data: tournament });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

// 创建比赛
app.post('/api/tournaments', async (req, res) => {
  try {
    const { name, format, scoringMethod, groupMethod } = req.body;
    if (!name) {
      return res.json({ success: false, message: '比赛名称不能为空' });
    }
    
    const tournament = await db.createTournament({
      name,
      format: format || 'short-set',
      scoring_method: scoringMethod || 'no-ad',
      group_method: groupMethod || '2-groups',
      status: 'draft',
      created_by: 1,
      players: [] // 初始化空选手列表
    });
    
    res.json({ success: true, message: '比赛创建成功', data: { id: tournament.id } });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

// 批量导入选手（必须在单个添加之前，因为路由更具体）
app.post('/api/tournaments/:id/players/batch', async (req, res) => {
  console.log('📥 [批量导入] 收到请求 - ID:', req.params.id);
  console.log('📥 [批量导入] 请求体:', JSON.stringify(req.body, null, 2));
  
  try {
    const { id } = req.params;
    const { players } = req.body;
    
    if (!players || !Array.isArray(players)) {
      console.error('❌ [批量导入] players参数不是数组:', typeof players);
      return res.json({ success: false, message: 'players参数必须是数组' });
    }
    
    console.log('📥 [批量导入] 选手数量:', players.length);
    
    const tournament = await db.getTournament(id);
    if (!tournament) {
      console.error('❌ [批量导入] 比赛不存在:', id);
      return res.json({ success: false, message: '比赛不存在' });
    }
    
    if (!tournament.players) {
      tournament.players = [];
    }
    
    // 检查重复
    const existingNames = tournament.players.map(p => p.name.toLowerCase());
    const newPlayers = players
      .filter(p => !existingNames.includes(p.name.toLowerCase()))
      .map((p, index) => ({
        id: (Date.now() + index).toString(),
        ...p,
        tournament_id: parseInt(id),
        status: p.status || 'pending'
      }));
    
    if (newPlayers.length === 0) {
      console.log('⚠️ [批量导入] 所有选手已存在');
      return res.json({ success: false, message: '所有选手已存在' });
    }
    
    tournament.players.push(...newPlayers);
    await db.updateTournament(id, { players: tournament.players });
    
    console.log('✅ [批量导入] 成功添加', newPlayers.length, '名选手');
    
    res.json({ 
      success: true, 
      message: `成功导入${newPlayers.length}名选手${players.length > newPlayers.length ? `（跳过${players.length - newPlayers.length}个重复）` : ''}`, 
      data: newPlayers 
    });
  } catch (error) {
    console.error('❌ [批量导入] 错误:', error);
    res.json({ success: false, message: error.message });
  }
});

// 添加单个选手（必须在批量导入之后，因为路由更通用）
app.post('/api/tournaments/:id/players', async (req, res) => {
  console.log('📥 [单个添加] 收到请求 - ID:', req.params.id);
  console.log('📥 [单个添加] 请求体:', JSON.stringify(req.body, null, 2));
  
  try {
    const { id } = req.params;
    const player = req.body;
    
    const tournament = await db.getTournament(id);
    if (!tournament) {
      console.error('❌ [单个添加] 比赛不存在:', id);
      return res.json({ success: false, message: '比赛不存在' });
    }
    
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
    await db.updateTournament(id, { players: tournament.players });
    
    console.log('✅ [单个添加] 成功添加选手:', newPlayer.name);
    
    res.json({ success: true, message: '选手添加成功', data: newPlayer });
  } catch (error) {
    console.error('❌ [单个添加] 错误:', error);
    res.json({ success: false, message: error.message });
  }
});

// 删除选手
app.delete('/api/tournaments/:id/players/:playerId', async (req, res) => {
  try {
    const { id, playerId } = req.params;
    
    const tournament = await db.getTournament(id);
    if (!tournament) {
      return res.json({ success: false, message: '比赛不存在' });
    }
    
    if (tournament.players) {
      tournament.players = tournament.players.filter(p => p.id !== playerId);
      await db.updateTournament(id, { players: tournament.players });
    }
    
    res.json({ success: true, message: '选手删除成功' });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

// 404处理（必须在所有路由之后）
app.use('/api', (req, res, next) => {
  console.error('❌ [404] 未找到路由:', req.method, req.originalUrl);
  console.error('   请求路径:', req.path);
  console.error('   原始URL:', req.originalUrl);
  res.status(404).json({ success: false, message: `路由不存在: ${req.method} ${req.originalUrl}` });
});

// 错误处理
app.use((err, req, res, next) => {
  console.error('❌ [错误]', err.stack);
  res.status(500).json({ success: false, message: err.message || '服务器内部错误' });
});

// 启动服务器
app.listen(PORT, async () => {
  console.log(`🚀 服务器运行在 http://localhost:${PORT}`);
  console.log(`📝 使用简化版（无需MySQL）`);
  console.log(`\n💡 内置账号：`);
  console.log(`   管理员：admin / admin123`);
  console.log(`   用户1：user1 / user123`);
  console.log(`   用户2：user2 / user123`);
  console.log(`   用户3：user3 / user123`);
  console.log(`\n📋 已注册的路由：`);
  console.log(`   POST /api/tournaments/:id/players/batch (批量导入)`);
  console.log(`   POST /api/tournaments/:id/players (单个添加)`);
  console.log(`   DELETE /api/tournaments/:id/players/:playerId (删除选手)`);
  console.log(`   GET  /api/tournaments/:id (获取比赛详情)`);
  console.log(`   POST /api/tournaments (创建比赛)`);
  console.log(`   GET  /api/tournaments (获取比赛列表)`);
  console.log(`   POST /api/auth/login (登录)`);
  console.log(`   POST /api/auth/register (注册)`);
  console.log(`   GET  /api/health (健康检查)`);
  console.log(`\n`);
  
  // 初始化默认账号
  await db.initDefaultUsers();
  
  // 验证路由注册
  console.log('🔍 实际注册的路由列表：');
  app._router.stack.forEach((middleware, index) => {
    if (middleware.route) {
      const methods = Object.keys(middleware.route.methods).map(m => m.toUpperCase()).join(', ');
      console.log(`   ${methods} ${middleware.route.path}`);
    }
  });
  console.log('');
});

