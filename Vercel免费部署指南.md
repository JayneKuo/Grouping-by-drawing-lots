# Vercel免费部署指南（国内快速访问）

## 为什么选择Vercel？

### ✅ 优势
1. **完全免费**：个人项目免费使用
2. **全球CDN**：自动加速，国内访问快
3. **Serverless Functions**：无需管理服务器
4. **自动部署**：GitHub推送自动部署
5. **HTTPS免费**：自动SSL证书
6. **KV存储**：免费Redis数据库（10GB免费额度）

### 🚀 速度对比
- **Firebase**：在中国大陆可能慢或无法访问
- **Vercel**：全球CDN，国内访问速度快

---

## 部署步骤

### 第一步：安装Vercel CLI

```bash
npm install -g vercel
```

### 第二步：登录Vercel

```bash
vercel login
```

会打开浏览器，使用GitHub账号登录。

### 第三步：创建Vercel KV数据库

1. 访问 [Vercel Dashboard](https://vercel.com/dashboard)
2. 选择你的项目（如果没有，先创建一个）
3. 进入 **Storage** → **Create Database**
4. 选择 **KV**（Redis）
5. 创建数据库，记住数据库名称

### 第四步：配置环境变量

在项目根目录创建 `.env.local` 文件：

```env
KV_REST_API_URL=你的KV数据库URL
KV_REST_API_TOKEN=你的KV数据库Token
KV_REST_API_READ_ONLY_TOKEN=你的只读Token
```

这些值在Vercel Dashboard的Storage页面可以找到。

### 第五步：安装依赖

```bash
npm install @vercel/kv
```

### 第六步：修改前端代码使用Vercel API

修改 `src/utils/storage.js`：

```javascript
// 选择使用Vercel API还是Firebase
// 设置为true使用Vercel API，false使用Firebase
const USE_VERCEL_API = true

if (USE_VERCEL_API) {
  // 使用Vercel API
  export { storage, syncStatus } from './vercel'
} else {
  // 使用Firebase
  export { storage, syncStatus } from './firebase'
}
```

### 第七步：设置API URL

在项目根目录创建 `.env` 文件：

```env
VITE_API_URL=https://your-project.vercel.app/api
```

部署后，将 `your-project` 替换为你的Vercel项目域名。

### 第八步：部署到Vercel

```bash
vercel
```

或者使用GitHub自动部署：
1. 将代码推送到GitHub
2. 在Vercel Dashboard连接GitHub仓库
3. 自动部署

---

## 免费额度

### Vercel免费计划
- **Serverless Functions**：100GB小时/月
- **带宽**：100GB/月
- **KV存储**：10GB存储，1000万次读取/月
- **构建时间**：6000分钟/月

**对于个人项目完全够用！**

---

## 国内访问优化

### Vercel的优势
1. **全球CDN**：自动选择最近的节点
2. **国内访问快**：比Firebase快很多
3. **无需VPN**：国内可以直接访问

### 如果还是慢
1. **使用Vercel的国内节点**（需要付费）
2. **或者使用Cloudflare Workers**（也是免费的）

---

## 对比：Firebase vs Vercel

| 特性 | Firebase | Vercel |
|------|----------|--------|
| 免费额度 | 有限 | 充足 |
| 国内访问 | 慢/无法访问 | 快 |
| 需要VPN | 可能需要 | 不需要 |
| 部署难度 | 中等 | 简单 |
| 实时同步 | 支持 | 需要轮询 |
| 数据库 | Firestore | KV（Redis） |

---

## 迁移步骤

### 从Firebase迁移到Vercel

1. **导出Firebase数据**：
   - 在Firebase控制台导出数据
   - 或使用代码导出

2. **导入到Vercel KV**：
   - 使用API接口导入数据
   - 或手动导入

3. **切换前端代码**：
   - 修改 `src/utils/storage.js`
   - 设置 `USE_VERCEL_API = true`

4. **测试**：
   - 测试数据读写
   - 测试同步功能

---

## 常见问题

### Q: Vercel KV是免费的吗？
A: 是的，免费计划提供10GB存储和1000万次读取/月，对于个人项目完全够用。

### Q: 国内访问速度如何？
A: Vercel使用全球CDN，国内访问速度比Firebase快很多。

### Q: 需要VPN吗？
A: 不需要，Vercel在国内可以直接访问。

### Q: 如何备份数据？
A: 可以定期导出KV数据，或使用Vercel的备份功能。

### Q: 实时同步支持吗？
A: Vercel KV不支持实时监听，但可以使用轮询方式（已实现）。

---

## 下一步

1. 按照步骤部署到Vercel
2. 测试数据同步功能
3. 如果满意，可以完全切换到Vercel API

如果需要帮助，随时告诉我！

