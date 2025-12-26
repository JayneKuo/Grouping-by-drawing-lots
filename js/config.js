/**
 * 系统配置模块
 * 统一管理系统配置项
 */

const CONFIG = {
    // 系统版本
    VERSION: '2.0.0',
    
    // 存储键名
    STORAGE_KEYS: {
        TOURNAMENTS: 'tennis_tournaments',
        USERS: 'tennis_users',
        CURRENT_USER: 'tennis_current_user',
        CACHE: 'tennis_cache',
        OPERATION_LOG: 'tennis_operation_log'
    },
    
    // 赛制配置
    FORMATS: {
        'short-set': {
            name: '短盘制',
            gamesToWin: 4,
            tiebreakAt: 3,
            setsToWin: 1,
            description: '先胜4局，3-3时抢七'
        },
        'best-of-3': {
            name: '三盘两胜制',
            gamesToWin: 6,
            tiebreakAt: 6,
            setsToWin: 2,
            description: '先胜6局，6-6时抢七，先胜2盘者获胜'
        },
        'best-of-5': {
            name: '五盘三胜制',
            gamesToWin: 6,
            tiebreakAt: 6,
            setsToWin: 3,
            description: '先胜6局，6-6时抢七，先胜3盘者获胜'
        }
    },
    
    // 计分方式
    SCORING_METHODS: {
        'ad': {
            name: '占先制',
            description: '40-40后需领先2分'
        },
        'no-ad': {
            name: '金球制',
            description: '40-40时下一分直接决定胜负'
        }
    },
    
    // 抢七规则
    TIEBREAK_RULES: {
        pointsToWin: 7,
        minLead: 2
    },
    
    // UI配置
    UI: {
        MIN_BUTTON_SIZE: 44, // 最小按钮尺寸（px）
        SYNC_INTERVAL: 1000, // 同步间隔（ms）
        DISPLAY_UPDATE_INTERVAL: 500 // 大屏更新间隔（ms）
    },
    
    // 状态颜色
    STATUS_COLORS: {
        'draft': '#9e9e9e',
        'registration': '#2196f3',
        'group-stage': '#4caf50',
        'knockout': '#ff9800',
        'finished': '#f44336',
        'scheduled': '#9e9e9e',
        'in-progress': '#4caf50',
        'pending': '#ffc107',
        'approved': '#4caf50',
        'rejected': '#f44336'
    }
};

// 导出配置
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}

