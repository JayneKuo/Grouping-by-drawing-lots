/**
 * 主应用模块
 * 整合所有模块，初始化应用
 */

// 应用状态
const App = {
    state: {
        tournaments: [],
        currentTournamentId: null,
        currentMatch: null,
        currentUser: null
    },
    
    /**
     * 初始化应用
     */
    init() {
        console.log('初始化应用...');
        
        // 初始化内置用户
        Auth.initDefaultUsers();
        
        // 加载数据
        this.loadData();
        
        // 检查登录状态
        this.checkLoginStatus();
        
        // 初始化UI
        this.initUI();
        
        // 监听存储变化（多标签页同步）
        Cache.onStorageChange((change) => {
            console.log('存储变化:', change);
            this.handleStorageChange(change);
        });
        
        // 监听网络状态
        Utils.onNetworkChange((isOnline) => {
            if (isOnline) {
                Utils.showMessage('网络已连接', 'success');
                this.syncCache();
            } else {
                Utils.showMessage('网络已断开，数据将保存到本地缓存', 'warning');
            }
        });
        
        console.log('应用初始化完成');
    },
    
    /**
     * 加载数据
     */
    loadData() {
        this.state.tournaments = Cache.get(CONFIG.STORAGE_KEYS.TOURNAMENTS, []);
    },
    
    /**
     * 保存数据
     */
    saveData() {
        Cache.set(CONFIG.STORAGE_KEYS.TOURNAMENTS, this.state.tournaments, false);
    },
    
    /**
     * 检查登录状态
     */
    checkLoginStatus() {
        this.state.currentUser = Auth.getCurrentUser();
        this.updateUserDisplay();
    },
    
    /**
     * 更新用户显示
     */
    updateUserDisplay() {
        const userDisplay = document.getElementById('current-user-display');
        const loginBtn = document.getElementById('login-btn');
        const logoutBtn = document.getElementById('logout-btn');
        
        if (this.state.currentUser) {
            if (userDisplay) userDisplay.textContent = `当前用户：${this.state.currentUser.username}`;
            if (loginBtn) loginBtn.style.display = 'none';
            if (logoutBtn) logoutBtn.style.display = 'inline-block';
        } else {
            if (userDisplay) userDisplay.textContent = '未登录';
            if (loginBtn) loginBtn.style.display = 'inline-block';
            if (logoutBtn) logoutBtn.style.display = 'none';
        }
    },
    
    /**
     * 初始化UI
     */
    initUI() {
        this.initButtons();
        this.renderTournaments();
        this.showSection('tournaments');
    },
    
    /**
     * 初始化按钮事件
     */
    initButtons() {
        // 登录相关
        const loginBtn = document.getElementById('login-btn');
        if (loginBtn) {
            loginBtn.addEventListener('click', () => this.showLoginModal());
        }
        
        const promptLoginBtn = document.getElementById('prompt-login-btn');
        if (promptLoginBtn) {
            promptLoginBtn.addEventListener('click', () => this.showLoginModal());
        }
        
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.logout());
        }
        
        // 比赛相关
        const newTournamentBtn = document.getElementById('new-tournament-btn');
        if (newTournamentBtn) {
            newTournamentBtn.addEventListener('click', () => {
                if (!this.state.currentUser) {
                    Utils.showMessage('请先登录', 'warning');
                    this.showLoginModal();
                    return;
                }
                this.showCreateTournament();
            });
        }
        
        const saveTournamentBtn = document.getElementById('save-tournament-btn');
        if (saveTournamentBtn) {
            saveTournamentBtn.addEventListener('click', () => this.saveTournament());
        }
        
        const cancelCreateBtn = document.getElementById('cancel-create-btn');
        if (cancelCreateBtn) {
            cancelCreateBtn.addEventListener('click', () => this.showSection('tournaments'));
        }
        
        const backToListBtn = document.getElementById('back-to-list-btn');
        if (backToListBtn) {
            backToListBtn.addEventListener('click', () => this.showSection('tournaments'));
        }
        
        // 登录弹窗
        this.initLoginModal();
        
        // 比分录入
        const cancelScoreBtn = document.getElementById('cancel-score-btn');
        if (cancelScoreBtn) {
            cancelScoreBtn.addEventListener('click', () => this.closeScoreModal());
        }
        
        const closeBtn = document.querySelector('.close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.closeScoreModal());
        }
    },
    
    /**
     * 初始化登录弹窗
     */
    initLoginModal() {
        const loginTab = document.getElementById('login-tab');
        const registerTab = document.getElementById('register-tab');
        const submitLoginBtn = document.getElementById('submit-login-btn');
        const submitRegisterBtn = document.getElementById('submit-register-btn');
        const closeLoginBtn = document.getElementById('close-login');
        const cancelLoginBtn = document.getElementById('cancel-login-btn');
        const cancelRegisterBtn = document.getElementById('cancel-register-btn');
        
        if (loginTab) {
            loginTab.addEventListener('click', () => this.switchLoginTab('login'));
        }
        if (registerTab) {
            registerTab.addEventListener('click', () => this.switchLoginTab('register'));
        }
        if (submitLoginBtn) {
            submitLoginBtn.addEventListener('click', () => this.handleLogin());
        }
        if (submitRegisterBtn) {
            submitRegisterBtn.addEventListener('click', () => this.handleRegister());
        }
        if (closeLoginBtn) {
            closeLoginBtn.addEventListener('click', () => this.closeLoginModal());
        }
        if (cancelLoginBtn) {
            cancelLoginBtn.addEventListener('click', () => this.closeLoginModal());
        }
        if (cancelRegisterBtn) {
            cancelRegisterBtn.addEventListener('click', () => this.closeLoginModal());
        }
        
        // 点击背景关闭
        const loginModal = document.getElementById('login-modal');
        const modalBackdrop = document.getElementById('modal-backdrop');
        if (loginModal) {
            // 点击背景遮罩关闭
            if (modalBackdrop) {
                modalBackdrop.addEventListener('click', () => {
                    this.closeLoginModal();
                });
            }
            // 点击模态框外部关闭
            loginModal.addEventListener('click', (e) => {
                if (e.target === loginModal) {
                    this.closeLoginModal();
                }
            });
        }
    },
    
    /**
     * 显示指定页面
     */
    showSection(sectionName) {
        const loginPrompt = document.getElementById('login-prompt-section');
        const tournamentsSection = document.getElementById('tournaments-section');
        const createSection = document.getElementById('create-tournament-section');
        const detailSection = document.getElementById('tournament-detail-section');
        
        if (this.state.currentUser) {
            if (loginPrompt) loginPrompt.style.display = 'none';
            if (tournamentsSection) tournamentsSection.style.display = sectionName === 'tournaments' ? 'block' : 'none';
        } else {
            if (loginPrompt) loginPrompt.style.display = 'block';
            if (tournamentsSection) tournamentsSection.style.display = 'none';
        }
        
        if (createSection) createSection.style.display = sectionName === 'create' ? 'block' : 'none';
        if (detailSection) detailSection.style.display = sectionName === 'detail' ? 'block' : 'none';
    },
    
    /**
     * 显示登录弹窗
     */
    showLoginModal() {
        const modal = document.getElementById('login-modal');
        if (modal) {
            modal.style.display = 'block';
            this.switchLoginTab('login');
        }
    },
    
    /**
     * 关闭登录弹窗
     */
    closeLoginModal() {
        const modal = document.getElementById('login-modal');
        if (modal) modal.style.display = 'none';
        
        // 清空表单
        const loginUsername = document.getElementById('login-username');
        const loginPassword = document.getElementById('login-password');
        const registerUsername = document.getElementById('register-username');
        const registerPassword = document.getElementById('register-password');
        const registerPasswordConfirm = document.getElementById('register-password-confirm');
        
        if (loginUsername) loginUsername.value = '';
        if (loginPassword) loginPassword.value = '';
        if (registerUsername) registerUsername.value = '';
        if (registerPassword) registerPassword.value = '';
        if (registerPasswordConfirm) registerPasswordConfirm.value = '';
    },
    
    /**
     * 切换登录/注册标签
     */
    switchLoginTab(tab) {
        const loginTab = document.getElementById('login-tab');
        const registerTab = document.getElementById('register-tab');
        const loginForm = document.getElementById('login-form');
        const registerForm = document.getElementById('register-form');
        const modalTitle = document.getElementById('login-modal-title');
        
        if (tab === 'login') {
            if (loginTab) loginTab.classList.add('active');
            if (registerTab) registerTab.classList.remove('active');
            if (loginForm) {
                loginForm.classList.add('active');
                loginForm.style.display = 'block';
            }
            if (registerForm) {
                registerForm.classList.remove('active');
                registerForm.style.display = 'none';
            }
            if (modalTitle) modalTitle.textContent = '欢迎回来';
        } else {
            if (registerTab) registerTab.classList.add('active');
            if (loginTab) loginTab.classList.remove('active');
            if (loginForm) {
                loginForm.classList.remove('active');
                loginForm.style.display = 'none';
            }
            if (registerForm) {
                registerForm.classList.add('active');
                registerForm.style.display = 'block';
            }
            if (modalTitle) modalTitle.textContent = '创建账号';
        }
    },
    
    /**
     * 处理登录
     */
    handleLogin() {
        const username = document.getElementById('login-username')?.value.trim();
        const password = document.getElementById('login-password')?.value;
        
        if (!username || !password) {
            Utils.showMessage('请输入用户名和密码', 'warning');
            return;
        }
        
        const user = Auth.login(username, password);
        if (user) {
            this.state.currentUser = user;
            this.updateUserDisplay();
            this.closeLoginModal();
            this.showSection('tournaments');
            this.renderTournaments();
            Utils.showMessage('登录成功', 'success');
        } else {
            Utils.showMessage('用户名或密码错误', 'error');
        }
    },
    
    /**
     * 处理注册
     */
    handleRegister() {
        const username = document.getElementById('register-username')?.value.trim();
        const password = document.getElementById('register-password')?.value;
        const passwordConfirm = document.getElementById('register-password-confirm')?.value;
        
        const result = Auth.register(username, password);
        if (!result.success) {
            Utils.showMessage(result.message, 'error');
            return;
        }
        
        if (password !== passwordConfirm) {
            Utils.showMessage('两次输入的密码不一致', 'error');
            return;
        }
        
        Utils.showMessage('注册成功，请登录', 'success');
        this.switchLoginTab('login');
    },
    
    /**
     * 退出登录
     */
    logout() {
        Auth.logout();
        this.state.currentUser = null;
        this.updateUserDisplay();
        this.showSection('tournaments');
        Utils.showMessage('已退出登录', 'info');
    },
    
    /**
     * 渲染比赛列表
     */
    renderTournaments() {
        const container = document.getElementById('tournaments-list');
        if (!container) return;
        
        if (this.state.tournaments.length === 0) {
            container.innerHTML = '<div class="empty-state">暂无比赛，点击"创建新比赛"开始</div>';
            return;
        }
        
        container.innerHTML = this.state.tournaments.map(tournament => {
            const formatInfo = CONFIG.FORMATS[tournament.format];
            const status = this.getTournamentStatus(tournament);
            
            return `
                <div class="tournament-card" onclick="App.openTournament('${tournament.id}')">
                    <h3>${tournament.name}</h3>
                    <div class="tournament-meta">
                        <span class="meta-item">📋 ${formatInfo.name}</span>
                        <span class="meta-item">👥 ${tournament.players?.length || 0}人</span>
                        <span class="meta-item">📅 ${Utils.formatDate(tournament.createdAt)}</span>
                    </div>
                    <div class="tournament-status ${status.class}">${status.text}</div>
                </div>
            `;
        }).join('');
    },
    
    /**
     * 获取比赛状态
     */
    getTournamentStatus(tournament) {
        if (!tournament.groups || Object.keys(tournament.groups).length === 0) {
            return { text: '未分组', class: 'status-pending' };
        }
        
        const allMatchesCompleted = Object.values(tournament.matches || {}).every(groupMatches => 
            groupMatches.every(m => m.status === 'finished')
        );
        
        if (allMatchesCompleted && tournament.knockoutMatches && tournament.knockoutMatches.length > 0) {
            const knockoutCompleted = tournament.knockoutMatches.every(m => m.status === 'finished');
            if (knockoutCompleted) {
                return { text: '已完成', class: 'status-completed' };
            }
            return { text: '淘汰赛进行中', class: 'status-knockout' };
        }
        
        if (allMatchesCompleted) {
            return { text: '小组赛已完成', class: 'status-group-completed' };
        }
        
        return { text: '小组赛进行中', class: 'status-group' };
    },
    
    /**
     * 显示创建比赛页面
     */
    showCreateTournament() {
        document.getElementById('create-section-title').textContent = '创建新比赛';
        document.getElementById('tournament-name').value = '';
        document.getElementById('tournament-format').value = 'short-set';
        document.getElementById('scoring-method').value = 'no-ad';
        document.getElementById('group-method').value = '2-groups';
        document.getElementById('players-input').value = '';
        this.showSection('create');
    },
    
    /**
     * 保存比赛
     */
    saveTournament() {
        const name = document.getElementById('tournament-name')?.value.trim();
        const format = document.getElementById('tournament-format')?.value;
        const scoringMethod = document.getElementById('scoring-method')?.value;
        const groupMethod = document.getElementById('group-method')?.value;
        const playersText = document.getElementById('players-input')?.value.trim();
        
        if (!name) {
            Utils.showMessage('请输入比赛名称', 'warning');
            return;
        }
        
        const players = playersText.split('\n')
            .map(p => p.trim())
            .filter(p => p.length > 0)
            .map(name => ({
                id: Utils.generateId(),
                name,
                status: 'approved',
                stats: { aces: 0, faults: 0, doubleFaults: 0 }
            }));
        
        if (players.length < 2) {
            Utils.showMessage('至少需要2名参赛选手', 'warning');
            return;
        }
        
        const tournament = {
            id: Utils.generateId(),
            name,
            format,
            scoringMethod,
            tiebreakRule: {
                enabled: true,
                pointsToWin: CONFIG.TIEBREAK_RULES.pointsToWin,
                minLead: CONFIG.TIEBREAK_RULES.minLead
            },
            groupMethod,
            status: 'registration',
            rulesLocked: false,
            players,
            groups: {},
            matches: {},
            standings: {},
            knockoutMatches: [],
            createdAt: Date.now(),
            createdBy: this.state.currentUser?.id
        };
        
        this.state.tournaments.push(tournament);
        this.saveData();
        Auth.logOperation('create_tournament', { tournamentId: tournament.id, name });
        
        this.renderTournaments();
        this.showSection('tournaments');
        Utils.showMessage('比赛创建成功', 'success');
    },
    
    /**
     * 打开比赛详情
     */
    openTournament(tournamentId) {
        this.state.currentTournamentId = tournamentId;
        const tournament = this.state.tournaments.find(t => t.id === tournamentId);
        if (!tournament) {
            Utils.showMessage('比赛不存在', 'error');
            return;
        }
        
        // 显示比赛详情
        const titleEl = document.getElementById('tournament-detail-title');
        if (titleEl) titleEl.textContent = tournament.name;
        
        const formatInfo = CONFIG.FORMATS[tournament.format];
        const scoringText = CONFIG.SCORING_METHODS[tournament.scoringMethod]?.name || '金球制';
        const infoEl = document.getElementById('tournament-info');
        if (infoEl) {
            infoEl.innerHTML = `
                <div class="info-item">赛制：${formatInfo.description}</div>
                <div class="info-item">计分方式：${scoringText}</div>
                <div class="info-item">参赛人数：${tournament.players?.length || 0}人</div>
                <div class="info-item">状态：${this.getTournamentStatus(tournament).text}</div>
            `;
        }
        
        // 渲染选手列表
        const playersContainer = document.getElementById('players-container');
        if (playersContainer) {
            playersContainer.innerHTML = '';
            tournament.players?.forEach((player, index) => {
                const card = document.createElement('div');
                card.className = 'player-card';
                card.textContent = `${index + 1}. ${player.name}`;
                playersContainer.appendChild(card);
            });
        }
        
        // 如果已分组，显示分组和比赛
        if (tournament.groups && Object.keys(tournament.groups).length > 0) {
            const groupingSection = document.getElementById('grouping-section');
            const groupStageSection = document.getElementById('group-stage-section');
            if (groupingSection) groupingSection.style.display = 'none';
            if (groupStageSection) groupStageSection.style.display = 'block';
            // TODO: 渲染比赛和积分榜
        } else {
            const groupingSection = document.getElementById('grouping-section');
            const groupStageSection = document.getElementById('group-stage-section');
            if (groupingSection) groupingSection.style.display = 'block';
            if (groupStageSection) groupStageSection.style.display = 'none';
            
            // 绑定抽签按钮
            const drawBtn = document.getElementById('draw-btn');
            if (drawBtn) {
                drawBtn.onclick = () => this.drawGroups(tournament);
            }
        }
        
        this.showSection('detail');
    },
    
    /**
     * 抽签分组
     */
    drawGroups(tournament) {
        if (!tournament.players || tournament.players.length < 2) {
            Utils.showMessage('至少需要2名选手', 'warning');
            return;
        }
        
        const players = [...tournament.players];
        const shuffled = players.sort(() => Math.random() - 0.5);
        
        if (tournament.groupMethod === '2-groups') {
            const groupSize = Math.ceil(shuffled.length / 2);
            tournament.groups = {
                A: shuffled.slice(0, groupSize).map(p => p.id),
                B: shuffled.slice(groupSize).map(p => p.id)
            };
        } else if (tournament.groupMethod === '4-groups') {
            const groupSize = Math.ceil(shuffled.length / 4);
            tournament.groups = {
                A: shuffled.slice(0, groupSize).map(p => p.id),
                B: shuffled.slice(groupSize, groupSize * 2).map(p => p.id),
                C: shuffled.slice(groupSize * 2, groupSize * 3).map(p => p.id),
                D: shuffled.slice(groupSize * 3).map(p => p.id)
            };
        } else {
            tournament.groups = {};
        }
        
        tournament.status = 'group-stage';
        this.saveData();
        Auth.logOperation('draw_groups', { tournamentId: tournament.id });
        
        this.openTournament(tournament.id);
        Utils.showMessage('分组完成', 'success');
    },
    
    /**
     * 关闭比分录入弹窗
     */
    closeScoreModal() {
        const modal = document.getElementById('score-modal');
        if (modal) modal.style.display = 'none';
        this.state.currentMatch = null;
    },
    
    /**
     * 处理存储变化
     */
    handleStorageChange(change) {
        if (change.key === CONFIG.STORAGE_KEYS.TOURNAMENTS) {
            this.state.tournaments = change.data || [];
            this.renderTournaments();
        }
    },
    
    /**
     * 同步缓存
     */
    syncCache() {
        // 这里可以实现与服务器的同步逻辑
        console.log('同步缓存...');
    },
    
    /**
     * 打开比分录入弹窗
     */
    openScoreModal(matchId, tournamentId) {
        if (!this.state.currentUser) {
            Utils.showMessage('请先登录', 'warning');
            this.showLoginModal();
            return;
        }
        
        const tournament = this.state.tournaments.find(t => t.id === tournamentId);
        if (!tournament) {
            Utils.showMessage('比赛不存在', 'error');
            return;
        }
        
        // 查找比赛
        let match = null;
        if (tournament.matches) {
            for (const groupMatches of Object.values(tournament.matches)) {
                match = groupMatches.find(m => m.id === matchId);
                if (match) break;
            }
        }
        if (!match && tournament.knockoutMatches) {
            match = tournament.knockoutMatches.find(m => m.id === matchId);
        }
        
        if (!match) {
            Utils.showMessage('比赛不存在', 'error');
            return;
        }
        
        this.state.currentMatch = { match, tournament };
        
        // 初始化比赛状态
        if (!match.sets) match.sets = [];
        if (!match.currentGame) {
            match.currentGame = { player1: 0, player2: 0, serving: 1 };
        }
        
        // 显示弹窗
        const modal = document.getElementById('score-modal');
        if (modal) {
            modal.style.display = 'block';
            
            // 更新显示
            const titleEl = document.getElementById('modal-title');
            if (titleEl) titleEl.textContent = `${match.player1} VS ${match.player2}`;
            
            const matchInfoEl = document.getElementById('modal-match-info');
            if (matchInfoEl) {
                matchInfoEl.textContent = `比赛ID: ${match.id}`;
            }
            
            this.updatePointDisplay();
        }
    },
    
    /**
     * 更新逐分录入显示
     */
    updatePointDisplay() {
        if (!this.state.currentMatch) return;
        
        const { match } = this.state.currentMatch;
        
        // 更新选手名称
        const player1NameEl = document.getElementById('player1-current-name');
        const player2NameEl = document.getElementById('player2-current-name');
        if (player1NameEl) player1NameEl.textContent = match.player1;
        if (player2NameEl) player2NameEl.textContent = match.player2;
        
        // 更新当前局分
        const currentGame = match.currentGame || { player1: 0, player2: 0, serving: 1 };
        const player1ScoreEl = document.getElementById('player1-game-score');
        const player2ScoreEl = document.getElementById('player2-game-score');
        if (player1ScoreEl) player1ScoreEl.textContent = this.formatGameScore(currentGame.player1);
        if (player2ScoreEl) player2ScoreEl.textContent = this.formatGameScore(currentGame.player2);
        
        // 更新发球指示
        const player1ServingEl = document.getElementById('player1-serving');
        const player2ServingEl = document.getElementById('player2-serving');
        if (player1ServingEl) player1ServingEl.textContent = currentGame.serving === 1 ? '发球' : '';
        if (player2ServingEl) player2ServingEl.textContent = currentGame.serving === 2 ? '发球' : '';
        
        // 更新盘分显示
        const setScoresEl = document.getElementById('set-scores-display');
        if (setScoresEl && match.sets) {
            setScoresEl.innerHTML = match.sets.map((set, index) => {
                const setNum = index + 1;
                const p1Games = set.games?.player1 || 0;
                const p2Games = set.games?.player2 || 0;
                const tiebreak = set.tiebreak ? `(${set.tiebreak.player1}-${set.tiebreak.player2})` : '';
                return `<div class="set-score-item">第${setNum}盘: ${p1Games}-${p2Games} ${tiebreak}</div>`;
            }).join('');
        }
    },
    
    /**
     * 格式化局分显示
     */
    formatGameScore(score) {
        if (score === 'AD') return 'AD';
        if (score === 0) return '0';
        if (score === 1) return '15';
        if (score === 2) return '30';
        if (score === 3) return '40';
        return score;
    },
    
    /**
     * 添加操作历史
     */
    addPointHistory(action) {
        if (!this.state.currentMatch) return;
        
        if (!this.state.currentMatch.history) {
            this.state.currentMatch.history = [];
        }
        
        const historyItem = {
            action,
            time: new Date().toLocaleTimeString('zh-CN'),
            user: this.state.currentUser?.username || '未知'
        };
        
        this.state.currentMatch.history.push(historyItem);
        
        // 只保留最近20条
        if (this.state.currentMatch.history.length > 20) {
            this.state.currentMatch.history.shift();
        }
        
        // 更新显示
        const historyListEl = document.getElementById('point-history-list');
        if (historyListEl) {
            historyListEl.innerHTML = this.state.currentMatch.history.map(item => 
                `<div class="history-item">[${item.time}] ${item.user}: ${item.action}</div>`
            ).join('');
        }
    }
};

// 全局函数（用于onclick）
window.App = App;

// 全局函数：逐分录入系统
window.recordPoint = function(player, type) {
    if (!App.state.currentMatch || !App.state.currentMatch.match) {
        Utils.showMessage('请先选择比赛', 'warning');
        return;
    }
    
    const { match, tournament } = App.state.currentMatch;
    const updatedMatch = Scoring.recordPoint(match, player, type === 'ace' ? 'ace' : 'point', tournament);
    
    // 更新比赛状态
    App.state.currentMatch.match = updatedMatch;
    
    // 播放声音
    Utils.playSound(type === 'ace' ? 'ace' : 'point');
    
    // 记录操作历史
    const playerName = player === 1 ? match.player1 : match.player2;
    const action = type === 'ace' ? 'ACE' : '得分';
    App.addPointHistory(`${playerName} ${action}`);
    
    // 更新显示
    App.updatePointDisplay();
    
    // 保存
    App.saveData();
};

window.recordSpecial = function(action) {
    if (!App.state.currentMatch || !App.state.currentMatch.match) {
        Utils.showMessage('请先选择比赛', 'warning');
        return;
    }
    
    // 播放声音
    if (action === 'out') {
        Utils.playSound('out');
    } else if (action === 'fault' || action === 'doubleFault') {
        Utils.playSound('fault');
    }
    
    // 记录操作历史
    const actionText = {
        'out': 'OUT',
        'fault': '发球失误',
        'doubleFault': '双误',
        'let': '重发'
    }[action] || action;
    
    App.addPointHistory(`特殊操作：${actionText}`);
    
    // 如果是双误，对手得分
    if (action === 'doubleFault') {
        const { match, tournament } = App.state.currentMatch;
        const opponent = match.currentGame?.serving === 1 ? 2 : 1;
        window.recordPoint(opponent, 'normal');
    }
};

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
    try {
        console.log('开始初始化应用...');
        App.init();
        console.log('应用初始化完成');
    } catch (error) {
        console.error('应用初始化失败:', error);
        console.error('错误堆栈:', error.stack);
        Utils.showMessage('应用启动失败：' + error.message, 'error');
    }
});

