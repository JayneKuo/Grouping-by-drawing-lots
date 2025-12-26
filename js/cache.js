/**
 * 缓存模块
 * 负责数据的加密存储、同步和冲突处理
 */

const Cache = {
    /**
     * 简单的加密函数（实际应使用Web Crypto API）
     * @param {string} data - 要加密的数据
     * @param {string} key - 加密密钥
     * @returns {string} 加密后的数据
     */
    encrypt(data, key = 'tennis_cache_key') {
        try {
            // 简单的Base64编码（实际应使用AES加密）
            const encoded = btoa(encodeURIComponent(JSON.stringify(data)));
            return encoded;
        } catch (e) {
            console.error('加密失败:', e);
            return data;
        }
    },
    
    /**
     * 解密函数
     * @param {string} encryptedData - 加密的数据
     * @param {string} key - 解密密钥
     * @returns {any} 解密后的数据
     */
    decrypt(encryptedData, key = 'tennis_cache_key') {
        try {
            const decoded = JSON.parse(decodeURIComponent(atob(encryptedData)));
            return decoded;
        } catch (e) {
            console.error('解密失败:', e);
            return null;
        }
    },
    
    /**
     * 保存到缓存（加密）
     * @param {string} key - 存储键
     * @param {any} data - 要存储的数据
     * @param {boolean} encrypt - 是否加密
     */
    set(key, data, encrypt = true) {
        try {
            const dataToStore = encrypt ? this.encrypt(data) : data;
            localStorage.setItem(key, JSON.stringify({
                data: dataToStore,
                encrypted: encrypt,
                timestamp: Date.now()
            }));
            
            // 触发自定义事件，用于多标签页同步
            window.dispatchEvent(new CustomEvent('storage-change', {
                detail: { key, data }
            }));
        } catch (e) {
            console.error('保存缓存失败:', e);
            Utils.showMessage('保存失败，存储空间可能已满', 'error');
        }
    },
    
    /**
     * 从缓存读取（解密）
     * @param {string} key - 存储键
     * @param {any} defaultValue - 默认值
     * @returns {any} 读取的数据
     */
    get(key, defaultValue = null) {
        try {
            const stored = localStorage.getItem(key);
            if (!stored) return defaultValue;
            
            const parsed = JSON.parse(stored);
            if (parsed.encrypted) {
                return this.decrypt(parsed.data);
            }
            return parsed.data || defaultValue;
        } catch (e) {
            console.error('读取缓存失败:', e);
            return defaultValue;
        }
    },
    
    /**
     * 删除缓存
     * @param {string} key - 存储键
     */
    remove(key) {
        try {
            localStorage.removeItem(key);
            window.dispatchEvent(new CustomEvent('storage-change', {
                detail: { key, data: null }
            }));
        } catch (e) {
            console.error('删除缓存失败:', e);
        }
    },
    
    /**
     * 清除所有缓存
     */
    clear() {
        try {
            Object.keys(CONFIG.STORAGE_KEYS).forEach(key => {
                const storageKey = CONFIG.STORAGE_KEYS[key];
                if (storageKey.startsWith('tennis_')) {
                    localStorage.removeItem(storageKey);
                }
            });
            Utils.showMessage('缓存已清除', 'success');
        } catch (e) {
            console.error('清除缓存失败:', e);
            Utils.showMessage('清除缓存失败', 'error');
        }
    },
    
    /**
     * 获取缓存大小（KB）
     */
    getSize() {
        let total = 0;
        for (let key in localStorage) {
            if (localStorage.hasOwnProperty(key)) {
                    total += localStorage[key].length + key.length;
            }
        }
        return (total / 1024).toFixed(2);
    },
    
    /**
     * 同步缓存数据
     * @param {string} sourceKey - 源键
     * @param {string} targetKey - 目标键
     */
    sync(sourceKey, targetKey) {
        const sourceData = this.get(sourceKey);
        if (sourceData) {
            this.set(targetKey, sourceData, false);
            return true;
        }
        return false;
    },
    
    /**
     * 检查缓存冲突
     * @param {string} key - 存储键
     * @param {any} newData - 新数据
     * @returns {object} 冲突信息
     */
    checkConflict(key, newData) {
        const oldData = this.get(key);
        if (!oldData) return { hasConflict: false };
        
        // 简单的冲突检测：比较时间戳
        if (oldData.timestamp && newData.timestamp) {
            if (newData.timestamp < oldData.timestamp) {
                return {
                    hasConflict: true,
                    message: '检测到数据冲突，本地数据较新',
                    localData: oldData,
                    remoteData: newData
                };
            }
        }
        
        return { hasConflict: false };
    },
    
    /**
     * 监听存储变化（多标签页同步）
     * @param {function} callback - 回调函数
     */
    onStorageChange(callback) {
        window.addEventListener('storage', (e) => {
            if (e.key && e.key.startsWith('tennis_')) {
                try {
                    const data = JSON.parse(e.newValue);
                    callback({
                        key: e.key,
                        data: data.encrypted ? this.decrypt(data.data) : data.data,
                        oldValue: e.oldValue ? JSON.parse(e.oldValue) : null
                    });
                } catch (err) {
                    console.error('解析存储变化失败:', err);
                }
            }
        });
        
        // 监听自定义事件（同标签页）
        window.addEventListener('storage-change', (e) => {
            callback({
                key: e.detail.key,
                data: e.detail.data,
                oldValue: null
            });
        });
    }
};

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Cache;
}

