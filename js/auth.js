/**
 * 认证模块
 * 负责用户登录、注册、权限管理
 */

const Auth = {
    /**
     * 初始化内置账号
     */
    initDefaultUsers() {
        const users = Cache.get(CONFIG.STORAGE_KEYS.USERS, []);
        if (users.length === 0) {
            const defaultUsers = [
                {
                    id: Utils.generateId(),
                    username: 'admin',
                    password: this.hashPassword('admin123'),
                    role: 'admin',
                    createdAt: Date.now()
                },
                {
                    id: Utils.generateId(),
                    username: 'user1',
                    password: this.hashPassword('user123'),
                    role: 'user',
                    createdAt: Date.now()
                },
                {
                    id: Utils.generateId(),
                    username: 'user2',
                    password: this.hashPassword('user123'),
                    role: 'user',
                    createdAt: Date.now()
                }
            ];
            Cache.set(CONFIG.STORAGE_KEYS.USERS, defaultUsers, false);
        }
    },
    
    /**
     * 密码哈希（简化版，实际应使用bcrypt）
     */
    hashPassword(password) {
        // 简单的哈希，实际应使用更安全的方法
        let hash = 0;
        for (let i = 0; i < password.length; i++) {
            const char = password.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return hash.toString();
    },
    
    /**
     * 用户登录
     * @param {string} username - 用户名
     * @param {string} password - 密码
     * @returns {object|null} 用户对象或null
     */
    login(username, password) {
        const users = Cache.get(CONFIG.STORAGE_KEYS.USERS, []);
        const hashedPassword = this.hashPassword(password);
        
        const user = users.find(u => 
            u.username === username && u.password === hashedPassword
        );
        
        if (user) {
            // 保存登录状态
            const userInfo = {
                id: user.id,
                username: user.username,
                role: user.role
            };
            Cache.set(CONFIG.STORAGE_KEYS.CURRENT_USER, userInfo, false);
            
            // 记录登录日志
            this.logOperation('login', { username });
            
            return userInfo;
        }
        
        return null;
    },
    
    /**
     * 用户注册
     * @param {string} username - 用户名
     * @param {string} password - 密码
     * @returns {object} 注册结果
     */
    register(username, password) {
        if (!username || username.length < 2 || username.length > 20) {
            return { success: false, message: '用户名长度必须在2-20个字符之间' };
        }
        
        if (!password || password.length < 6) {
            return { success: false, message: '密码长度至少6个字符' };
        }
        
        const users = Cache.get(CONFIG.STORAGE_KEYS.USERS, []);
        
        if (users.find(u => u.username === username)) {
            return { success: false, message: '用户名已存在' };
        }
        
        const newUser = {
            id: Utils.generateId(),
            username,
            password: this.hashPassword(password),
            role: 'user',
            createdAt: Date.now()
        };
        
        users.push(newUser);
        Cache.set(CONFIG.STORAGE_KEYS.USERS, users, false);
        
        return { success: true, message: '注册成功' };
    },
    
    /**
     * 退出登录
     */
    logout() {
        Cache.remove(CONFIG.STORAGE_KEYS.CURRENT_USER);
        this.logOperation('logout', {});
    },
    
    /**
     * 获取当前用户
     * @returns {object|null} 当前用户信息
     */
    getCurrentUser() {
        return Cache.get(CONFIG.STORAGE_KEYS.CURRENT_USER, null);
    },
    
    /**
     * 检查是否已登录
     * @returns {boolean}
     */
    isLoggedIn() {
        return this.getCurrentUser() !== null;
    },
    
    /**
     * 记录操作日志
     * @param {string} action - 操作类型
     * @param {object} data - 操作数据
     */
    logOperation(action, data) {
        const user = this.getCurrentUser();
        if (!user) return;
        
        const logs = Cache.get(CONFIG.STORAGE_KEYS.OPERATION_LOG, []);
        logs.push({
            id: Utils.generateId(),
            userId: user.id,
            username: user.username,
            action,
            data,
            timestamp: Date.now()
        });
        
        // 只保留最近1000条日志
        if (logs.length > 1000) {
            logs.shift();
        }
        
        Cache.set(CONFIG.STORAGE_KEYS.OPERATION_LOG, logs, false);
    },
    
    /**
     * 获取操作日志
     * @param {number} limit - 限制条数
     * @returns {array} 操作日志
     */
    getOperationLogs(limit = 100) {
        const logs = Cache.get(CONFIG.STORAGE_KEYS.OPERATION_LOG, []);
        return logs.slice(-limit).reverse();
    }
};

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Auth;
}

