/**
 * 工具函数模块
 * 提供通用工具函数
 */

const Utils = {
    /**
     * 生成唯一ID
     */
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },
    
    /**
     * 格式化时间
     */
    formatTime(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleString('zh-CN');
    },
    
    /**
     * 格式化日期
     */
    formatDate(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleDateString('zh-CN');
    },
    
    /**
     * 深拷贝对象
     */
    deepClone(obj) {
        return JSON.parse(JSON.stringify(obj));
    },
    
    /**
     * 防抖函数
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },
    
    /**
     * 节流函数
     */
    throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },
    
    /**
     * 检查网络状态
     */
    isOnline() {
        return navigator.onLine;
    },
    
    /**
     * 监听网络状态变化
     */
    onNetworkChange(callback) {
        window.addEventListener('online', () => callback(true));
        window.addEventListener('offline', () => callback(false));
    },
    
    /**
     * 播放声音
     */
    playSound(type) {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            // 根据类型设置频率
            const frequencies = {
                'point': 800,
                'ace': 1200,
                'out': 400,
                'fault': 600
            };
            
            oscillator.frequency.value = frequencies[type] || 800;
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.1);
        } catch (error) {
            console.warn('无法播放声音:', error);
        }
    },
    
    /**
     * 播放音调
     */
    playTone(frequency, duration = 100) {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.value = frequency;
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration / 1000);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + duration / 1000);
        } catch (error) {
            console.warn('无法播放音调:', error);
        }
    },
    
    /**
     * 显示提示消息
     */
    showMessage(message, type = 'info') {
        // 简单的提示实现，可以替换为更美观的组件
        const colors = {
            'info': '#2196f3',
            'success': '#4caf50',
            'warning': '#ff9800',
            'error': '#f44336'
        };
        
        const messageEl = document.createElement('div');
        messageEl.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${colors[type] || colors.info};
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            z-index: 10000;
            animation: slideIn 0.3s;
        `;
        messageEl.textContent = message;
        document.body.appendChild(messageEl);
        
        setTimeout(() => {
            messageEl.style.animation = 'slideOut 0.3s';
            setTimeout(() => messageEl.remove(), 300);
        }, 3000);
    },
    
    /**
     * 确认对话框
     */
    confirm(message) {
        return window.confirm(message);
    },
    
    /**
     * 格式化局分显示
     */
    formatGameScore(score) {
        if (score === 0) return '0';
        if (score === 1) return '15';
        if (score === 2) return '30';
        if (score === 3) return '40';
        if (score === 'AD') return 'AD';
        return score;
    },
    
    /**
     * 格式化盘分显示
     */
    formatSetScore(set) {
        let score = `${set.games.player1}-${set.games.player2}`;
        if (set.tiebreak) {
            score += `(${set.tiebreak.player1}-${set.tiebreak.player2})`;
        }
        return score;
    }
};

// 添加CSS动画
if (!document.getElementById('utils-animations')) {
    const style = document.createElement('style');
    style.id = 'utils-animations';
    style.textContent = `
        @keyframes slideIn {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        @keyframes slideOut {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(100%);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Utils;
}

