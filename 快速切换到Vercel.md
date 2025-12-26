# 快速切换到Vercel（国内免费快速访问）

## 🚀 为什么选择Vercel？

### ✅ 优势
- **完全免费**：个人项目免费使用
- **国内访问快**：全球CDN，比Firebase快很多
- **无需VPN**：国内可以直接访问
- **自动部署**：GitHub推送自动部署
- **免费额度充足**：10GB KV存储，1000万次读取/月

---

## 📋 快速部署步骤

### 第一步：安装Vercel CLI

```bash
npm install -g vercel
```

### 第二步：登录Vercel

```bash
vercel login
```

会打开浏览器，使用GitHub账号登录。

### 第三步：创建KV数据库

1. 访问 [Vercel Dashboard](https://vercel.com/dashboard)
2. 创建新项目（或选择现有项目）
3. 进入 **Storage** → **Create Database**
4. 选择 **KV**（Redis）
5. 创建数据库

### 第四步：配置环境变量

在Vercel Dashboard的项目设置中，添加环境变量：

```
KV_REST_API_URL=你的KV数据库URL
KV_REST_API_TOKEN=你的KV数据库Token
KV_REST_API_READ_ONLY_TOKEN=你的只读Token（可选）
```

这些值在Storage页面的数据库详情中可以找到。

### 第五步：部署API

```bash
vercel
```

或者使用GitHub自动部署：
1. 将代码推送到GitHub
2. 在Vercel Dashboard连接GitHub仓库
3. 自动部署

### 第六步：修改前端代码

修改 `src/utils/storage.js`：

```javascript
const USE_VERCEL_API = true // 改为true
export { storage, syncStatus } from './vercel'
```

### 第七步：设置API URL

在项目根目录创建 `.env` 文件：

```env
VITE_API_URL=https://your-project.vercel.app/api
```

将 `your-project` 替换为你的Vercel项目域名。

### 第八步：重新构建和部署

```bash
npm run build
vercel --prod
```

---

## 🎯 一键部署脚本

运行 `一键部署到Vercel.bat` 即可自动完成部署。

---

## 📊 对比：Firebase vs Vercel

| 特性 | Firebase | Vercel |
|------|----------|--------|
| 免费额度 | 有限 | 充足 |
| 国内访问 | 慢/无法访问 | 快 |
| 需要VPN | 可能需要 | 不需要 |
| 部署难度 | 中等 | 简单 |
| 数据库 | Firestore | KV（Redis） |
| 实时同步 | 支持 | 需要轮询 |

---

## ✅ 完成后的效果

- ✅ 国内访问速度快
- ✅ 无需VPN
- ✅ 数据同步正常
- ✅ 完全免费

---

## 📝 注意事项

1. **首次部署需要创建KV数据库**
2. **环境变量需要在Vercel Dashboard配置**
3. **API URL需要设置为你的Vercel域名**
4. **修改storage.js后需要重新构建**

---

## 🆘 遇到问题？

1. 检查KV数据库是否创建
2. 检查环境变量是否配置
3. 检查API URL是否正确
4. 查看Vercel Dashboard的日志

需要帮助随时告诉我！

