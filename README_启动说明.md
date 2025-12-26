# 🚀 快速启动指南

## ⚠️ 重要提示

**这是一个纯HTML/JavaScript项目，不需要npm、不需要Node.js框架！**

你看到的 `npm run dev` 错误是因为你在其他项目目录下运行了命令。

## ✅ 正确的启动方式

### 方法1：使用启动脚本（最简单）

**Windows用户：**
1. 双击 `启动.bat` 文件
2. 脚本会自动检测Python或Node.js并启动服务器
3. 在浏览器访问显示的地址（通常是 http://localhost:8000）

**PowerShell用户：**
```powershell
.\启动.ps1
```

### 方法2：手动启动Python服务器

1. 打开命令行（CMD或PowerShell）
2. 进入项目目录：
   ```bash
   cd "C:\Users\Jayne\Desktop\抽签分组"
   ```
3. 运行：
   ```bash
   python -m http.server 8000
   ```
4. 在浏览器访问：http://localhost:8000

### 方法3：使用Node.js的http-server

如果没有Python，可以使用Node.js：

```bash
# 安装http-server（只需安装一次）
npm install -g http-server

# 启动服务器
http-server -p 8080
```

然后访问：http://localhost:8080

### 方法4：使用VS Code Live Server（推荐）

1. 安装VS Code扩展：**Live Server**
2. 右键点击 `index.html`
3. 选择 **"Open with Live Server"**
4. 浏览器会自动打开

## 🔍 关于你看到的错误

你看到的错误信息：
```
npm run dev
> linker-web-base@1.0.0 dev
> next dev --turbopack
```

这是**Next.js项目**的错误，不是我们的项目！

**原因：**
- 你可能在其他目录运行了命令
- 或者你的项目目录下有其他项目的文件

**解决方法：**
- 确保在正确的目录：`C:\Users\Jayne\Desktop\抽签分组`
- 不要运行 `npm run dev`，我们的项目不需要npm

## 📋 项目文件结构

```
抽签分组/
├── index.html          ← 主页面
├── style.css          ← 样式文件
├── 启动.bat            ← Windows启动脚本
├── 启动.ps1            ← PowerShell启动脚本
└── js/                ← JavaScript模块
    ├── config.js
    ├── utils.js
    ├── cache.js
    ├── auth.js
    ├── scoring.js
    ├── ranking.js
    └── app.js
```

## ✅ 验证是否启动成功

1. 启动服务器后，应该看到类似信息：
   ```
   Serving HTTP on 0.0.0.0 port 8000
   ```

2. 在浏览器访问 http://localhost:8000

3. 应该看到登录提示页面

4. 如果看到空白页面，按F12打开控制台查看错误

## 🆘 如果还是无法启动

1. **检查Python是否安装：**
   ```bash
   python --version
   ```

2. **检查Node.js是否安装：**
   ```bash
   node --version
   ```

3. **如果都没有，安装Python：**
   - 下载：https://www.python.org/downloads/
   - 安装时勾选 "Add Python to PATH"

4. **或者使用VS Code Live Server**（最简单）

## 💡 提示

- 数据会保存在浏览器的 **localStorage** 中
- 不需要数据库，不需要后端服务器
- 纯前端应用，可以直接在浏览器中运行（但需要本地服务器避免CORS问题）

