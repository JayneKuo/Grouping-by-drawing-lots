# 快速启动指南

## 第一步：检查文件

确保以下文件都存在：

```
抽签分组/
├── index.html          ✅ 主页面
├── display.html        ✅ 大屏页面
├── style.css           ✅ 样式文件
├── check.html          ✅ 诊断工具
└── js/                 ✅ JS模块文件夹
    ├── config.js
    ├── utils.js
    ├── cache.js
    ├── auth.js
    ├── scoring.js
    ├── ranking.js
    ├── app.js
    └── display.js
```

## 第二步：诊断问题

1. **打开 `check.html`**
   - 这会自动检查所有模块是否正常加载
   - 如果有错误，会显示具体是哪个文件有问题

2. **打开浏览器控制台（F12）**
   - 查看 Console 标签页
   - 查看是否有红色错误信息

## 第三步：启动应用

### 方法1：直接打开（可能有限制）
- 双击 `index.html` 文件
- ⚠️ 注意：某些浏览器可能限制本地文件访问

### 方法2：使用本地服务器（推荐）

**Python方式：**
```bash
cd 抽签分组
python -m http.server 8000
```
然后访问：http://localhost:8000

**Node.js方式：**
```bash
cd 抽签分组
npx http-server
```

**VS Code方式：**
1. 安装 "Live Server" 扩展
2. 右键 `index.html` → "Open with Live Server"

## 常见问题

### Q1: 页面显示空白
**解决：**
1. 打开浏览器控制台（F12）
2. 查看 Console 的错误信息
3. 查看 Network 标签，确认哪些文件加载失败

### Q2: 提示 "CONFIG is not defined"
**原因：** config.js 文件未加载
**解决：**
1. 检查 `js/config.js` 文件是否存在
2. 检查文件路径是否正确
3. 检查浏览器控制台的错误信息

### Q3: 所有文件都存在但还是无法运行
**解决：**
1. 清除浏览器缓存（Ctrl + Shift + Delete）
2. 强制刷新（Ctrl + F5）
3. 尝试使用不同的浏览器
4. 使用本地服务器而不是直接打开文件

### Q4: 模块加载顺序错误
**解决：**
- 确保 index.html 中的 script 标签顺序正确：
  1. config.js
  2. utils.js
  3. cache.js
  4. auth.js
  5. scoring.js
  6. ranking.js
  7. app.js

## 测试步骤

1. ✅ 打开 `check.html` - 应该显示所有模块加载成功
2. ✅ 打开 `index.html` - 应该显示登录提示页面
3. ✅ 点击"立即登录" - 应该弹出登录窗口
4. ✅ 输入 `admin` / `admin123` - 应该登录成功
5. ✅ 点击"创建新比赛" - 应该显示创建表单

## 如果还是无法运行

请提供以下信息：
1. 浏览器名称和版本
2. 浏览器控制台（F12）的完整错误信息
3. `check.html` 的检查结果
4. 是否使用本地服务器

