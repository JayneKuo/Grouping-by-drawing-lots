# Vercel快速部署指南

## 🎯 完全适配Vercel，无需自己的服务器！

现在系统已经完全改造为Vercel Serverless Functions + Vercel KV存储，满足你的需求：
- ✅ 通过Vercel发布
- ✅ 内置账号可以同步比赛数据
- ✅ 多用户可以进行比分录入
- ✅ 数据持久化存储

## 🚀 3步快速部署

### 步骤1：创建Vercel KV数据库

1. 访问 https://vercel.com/dashboard
2. 点击 **Storage** → **Create Database** → **KV**
3. 创建KV数据库（名称随意，如：`tennis-tournament`）
4. 复制连接信息（会自动设置环境变量）

### 步骤2：部署到Vercel

#### 方法A：通过GitHub（推荐）
1. 将代码推送到GitHub仓库
2. 在Vercel Dashboard点击 **Add New Project**
3. 导入你的GitHub仓库
4. Vercel会自动检测并部署

#### 方法B：通过CLI
```bash
npm install -g vercel
vercel login
vercel
```

### 步骤3：设置环境变量（如果KV没有自动连接）

在Vercel Dashboard → 项目设置 → Environment Variables中添加：
```
KV_REST_API_URL=你的KV_URL
KV_REST_API_TOKEN=你的KV_TOKEN
```

## ✅ 完成！

部署完成后，访问你的Vercel域名，就可以：
- 使用内置账号登录
- 创建比赛
- 添加选手
- 录入比分
- 所有数据自动同步

## 📋 内置账号

| 账号 | 密码 | 角色 |
|------|------|------|
| admin | admin123 | 管理员 |
| user1 | user123 | 普通用户 |
| user2 | user123 | 普通用户 |
| user3 | user123 | 普通用户 |

## 💡 优势

1. **完全免费** - Vercel免费套餐足够使用
2. **数据同步** - 所有用户共享同一数据源
3. **无需维护** - Serverless自动扩展
4. **全球CDN** - 访问速度快

## 📝 注意事项

- Vercel KV免费套餐：256MB存储，10,000次读取/天，1,000次写入/天
- 对于小型比赛（<100场比赛）完全够用
- 数据会自动持久化，无需担心丢失

## 🔧 本地开发（可选）

如果想本地测试Vercel Functions：

```bash
npm install -g vercel
vercel dev
```

需要创建`.env.local`文件：
```
KV_REST_API_URL=你的KV_URL
KV_REST_API_TOKEN=你的KV_TOKEN
```

## 📞 如果遇到问题

1. 检查Vercel KV是否已创建并连接
2. 查看Vercel Dashboard的Function Logs
3. 确认环境变量已正确设置

现在你可以直接部署到Vercel了！

