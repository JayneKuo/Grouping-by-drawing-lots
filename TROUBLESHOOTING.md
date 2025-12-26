# 故障排查指南

## 问题：页面无法加载或显示空白

### 检查步骤

1. **打开浏览器开发者工具（F12）**
   - 查看 Console 标签页的错误信息
   - 查看 Network 标签页，确认JS文件是否加载成功

2. **检查文件结构**
   确保以下文件存在：
   ```
   抽签分组/
   ├── index.html
   ├── style.css
   ├── display.html
   └── js/
       ├── config.js
       ├── utils.js
       ├── cache.js
       ├── auth.js
       ├── scoring.js
       ├── ranking.js
       ├── app.js
       └── display.js
   ```

3. **检查文件路径**
   - 确认所有文件在同一目录下
   - 确认 `js/` 文件夹存在
   - 确认文件名大小写正确

4. **清除浏览器缓存**
   - 按 `Ctrl + Shift + Delete`
   - 或按 `Ctrl + F5` 强制刷新

5. **检查浏览器控制台错误**
   
   常见错误及解决方法：

   **错误1: "CONFIG is not defined"**
   - 原因：config.js 未加载
   - 解决：检查文件路径，确认 config.js 存在

   **错误2: "Utils is not defined"**
   - 原因：utils.js 未加载或加载顺序错误
   - 解决：确认 script 标签顺序正确

   **错误3: "Cannot read property 'xxx' of undefined"**
   - 原因：模块未正确初始化
   - 解决：检查模块加载顺序

   **错误4: "Failed to load resource"**
   - 原因：文件路径错误或文件不存在
   - 解决：检查文件路径和文件名

## 快速诊断

打开 `check.html` 文件，它会自动检查所有模块是否正常加载。

## 手动检查

在浏览器控制台（F12）中依次输入：

```javascript
// 检查各个模块
console.log('CONFIG:', typeof CONFIG);
console.log('Utils:', typeof Utils);
console.log('Cache:', typeof Cache);
console.log('Auth:', typeof Auth);
console.log('Scoring:', typeof Scoring);
console.log('Ranking:', typeof Ranking);
console.log('App:', typeof App);
```

如果某个模块显示 `undefined`，说明该模块未加载成功。

## 解决方案

### 方案1：使用本地服务器

不要直接双击打开HTML文件，使用本地服务器：

**Python方式：**
```bash
python -m http.server 8000
```
然后访问 `http://localhost:8000`

**Node.js方式：**
```bash
npx http-server
```

**VS Code方式：**
- 安装 Live Server 扩展
- 右键 index.html → Open with Live Server

### 方案2：检查文件编码

确保所有文件使用 UTF-8 编码。

### 方案3：检查浏览器兼容性

建议使用：
- Chrome 90+
- Edge 90+
- Firefox 88+
- Safari 14+

## 如果仍然无法运行

1. 打开浏览器控制台（F12）
2. 复制所有红色错误信息
3. 检查 Network 标签页，查看哪些文件加载失败
4. 提供错误信息以便进一步排查

