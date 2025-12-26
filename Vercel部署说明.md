# Vercel部署说明（纯前端方案）

## 🎯 方案说明

纯前端应用，使用GitHub Gist存储数据，**完全不需要后端服务器**。

**工作流程：**
1. 用户登录 → 从GitHub Gist读取JSON数据 → 缓存到localStorage
2. 创建/修改数据 → 先保存到localStorage → 后台同步到GitHub Gist
3. 其他用户 → 每5秒轮询GitHub Gist → 发现更新后自动刷新

---

## 🚀 部署步骤

### 步骤1：配置GitHub Gist

**详细步骤请查看：`GitHub Gist配置说明.md`**

快速步骤：
1. 访问 [GitHub Gist](https://gist.github.com/)
2. 创建公开Gist，文件名：`data.json`
3. 获取Gist ID
4. 创建GitHub Token（用于更新数据）

### 步骤2：配置环境变量

在项目根目录创建 `.env.local`：

```env
VITE_GIST_ID=你的Gist ID
VITE_GIST_TOKEN=你的GitHub Token（可选）
```

### 步骤3：推送到GitHub

```bash
git add .
git commit -m "使用GitHub Gist存储"
git push
```

### 步骤4：在Vercel部署

1. 登录 [Vercel](https://vercel.com/)
2. 点击 **Add New Project**
3. 导入你的GitHub仓库
4. 配置：
   - **Framework Preset**：Vite
   - **Root Directory**：`./`（根目录）
   - **Build Command**：`npm run build`
   - **Output Directory**：`dist`
5. **Environment Variables**（重要！）：
   - `VITE_GIST_ID` = 你的Gist ID
   - `VITE_GIST_TOKEN` = 你的GitHub Token（可选）
6. 点击 **Deploy**

### 步骤5：完成！

访问你的Vercel域名，应该可以正常使用了。

---

## 📝 代码说明

- **`src/utils/gist-storage.js`**：GitHub Gist存储工具（纯前端）
- **`src/utils/storage.js`**：统一入口，使用Gist存储方案
- **无需后端API**：所有操作都在前端完成

---

## ⚠️ 注意事项

1. **环境变量**：
   - 必须在Vercel中配置环境变量
   - 本地开发也需要 `.env.local` 文件

2. **GitHub Token安全**：
   - Token不要提交到Git仓库
   - `.env.local` 已添加到 `.gitignore`
   - 在Vercel中配置环境变量是安全的

3. **数据持久化**：
   - 数据存储在GitHub Gist
   - 即使Vercel函数重启，数据也不会丢失
   - 所有用户共享同一个Gist

---

## ✅ 验证部署

1. **访问前端**：`https://你的项目名.vercel.app`
2. **查看控制台**：应该看到 `📖 开始从GitHub Gist读取数据...`
3. **创建比赛**：应该能正常保存
4. **多用户测试**：多个浏览器打开，应该能看到同步

---

## 🔧 本地开发

1. **创建 `.env.local`**：
```env
VITE_GIST_ID=你的Gist ID
VITE_GIST_TOKEN=你的GitHub Token（可选）
```

2. **启动开发服务器**：
```bash
npm run dev
```

3. **访问**：`http://localhost:8080`
