# 球搭子网球赛事管理系统 - Vercel部署版

## 🎯 完全适配Vercel部署，无需自己的服务器！

## ✨ 主要特点

1. **Serverless架构** - 使用Vercel Serverless Functions
2. **Vercel KV存储** - 数据持久化，多用户同步
3. **内置账号** - 4个默认账号，开箱即用
4. **完全免费** - Vercel免费套餐足够使用

## 🚀 快速部署

### 1. 准备Vercel KV

#### 方法A：通过Vercel Dashboard
1. 访问 https://vercel.com/dashboard
2. 创建新项目
3. 进入 Storage → Create Database → KV
4. 创建KV数据库

#### 方法B：通过CLI
```bash
vercel kv create tennis-tournament-db
```

### 2. 设置环境变量

在Vercel Dashboard的项目设置 → Environment Variables中添加：

```
KV_REST_API_URL=https://你的KV地址.kv.vercel-storage.com
KV_REST_API_TOKEN=你的Token
KV_REST_API_READ_ONLY_TOKEN=你的只读Token（可选）
```

### 3. 部署

#### 方法A：通过GitHub（推荐）
1. 将代码推送到GitHub
2. 在Vercel Dashboard中导入项目
3. 自动部署完成

#### 方法B：通过CLI
```bash
npm install -g vercel
vercel login
vercel
```

## 📋 内置账号

| 账号 | 密码 | 角色 |
|------|------|------|
| admin | admin123 | 管理员 |
| user1 | user123 | 普通用户 |
| user2 | user123 | 普通用户 |
| user3 | user123 | 普通用户 |

## 🔧 本地开发

### 使用Vercel KV

1. 安装依赖：
```bash
npm install
```

2. 创建`.env.local`文件：
```
KV_REST_API_URL=你的KV_URL
KV_REST_API_TOKEN=你的KV_TOKEN
```

3. 启动开发服务器：
```bash
vercel dev
```

### 使用本地后端（备选）

如果不想使用Vercel KV，可以继续使用本地后端：
```bash
npm start
```

## 📦 API端点

所有API都在`/api`路径下：

- `GET /api/health` - 健康检查
- `POST /api/auth/login` - 登录
- `POST /api/auth/register` - 注册
- `GET /api/tournaments` - 获取比赛列表
- `POST /api/tournaments` - 创建比赛
- `GET /api/tournaments/[id]` - 获取比赛详情
- `POST /api/tournaments/[id]/players` - 添加单个选手
- `POST /api/tournaments/[id]/players/batch` - 批量导入选手
- `DELETE /api/tournaments/[id]/players/[playerId]` - 删除选手

## 💡 优势

1. **完全免费** - Vercel免费套餐足够小型比赛使用
2. **自动扩展** - Serverless自动处理流量
3. **全球CDN** - 自动CDN加速，访问速度快
4. **数据同步** - 所有用户共享同一数据源
5. **无需维护** - 无需管理服务器，自动更新

## 📝 注意事项

1. **Vercel KV限制**（免费套餐）：
   - 256MB存储空间
   - 10,000次读取/天
   - 1,000次写入/天
   - 对于小型比赛（<100场比赛）足够使用

2. **数据备份**：
   - 建议定期导出数据
   - 可以使用Vercel KV的导出功能

3. **环境变量**：
   - 确保在Vercel Dashboard中设置了KV的环境变量
   - 本地开发需要创建`.env.local`文件

## 🐛 故障排除

### 问题1：KV连接失败
- 检查环境变量是否正确设置
- 确认KV数据库已创建
- 查看Vercel Dashboard的Function Logs

### 问题2：API返回404
- 检查`vercel.json`配置是否正确
- 确认API文件在`api/`目录下
- 查看Vercel Dashboard的Function Logs

### 问题3：数据不同步
- 确认所有用户访问的是同一个Vercel部署
- 检查KV连接是否正常
- 查看Function Logs确认数据写入成功

## 📞 支持

如有问题，请查看：
1. Vercel Dashboard的Function Logs
2. 浏览器控制台的错误信息
3. Vercel文档：https://vercel.com/docs

