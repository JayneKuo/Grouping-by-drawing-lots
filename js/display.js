/**
 * 大屏展示模块
 * 实时同步比分，适配LED大屏
 */

const Display = {
    currentMatchId: null,
    updateInterval: null,
    
    /**
     * 初始化大屏
     */
    init() {
        // 从URL参数获取比赛ID
        const urlParams = new URLSearchParams(window.location.search);
        this.currentMatchId = urlParams.get('matchId');
        
        if (this.currentMatchId) {
            this.loadMatch(this.currentMatchId);
        } else {
            this.showMatchSelector();
        }
        
        // 定时更新比分
        this.startAutoUpdate();
        
        // 监听存储变化
        Cache.onStorageChange((change) => {
            if (change.key === CONFIG.STORAGE_KEYS.TOURNAMENTS) {
                this.updateDisplay();
            }
        });
    },
    
    /**
     * 加载比赛数据
     */
    loadMatch(matchId) {
        const tournaments = Cache.get(CONFIG.STORAGE_KEYS.TOURNAMENTS, []);
        
        for (const tournament of tournaments) {
            // 查找小组赛
            for (const groupMatches of Object.values(tournament.matches || {})) {
                const match = groupMatches.find(m => m.id === matchId);
                if (match) {
                    this.displayMatch(match, tournament);
                    return;
                }
            }
            
            // 查找淘汰赛
            if (tournament.knockoutMatches) {
                const match = tournament.knockoutMatches.find(m => m.id === matchId);
                if (match) {
                    this.displayMatch(match, tournament);
                    return;
                }
            }
        }
        
        Utils.showMessage('未找到比赛', 'error');
    },
    
    /**
     * 显示比赛
     */
    displayMatch(match, tournament) {
        // 获取选手信息
        const player1 = tournament.players.find(p => p.id === match.player1Id);
        const player2 = tournament.players.find(p => p.id === match.player2Id);
        
        if (!player1 || !player2) return;
        
        // 更新选手名称
        document.getElementById('display-player1-name').textContent = player1.name;
        document.getElementById('display-player2-name').textContent = player2.name;
        
        // 更新盘分
        this.updateSetScores(match);
        
        // 更新局分
        this.updateGameScore(match);
        
        // 更新统计
        this.updateStats(match, player1, player2);
        
        // 更新发球指示
        this.updateServingIndicator(match);
    },
    
    /**
     * 更新盘分显示
     */
    updateSetScores(match) {
        if (!match.sets || match.sets.length === 0) {
            document.getElementById('display-player1-sets').textContent = '0-0';
            document.getElementById('display-player2-sets').textContent = '0-0';
            return;
        }
        
        const setsDisplay = match.sets.map(set => {
            let score = `${set.games.player1}-${set.games.player2}`;
            if (set.tiebreak) {
                score += `(${set.tiebreak.player1}-${set.tiebreak.player2})`;
            }
            return score;
        }).join(' ');
        
        document.getElementById('display-player1-sets').textContent = setsDisplay;
        document.getElementById('display-player2-sets').textContent = setsDisplay;
    },
    
    /**
     * 更新局分显示
     */
    updateGameScore(match) {
        if (match.isTiebreak) {
            // 抢七模式
            document.getElementById('display-player1-game').textContent = match.tiebreakScore?.player1 || 0;
            document.getElementById('display-player2-game').textContent = match.tiebreakScore?.player2 || 0;
            document.getElementById('display-tiebreak').style.display = 'block';
            document.getElementById('display-tiebreak-score').textContent = 
                `${match.tiebreakScore?.player1 || 0}-${match.tiebreakScore?.player2 || 0}`;
        } else {
            // 正常局分
            const currentGame = match.currentGame || { player1: 0, player2: 0 };
            document.getElementById('display-player1-game').textContent = Utils.formatGameScore(currentGame.player1);
            document.getElementById('display-player2-game').textContent = Utils.formatGameScore(currentGame.player2);
            document.getElementById('display-tiebreak').style.display = 'none';
        }
    },
    
    /**
     * 更新统计信息
     */
    updateStats(match, player1, player2) {
        // 这里需要从pointHistory中统计ACE和失误
        // 简化处理
        document.getElementById('display-player1-aces').textContent = player1.stats?.aces || 0;
        document.getElementById('display-player1-faults').textContent = player1.stats?.faults || 0;
        document.getElementById('display-player2-aces').textContent = player2.stats?.aces || 0;
        document.getElementById('display-player2-faults').textContent = player2.stats?.faults || 0;
    },
    
    /**
     * 更新发球指示
     */
    updateServingIndicator(match) {
        const serving = match.currentGame?.serving || 1;
        document.getElementById('display-player1-serving').style.display = serving === 1 ? 'block' : 'none';
        document.getElementById('display-player2-serving').style.display = serving === 2 ? 'block' : 'none';
    },
    
    /**
     * 自动更新
     */
    startAutoUpdate() {
        this.updateInterval = setInterval(() => {
            this.updateDisplay();
        }, CONFIG.UI.DISPLAY_UPDATE_INTERVAL);
    },
    
    /**
     * 更新显示
     */
    updateDisplay() {
        if (this.currentMatchId) {
            this.loadMatch(this.currentMatchId);
        }
    },
    
    /**
     * 切换全屏
     */
    toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
        } else {
            document.exitFullscreen();
        }
    },
    
    /**
     * 显示场次选择器
     */
    showMatchSelector() {
        const modal = document.getElementById('match-selector-modal');
        const matchList = document.getElementById('match-list-display');
        
        if (!modal || !matchList) return;
        
        const tournaments = Cache.get(CONFIG.STORAGE_KEYS.TOURNAMENTS, []);
        let html = '';
        
        tournaments.forEach(tournament => {
            // 小组赛
            Object.values(tournament.matches || {}).forEach(groupMatches => {
                groupMatches.forEach(match => {
                    const p1 = tournament.players.find(p => p.id === match.player1Id);
                    const p2 = tournament.players.find(p => p.id === match.player2Id);
                    if (p1 && p2) {
                        html += `
                            <div class="match-selector-item" onclick="Display.selectMatch('${match.id}')">
                                ${p1.name} VS ${p2.name}
                            </div>
                        `;
                    }
                });
            });
            
            // 淘汰赛
            if (tournament.knockoutMatches) {
                tournament.knockoutMatches.forEach(match => {
                    const p1 = tournament.players.find(p => p.id === match.player1Id);
                    const p2 = tournament.players.find(p => p.id === match.player2Id);
                    if (p1 && p2) {
                        html += `
                            <div class="match-selector-item" onclick="Display.selectMatch('${match.id}')">
                                ${p1.name} VS ${p2.name}
                            </div>
                        `;
                    }
                });
            }
        });
        
        matchList.innerHTML = html || '<div>暂无比赛</div>';
        modal.style.display = 'block';
    },
    
    /**
     * 选择场次
     */
    selectMatch(matchId) {
        this.currentMatchId = matchId;
        window.history.replaceState({}, '', `?matchId=${matchId}`);
        this.loadMatch(matchId);
        this.closeMatchSelector();
    },
    
    /**
     * 关闭场次选择器
     */
    closeMatchSelector() {
        const modal = document.getElementById('match-selector-modal');
        if (modal) modal.style.display = 'none';
    },
    
    /**
     * 显示设置
     */
    showSettings() {
        // 这里可以实现样式自定义功能
        Utils.showMessage('设置功能开发中', 'info');
    }
};

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    Display.init();
});

