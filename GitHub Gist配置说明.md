# GitHub Gist配置说明（纯前端方案）

## 🎯 方案说明

使用GitHub Gist存储JSON数据，**完全不需要后端服务器**，纯前端应用。

**优点：**
- ✅ 完全免费
- ✅ 无需后端服务器
- ✅ 无需数据库
- ✅ 数据公开可读（多用户共享）
- ✅ 配置简单

**缺点：**
- ⚠️ 更新需要GitHub Token（只读不需要）
- ⚠️ 有API调用限制（但足够使用）

---

## 🚀 配置步骤

### 步骤1：创建GitHub Gist

1. **访问 [GitHub Gist](https://gist.github.com/)**
2. **登录你的GitHub账号**（如果没有，先注册）
3. **创建新的Gist**：
   - **文件名**：`data.json`
   - **内容**：
   ```json
   {
     "tournaments": [],
     "users": [],
     "matches": [],
     "lastSync": null
   }
   ```
   - **权限**：选择 **Create public gist**（公开，这样其他用户才能读取）
   - 点击 **Create public gist**

### 步骤2：获取Gist ID

创建成功后，URL格式为：`https://gist.github.com/你的用户名/gist-id`

例如：`https://gist.github.com/jaynekuo/abc123def456`

**Gist ID就是 `abc123def456`**（URL的最后一部分）

### 步骤3：创建GitHub Token（用于更新数据）

**如果只需要读取数据（不更新），可以跳过这一步。**

如果需要更新数据（创建比赛、录入比分等），需要创建Token：

1. **访问 [GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)](https://github.com/settings/tokens)**
2. **点击 Generate new token (classic)**
3. **配置Token**：
   - **Note**：`Tennis Tournament Data`（随便写）
   - **Expiration**：选择过期时间（建议选择较长时间）
   - **Scopes**：勾选 **`gist`**（只需要gist权限）
4. **点击 Generate token**
5. **复制Token**（只显示一次，请保存好！）

### 步骤4：配置前端

在项目根目录创建 `.env.local` 文件：

```env
VITE_GIST_ID=你的Gist ID
VITE_GIST_TOKEN=你的GitHub Token（可选，用于更新）
```

例如：
```env
VITE_GIST_ID=abc123def456
VITE_GIST_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxx
```

**注意：**
- `VITE_GIST_ID`：**必须配置**（用于读取数据）
- `VITE_GIST_TOKEN`：**可选**（用于更新数据，如果不配置，只能读取）

### 步骤5：重新构建

```bash
npm run build
```

---

## 📝 使用说明

### 只读模式（不配置Token）

如果只配置了 `VITE_GIST_ID`，没有配置 `VITE_GIST_TOKEN`：
- ✅ 可以读取数据
- ✅ 可以查看比赛列表
- ❌ 无法创建/修改数据（会保存到localStorage，但不会同步到Gist）

### 读写模式（配置Token）

如果同时配置了 `VITE_GIST_ID` 和 `VITE_GIST_TOKEN`：
- ✅ 可以读取数据
- ✅ 可以创建/修改数据
- ✅ 数据会同步到Gist，其他用户可以看到

---

## 🔧 多用户使用

### 方案A：共享同一个Gist（推荐）

所有用户使用同一个Gist ID：
- 所有用户都能看到相同的数据
- 所有用户都能更新数据
- 需要每个用户都配置Token

### 方案B：只读模式

- 管理员配置Token，可以更新数据
- 其他用户只配置Gist ID，只能读取数据
- 适合：管理员录入，其他人查看

---

## ⚠️ 注意事项

1. **Token安全**：
   - Token不要提交到Git仓库
   - `.env.local` 已添加到 `.gitignore`
   - 如果Token泄露，可以在GitHub设置中删除

2. **API限制**：
   - GitHub API有调用频率限制
   - 未认证：60次/小时
   - 已认证：5000次/小时
   - 对于小规模使用完全足够

3. **数据冲突**：
   - 多个用户同时更新可能冲突
   - 适合小规模使用（<10用户）
   - 大规模使用建议使用数据库

---

## ✅ 验证配置

1. **访问前端**：应该能正常加载
2. **查看控制台**：应该看到 `📖 开始从GitHub Gist读取数据...`
3. **创建比赛**：如果配置了Token，应该能保存
4. **查看Gist**：在GitHub Gist页面应该能看到更新的数据

---

## 🆘 常见问题

### Q: 无法读取Gist？

**检查：**
1. Gist是否设置为公开（Public）
2. GIST_ID是否正确
3. 网络是否能访问GitHub

### Q: 无法更新Gist？

**检查：**
1. 是否配置了GIST_TOKEN
2. Token是否有gist权限
3. Token是否过期

### Q: 数据不同步？

**检查：**
1. 所有用户是否使用同一个GIST_ID
2. 更新数据的用户是否配置了Token
3. 查看浏览器控制台错误信息

---

## 💡 推荐配置

**个人使用：**
- 配置GIST_ID和GIST_TOKEN
- 所有设备使用相同配置

**团队使用：**
- 管理员配置Token，可以更新
- 其他成员只配置GIST_ID，只能读取
- 或所有成员都配置Token，都可以更新

