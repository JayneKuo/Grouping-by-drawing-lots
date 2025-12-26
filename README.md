# 🎾 球搭子网球赛事管理系统

专业的网球赛事管理平台，支持比赛创建、分组抽签、比分录入、积分排名等功能。

## ✨ 功能特性

- ✅ **比赛管理**：创建比赛、设置赛制、添加选手
- ✅ **分组抽签**：自动分组、随机抽签
- ✅ **比分录入**：专业的WTA标准计分系统
- ✅ **积分排名**：自动计算积分、显示排名
- ✅ **数据同步**：多用户实时数据同步

## 🚀 快速开始

### 本地开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

访问：`http://localhost:8080`

### 部署到Vercel

1. **推送到GitHub**
```bash
git add .
git commit -m "部署到Vercel"
git push
```

2. **在Vercel部署**
   - 登录 [Vercel](https://vercel.com/)
   - 导入GitHub仓库
   - 自动部署完成

3. **访问**
   - 访问你的Vercel域名即可使用

详细步骤请查看：
- **Vercel部署说明.md** - 部署到Vercel
- **GitHub Gist配置说明.md** - 配置数据存储

## 📋 技术栈

- **前端**：Vue 3 + Vite + Vant UI
- **存储**：GitHub Gist（纯前端，无需后端）
- **部署**：Vercel（静态网站托管）

## 📝 使用说明

### 默认账号

- **管理员**：`admin` / `admin123`
- **测试账号**：`user1` / `user123`、`user2` / `user123`

### 创建比赛

1. 登录后点击 **创建比赛**
2. 填写比赛信息（名称、赛制、日期等）
3. 添加参赛选手
4. 点击 **开始抽签分组**

### 录入比分

1. 在比赛详情页点击 **录入比分**
2. 使用裁判操作面板录入比分
3. 系统自动计算局分、盘分

## 🔧 项目结构

```
├── api/              # Vercel Serverless Functions
│   └── data.js      # 数据存储API
├── src/
│   ├── views/       # 页面组件
│   ├── components/  # 通用组件
│   ├── utils/       # 工具函数
│   │   └── json-storage.js  # JSON存储工具
│   └── router/      # 路由配置
└── vercel.json      # Vercel配置
```

## 📄 许可证

MIT License
