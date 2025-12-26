# Vercel部署说明

## ✅ 已改造为Vercel Serverless Functions

现在系统已经完全适配Vercel部署，无需自己的服务器！

## 📋 部署步骤

### 1. 安装Vercel CLI（如果还没有）
```bash
npm install -g vercel
```

### 2. 登录Vercel
```bash
vercel login
```

### 3. 配置Vercel KV（数据存储）

#### 方法1：通过Vercel Dashboard
1. 访问 https://vercel.com/dashboard
2. 创建新项目或选择现有项目
3. 进入项目设置 → Storage
4. 创建 KV Database
5. 复制连接信息

#### 方法2：通过CLI
```bash
vercel kv create
```

### 4. 设置环境变量
在Vercel Dashboard的项目设置中添加：
- `KV_REST_API_URL` - KV的REST API URL
- `KV_REST_API_TOKEN` - KV的访问Token
- `KV_REST_API_READ_ONLY_TOKEN` - KV的只读Token（可选）

### 5. 部署到Vercel
```bash
vercel
```

或者直接推送到GitHub，Vercel会自动部署。

## 🎯 功能特点

### ✅ 已实现的功能
1. **Serverless Functions** - 所有API都改为Vercel Serverless Functions
2. **Vercel KV存储** - 使用Vercel KV作为数据存储（类似Redis）
3. **数据持久化** - 所有数据存储在Vercel KV中，多用户可同步
4. **内置账号** - 4个默认账号（admin, user1, user2, user3）
5. **无需服务器** - 完全基于Vercel Serverless，无需维护服务器

### 📦 API端点
- `GET /api/health` - 健康检查
- `POST /api/auth/login` - 登录
- `GET /api/tournaments` - 获取比赛列表
- `POST /api/tournaments` - 创建比赛
- `GET /api/tournaments/[id]` - 获取比赛详情
- `POST /api/tournaments/[id]/players` - 添加单个选手
- `POST /api/tournaments/[id]/players/batch` - 批量导入选手
- `DELETE /api/tournaments/[id]/players/[playerId]` - 删除选手

## 🔧 本地开发

### 使用Vercel KV（推荐）
```bash
# 安装依赖
npm install

# 设置环境变量（创建.env.local）
KV_REST_API_URL=你的KV_URL
KV_REST_API_TOKEN=你的KV_TOKEN

# 启动开发服务器
vercel dev
```

### 使用本地后端（备选）
如果不想使用Vercel KV，可以继续使用本地后端：
```bash
npm start
```

## 💡 优势

1. **完全免费** - Vercel免费套餐足够使用
2. **自动扩展** - Serverless自动处理流量
3. **全球CDN** - 自动CDN加速
4. **数据同步** - 所有用户共享同一数据源
5. **无需维护** - 无需管理服务器

## 📝 注意事项

1. **Vercel KV限制**：
   - 免费套餐：256MB存储
   - 10,000次读取/天
   - 1,000次写入/天
   - 对于小型比赛足够使用

2. **数据备份**：
   - 建议定期导出数据
   - 可以使用Vercel KV的导出功能

3. **环境变量**：
   - 确保在Vercel Dashboard中设置了KV的环境变量
   - 本地开发需要创建`.env.local`文件

## 🚀 快速开始

1. 安装依赖：`npm install`
2. 配置Vercel KV（通过Dashboard或CLI）
3. 设置环境变量
4. 部署：`vercel`
5. 完成！

## 📞 如果遇到问题

1. 检查Vercel KV是否已创建
2. 检查环境变量是否正确设置
3. 查看Vercel Dashboard的Function Logs
4. 检查API路由是否正确

