const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function initDatabase() {
  let connection;
  
  try {
    // 先连接到MySQL服务器（不指定数据库）
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || ''
    });
    
    console.log('✅ 已连接到MySQL服务器');
    
    // 创建数据库
    const dbName = process.env.DB_NAME || 'tennis_tournament';
    await connection.query(`CREATE DATABASE IF NOT EXISTS ${dbName} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    console.log(`✅ 数据库 ${dbName} 已创建或已存在`);
    
    // 使用数据库
    await connection.query(`USE ${dbName}`);
    
    // 读取SQL文件
    const sqlPath = path.join(__dirname, 'db.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // 分割SQL语句（按分号分割）
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('CREATE DATABASE'));
    
    // 执行SQL语句
    for (const statement of statements) {
      if (statement.length > 0) {
        try {
          await connection.query(statement);
        } catch (err) {
          // 忽略已存在的表错误
          if (!err.message.includes('already exists')) {
            console.warn('警告:', err.message);
          }
        }
      }
    }
    
    console.log('✅ 数据库表结构已创建');
    
    // 检查默认管理员账号
    const [users] = await connection.query('SELECT * FROM users WHERE username = ?', ['admin']);
    if (users.length === 0) {
      // 创建默认管理员（密码：admin123）
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await connection.query(
        'INSERT INTO users (username, password, role) VALUES (?, ?, ?)',
        ['admin', hashedPassword, 'admin']
      );
      console.log('✅ 默认管理员账号已创建：admin / admin123');
    } else {
      console.log('ℹ️  默认管理员账号已存在');
    }
    
    console.log('\n🎉 数据库初始化完成！');
    console.log('默认账号：admin / admin123');
    
  } catch (error) {
    console.error('❌ 数据库初始化失败:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.error('\n💡 提示：');
      console.error('1. 请确保MySQL服务已启动');
      console.error('2. 检查数据库配置（backend/.env文件）');
      console.error('3. 或者使用以下命令启动MySQL：');
      console.error('   Windows: net start mysql');
      console.error('   Linux/Mac: sudo service mysql start');
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('\n💡 提示：');
      console.error('数据库用户名或密码错误，请检查 backend/.env 文件');
    }
    
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// 运行初始化
initDatabase();

