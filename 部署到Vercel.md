# 🚀 部署到Vercel - 完整指南

## ✅ 已完全适配Vercel Serverless Functions

现在系统已经完全改造，满足你的需求：
- ✅ **通过Vercel发布** - 无需自己的服务器
- ✅ **内置账号同步数据** - 所有用户共享同一数据源
- ✅ **多用户比分录入** - 支持多用户同时操作
- ✅ **数据持久化** - 使用Vercel KV存储

## 📋 3步快速部署

### 步骤1：创建Vercel KV数据库

1. 访问 https://vercel.com/dashboard
2. 点击左侧 **Storage** → **Create Database**
3. 选择 **KV**（Redis）
4. 创建数据库（名称随意，如：`tennis-tournament`）
5. **重要**：Vercel会自动设置环境变量，无需手动配置

### 步骤2：部署到Vercel

#### 方法A：通过GitHub（推荐，自动部署）

1. 将代码推送到GitHub仓库
2. 访问 https://vercel.com/dashboard
3. 点击 **Add New Project**
4. 导入你的GitHub仓库
5. Vercel会自动检测配置并部署
6. 等待部署完成（约1-2分钟）

#### 方法B：通过CLI

```bash
# 安装Vercel CLI
npm install -g vercel

# 登录
vercel login

# 部署
vercel

# 生产环境部署
vercel --prod
```

### 步骤3：完成！

部署完成后，访问你的Vercel域名（如：`your-project.vercel.app`），就可以：
- ✅ 使用内置账号登录
- ✅ 创建比赛
- ✅ 添加选手（单个或批量）
- ✅ 录入比分
- ✅ 所有数据自动同步

## 📋 内置账号

| 账号 | 密码 | 角色 |
|------|------|------|
| **admin** | admin123 | 管理员 |
| **user1** | user123 | 普通用户 |
| **user2** | user123 | 普通用户 |
| **user3** | user123 | 普通用户 |

## 🎯 功能特点

### ✅ 已实现的功能

1. **Serverless架构**
   - 所有API都是Vercel Serverless Functions
   - 自动扩展，无需管理服务器
   - 按需付费，免费套餐足够使用

2. **Vercel KV存储**
   - 类似Redis的键值存储
   - 数据持久化，不会丢失
   - 多用户共享同一数据源

3. **数据同步**
   - 所有用户看到相同的数据
   - 实时更新，无需刷新
   - 支持多用户同时操作

4. **内置账号系统**
   - 4个默认账号，开箱即用
   - 支持注册新账号
   - 密码加密存储

## 📦 API端点

所有API都在 `/api` 路径下：

- `GET /api/health` - 健康检查
- `POST /api/auth/login` - 登录
- `POST /api/auth/register` - 注册
- `GET /api/tournaments` - 获取比赛列表
- `POST /api/tournaments` - 创建比赛
- `GET /api/tournaments/[id]` - 获取比赛详情
- `POST /api/tournaments/[id]/players` - 添加单个选手
- `POST /api/tournaments/[id]/players/batch` - 批量导入选手
- `DELETE /api/tournaments/[id]/players/[playerId]` - 删除选手

## 💡 Vercel免费套餐限制

- **存储**：256MB（足够存储数百场比赛）
- **读取**：10,000次/天（足够日常使用）
- **写入**：1,000次/天（足够小型比赛使用）
- **带宽**：100GB/月（足够使用）

对于小型比赛（<100场比赛，<50名选手），完全够用！

## 🔧 本地开发（可选）

如果想本地测试Vercel Functions：

```bash
# 安装Vercel CLI
npm install -g vercel

# 安装依赖
npm install

# 创建.env.local文件（从Vercel Dashboard复制KV连接信息）
KV_REST_API_URL=你的KV_URL
KV_REST_API_TOKEN=你的KV_TOKEN

# 启动开发服务器
vercel dev
```

## 📝 文件结构

```
项目根目录/
├── api/                    # Vercel Serverless Functions
│   ├── health.js          # 健康检查
│   ├── auth/
│   │   ├── login.js       # 登录
│   │   └── register.js    # 注册
│   └── tournaments/
│       ├── index.js       # 比赛列表/创建
│       ├── [id].js        # 比赛详情
│       └── [id]/
│           └── players/
│               ├── players.js      # 添加单个选手
│               ├── batch.js        # 批量导入
│               └── [playerId].js   # 删除选手
├── src/                    # Vue3前端代码
├── vercel.json            # Vercel配置
└── package.json           # 项目配置
```

## 🐛 故障排除

### 问题1：KV连接失败
- **解决**：确保在Vercel Dashboard中创建了KV数据库
- **检查**：查看Vercel Dashboard的Function Logs

### 问题2：API返回404
- **解决**：检查`vercel.json`配置是否正确
- **检查**：确认API文件在`api/`目录下

### 问题3：数据不同步
- **解决**：确认所有用户访问的是同一个Vercel部署
- **检查**：查看Function Logs确认数据写入成功

## 🎉 完成！

现在你可以：
1. 直接部署到Vercel
2. 使用内置账号登录
3. 创建比赛并添加选手
4. 多用户同步数据

**无需自己的服务器，完全免费！**

