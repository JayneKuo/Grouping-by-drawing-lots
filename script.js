// 应用状态
let appState = {
    tournaments: [],
    currentTournamentId: null,
    currentMatch: null,
    currentUser: null
};

// 用户数据
let usersData = {
    users: [],
    currentUserId: null
};

// 赛制配置
const formatConfigs = {
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
};

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    console.log('开始初始化应用...');
    try {
        console.log('1. 加载存储数据...');
        loadFromStorage();
        console.log('2. 加载用户数据...');
        loadUsersData();
        console.log('3. 检查登录状态...');
        checkLoginStatus();
        console.log('4. 初始化按钮...');
        initializeButtons();
        console.log('5. 显示页面...');
        
        // 根据登录状态显示不同页面
        if (appState.currentUser) {
            console.log('用户已登录，显示比赛列表');
            renderTournaments();
            showSection('tournaments');
        } else {
            console.log('用户未登录，显示登录提示页');
            showSection('tournaments'); // 这会显示登录提示页
        }
        console.log('初始化完成！');
    } catch (error) {
        console.error('初始化错误:', error);
        console.error('错误堆栈:', error.stack);
        const errorMsg = '应用启动失败：' + error.message + '\n\n请检查浏览器控制台获取详细信息。';
        alert(errorMsg);
        // 显示错误信息在页面上
        document.body.innerHTML += '<div style="position:fixed;top:0;left:0;right:0;background:red;color:white;padding:20px;z-index:9999;">' + errorMsg + '</div>';
    }
});

// 显示指定页面
function showSection(sectionName) {
    const loginPrompt = document.getElementById('login-prompt-section');
    const tournamentsSection = document.getElementById('tournaments-section');
    const createSection = document.getElementById('create-tournament-section');
    const detailSection = document.getElementById('tournament-detail-section');
    
    // 根据登录状态显示/隐藏登录提示
    if (appState.currentUser) {
        if (loginPrompt) loginPrompt.style.display = 'none';
        if (tournamentsSection) tournamentsSection.style.display = sectionName === 'tournaments' ? 'block' : 'none';
    } else {
        if (loginPrompt) loginPrompt.style.display = 'block';
        if (tournamentsSection) tournamentsSection.style.display = 'none';
    }
    
    if (createSection) createSection.style.display = sectionName === 'create' ? 'block' : 'none';
    if (detailSection) detailSection.style.display = sectionName === 'detail' ? 'block' : 'none';
}

// 初始化按钮事件
function initializeButtons() {
    try {
        console.log('开始初始化按钮事件...');
        // 检查必要的元素是否存在
        const requiredElements = [
            'new-tournament-btn', 'login-btn', 'logout-btn', 
            'save-tournament-btn', 'cancel-create-btn', 'back-to-list-btn',
            'cancel-score-btn', 'close-login',
            'login-tab', 'register-tab', 'submit-login-btn',
            'submit-register-btn', 'cancel-login-btn', 'cancel-register-btn',
            'prompt-login-btn'
        ];
        
        const missingElements = [];
        for (const id of requiredElements) {
            const element = document.getElementById(id);
            if (!element) {
                missingElements.push(id);
                console.warn(`元素未找到: ${id}`);
            }
        }
        
        if (missingElements.length > 0) {
            console.warn('缺少以下元素:', missingElements);
        }
        
        const newTournamentBtn = document.getElementById('new-tournament-btn');
        if (newTournamentBtn) {
            newTournamentBtn.addEventListener('click', () => {
                if (!appState.currentUser) {
                    alert('请先登录');
                    showLoginModal();
                    return;
                }
                showCreateTournament();
            });
        }
        
        const loginBtn = document.getElementById('login-btn');
        if (loginBtn) {
            loginBtn.addEventListener('click', showLoginModal);
        }
        
        const promptLoginBtn = document.getElementById('prompt-login-btn');
        if (promptLoginBtn) {
            promptLoginBtn.addEventListener('click', showLoginModal);
        }
        
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', logout);
        }
        const saveTournamentBtn = document.getElementById('save-tournament-btn');
        if (saveTournamentBtn) {
            saveTournamentBtn.addEventListener('click', saveTournament);
        }
        
        const cancelCreateBtn = document.getElementById('cancel-create-btn');
        if (cancelCreateBtn) {
            cancelCreateBtn.addEventListener('click', () => {
                showSection('tournaments');
            });
        }
        
        const backToListBtn = document.getElementById('back-to-list-btn');
        if (backToListBtn) {
            backToListBtn.addEventListener('click', () => {
                showSection('tournaments');
            });
        }
        
        const cancelScoreBtn = document.getElementById('cancel-score-btn');
        if (cancelScoreBtn) {
            cancelScoreBtn.addEventListener('click', closeModal);
        }
        
        const closeBtn = document.querySelector('.close');
        if (closeBtn) {
            closeBtn.addEventListener('click', closeModal);
        }
        
        const closeLoginBtn = document.getElementById('close-login');
        if (closeLoginBtn) {
            closeLoginBtn.addEventListener('click', closeLoginModal);
        }
        
        // 登录相关按钮
        const loginTab = document.getElementById('login-tab');
        if (loginTab) {
            loginTab.addEventListener('click', () => switchLoginTab('login'));
        }
        
        const registerTab = document.getElementById('register-tab');
        if (registerTab) {
            registerTab.addEventListener('click', () => switchLoginTab('register'));
        }
        
        const submitLoginBtn = document.getElementById('submit-login-btn');
        if (submitLoginBtn) {
            submitLoginBtn.addEventListener('click', handleLogin);
        }
        
        const submitRegisterBtn = document.getElementById('submit-register-btn');
        if (submitRegisterBtn) {
            submitRegisterBtn.addEventListener('click', handleRegister);
        }
        
        const cancelLoginBtn = document.getElementById('cancel-login-btn');
        if (cancelLoginBtn) {
            cancelLoginBtn.addEventListener('click', closeLoginModal);
        }
        
        const cancelRegisterBtn = document.getElementById('cancel-register-btn');
        if (cancelRegisterBtn) {
            cancelRegisterBtn.addEventListener('click', closeLoginModal);
        }
        
        console.log('按钮事件初始化完成');
        
        window.addEventListener('click', (e) => {
            const modal = document.getElementById('score-modal');
            if (e.target === modal) {
                closeModal();
            }
            const loginModal = document.getElementById('login-modal');
            if (e.target === loginModal) {
                closeLoginModal();
            }
        });
    } catch (error) {
        console.error('初始化按钮失败:', error);
        alert('初始化失败：' + error.message);
    }
}

// 用户登录相关函数
function loadUsersData() {
    try {
        const saved = localStorage.getItem('tennisUsers');
        if (saved) {
            usersData = JSON.parse(saved);
        } else {
            // 初始化内置账号
            usersData.users = [
                { id: '1', username: 'admin', password: 'admin123', createdAt: new Date().toISOString() },
                { id: '2', username: 'user1', password: 'user123', createdAt: new Date().toISOString() },
                { id: '3', username: 'user2', password: 'user123', createdAt: new Date().toISOString() }
            ];
            saveUsersData();
        }
    } catch (e) {
        console.error('加载用户数据失败:', e);
    }
}

function saveUsersData() {
    try {
        localStorage.setItem('tennisUsers', JSON.stringify(usersData));
    } catch (e) {
        console.error('保存用户数据失败:', e);
    }
}

function checkLoginStatus() {
    if (usersData.currentUserId) {
        const user = usersData.users.find(u => u.id === usersData.currentUserId);
        if (user) {
            appState.currentUser = user;
        }
    }
    // 确保DOM加载后再更新显示
    if (document.getElementById('current-user-display')) {
        updateUserDisplay();
    }
}

function updateUserDisplay() {
    try {
        const userDisplay = document.getElementById('current-user-display');
        const loginBtn = document.getElementById('login-btn');
        const logoutBtn = document.getElementById('logout-btn');
        
        if (!userDisplay || !loginBtn || !logoutBtn) {
            console.warn('用户界面元素未找到');
            return;
        }
        
        if (appState.currentUser) {
            userDisplay.textContent = `当前用户：${appState.currentUser.username}`;
            loginBtn.style.display = 'none';
            logoutBtn.style.display = 'inline-block';
        } else {
            userDisplay.textContent = '未登录';
            loginBtn.style.display = 'inline-block';
            logoutBtn.style.display = 'none';
        }
    } catch (error) {
        console.error('更新用户显示失败:', error);
    }
}

function showLoginModal() {
    document.getElementById('login-modal').style.display = 'block';
    switchLoginTab('login');
}

function closeLoginModal() {
    document.getElementById('login-modal').style.display = 'none';
    // 清空表单
    document.getElementById('login-username').value = '';
    document.getElementById('login-password').value = '';
    document.getElementById('register-username').value = '';
    document.getElementById('register-password').value = '';
    document.getElementById('register-password-confirm').value = '';
}

function switchLoginTab(tab) {
    const loginTab = document.getElementById('login-tab');
    const registerTab = document.getElementById('register-tab');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    
    if (tab === 'login') {
        loginTab.classList.add('active');
        registerTab.classList.remove('active');
        loginForm.style.display = 'block';
        registerForm.style.display = 'none';
        document.getElementById('login-modal-title').textContent = '用户登录';
    } else {
        registerTab.classList.add('active');
        loginTab.classList.remove('active');
        loginForm.style.display = 'none';
        registerForm.style.display = 'block';
        document.getElementById('login-modal-title').textContent = '用户注册';
    }
}

function handleLogin() {
    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value;
    
    if (!username || !password) {
        alert('请输入用户名和密码');
        return;
    }
    
    const user = usersData.users.find(u => u.username === username && u.password === password);
    if (user) {
        appState.currentUser = user;
        usersData.currentUserId = user.id;
        saveUsersData();
        updateUserDisplay();
        closeLoginModal();
        // 登录成功后显示比赛列表
        showSection('tournaments');
        renderTournaments();
        alert('登录成功！');
    } else {
        alert('用户名或密码错误');
    }
}

function handleRegister() {
    const username = document.getElementById('register-username').value.trim();
    const password = document.getElementById('register-password').value;
    const passwordConfirm = document.getElementById('register-password-confirm').value;
    
    if (!username || username.length < 2 || username.length > 20) {
        alert('用户名长度必须在2-20个字符之间');
        return;
    }
    
    if (!password || password.length < 6) {
        alert('密码长度至少6个字符');
        return;
    }
    
    if (password !== passwordConfirm) {
        alert('两次输入的密码不一致');
        return;
    }
    
    if (usersData.users.find(u => u.username === username)) {
        alert('用户名已存在');
        return;
    }
    
    const newUser = {
        id: Date.now().toString(),
        username,
        password,
        createdAt: new Date().toISOString()
    };
    
    usersData.users.push(newUser);
    saveUsersData();
    
    alert('注册成功！请登录');
    switchLoginTab('login');
}

function logout() {
    appState.currentUser = null;
    usersData.currentUserId = null;
    saveUsersData();
    updateUserDisplay();
    // 退出登录后显示登录提示页
    showSection('tournaments');
    alert('已退出登录');
}

// 显示创建比赛页面
function showCreateTournament() {
    document.getElementById('create-section-title').textContent = '创建新比赛';
    document.getElementById('tournament-name').value = '';
    document.getElementById('tournament-format').value = 'short-set';
    document.getElementById('scoring-method').value = 'no-ad';
    document.getElementById('group-method').value = '2-groups';
    document.getElementById('players-input').value = '';
    showSection('create');
}

// 保存比赛
function saveTournament() {
    const name = document.getElementById('tournament-name').value.trim();
    const format = document.getElementById('tournament-format').value;
    const groupMethod = document.getElementById('group-method').value;
    const playersText = document.getElementById('players-input').value.trim();
    
    if (!name) {
        alert('请输入比赛名称');
        return;
    }
    
    const players = playersText.split('\n')
        .map(p => p.trim())
        .filter(p => p.length > 0);
    
    if (players.length < 2) {
        alert('至少需要2名参赛选手');
        return;
    }
    
    const scoringMethod = document.getElementById('scoring-method').value;
    
    const tournament = {
        id: Date.now().toString(),
        name,
        format,
        scoringMethod,
        groupMethod,
        players,
        groups: {},
        matches: {},
        standings: {},
        knockoutMatches: [],
        createdAt: new Date().toISOString(),
        createdBy: appState.currentUser ? appState.currentUser.id : null
    };
    
    appState.tournaments.push(tournament);
    saveToStorage();
    renderTournaments();
    showSection('tournaments');
}

// 渲染比赛列表
function renderTournaments() {
    const container = document.getElementById('tournaments-list');
    
    if (appState.tournaments.length === 0) {
        container.innerHTML = '<div class="empty-state">暂无比赛，点击"创建新比赛"开始</div>';
        return;
    }
    
    container.innerHTML = appState.tournaments.map(tournament => {
        const formatInfo = formatConfigs[tournament.format];
        const status = getTournamentStatus(tournament);
        
        return `
            <div class="tournament-card" onclick="openTournament('${tournament.id}')">
                <h3>${tournament.name}</h3>
                <div class="tournament-meta">
                    <span class="meta-item">📋 ${formatInfo.name}</span>
                    <span class="meta-item">👥 ${tournament.players.length}人</span>
                    <span class="meta-item">📅 ${new Date(tournament.createdAt).toLocaleDateString()}</span>
                </div>
                <div class="tournament-status ${status.class}">${status.text}</div>
            </div>
        `;
    }).join('');
}

// 获取比赛状态
function getTournamentStatus(tournament) {
    if (!tournament.groups || Object.keys(tournament.groups).length === 0) {
        return { text: '未分组', class: 'status-pending' };
    }
    
    const allMatchesCompleted = Object.values(tournament.matches).every(groupMatches => 
        groupMatches.every(m => m.completed)
    );
    
    if (allMatchesCompleted && tournament.knockoutMatches && tournament.knockoutMatches.length > 0) {
        const knockoutCompleted = tournament.knockoutMatches.every(m => m.completed);
        if (knockoutCompleted) {
            return { text: '已完成', class: 'status-completed' };
        }
        return { text: '淘汰赛进行中', class: 'status-knockout' };
    }
    
    if (allMatchesCompleted) {
        return { text: '小组赛已完成', class: 'status-group-completed' };
    }
    
    return { text: '小组赛进行中', class: 'status-group' };
}

// 打开比赛详情
function openTournament(tournamentId) {
    appState.currentTournamentId = tournamentId;
    const tournament = appState.tournaments.find(t => t.id === tournamentId);
    if (!tournament) return;
    
    document.getElementById('tournament-detail-title').textContent = tournament.name;
    
    const formatInfo = formatConfigs[tournament.format];
    const scoringText = tournament.scoringMethod === 'no-ad' ? '金球制' : '占先制';
    document.getElementById('tournament-info').innerHTML = `
        <div class="info-item">赛制：${formatInfo.description}</div>
        <div class="info-item">计分方式：${scoringText}</div>
        <div class="info-item">参赛人数：${tournament.players.length}人</div>
        <div class="info-item">分组方式：${getGroupMethodName(tournament.groupMethod)}</div>
    `;
    
    renderTournamentDetail(tournament);
    showSection('detail');
}

// 获取分组方式名称
function getGroupMethodName(method) {
    const names = {
        '2-groups': '2组（每组前2名出线）',
        '4-groups': '4组（每组第1名出线）',
        'no-groups': '无分组（直接淘汰赛）'
    };
    return names[method] || method;
}

// 渲染比赛详情
function renderTournamentDetail(tournament) {
    // 渲染选手列表
    const playersContainer = document.getElementById('players-container');
    playersContainer.innerHTML = '';
    tournament.players.forEach((player, index) => {
        const card = document.createElement('div');
        card.className = 'player-card';
        card.textContent = `${index + 1}. ${player}`;
        playersContainer.appendChild(card);
    });
    
    // 如果已分组，显示分组结果和比赛
    if (tournament.groups && Object.keys(tournament.groups).length > 0) {
        renderGroups(tournament);
        renderMatches(tournament);
        renderStandings(tournament);
        renderKnockout(tournament);
        
        document.getElementById('grouping-section').style.display = 'none';
        document.getElementById('group-stage-section').style.display = 'block';
        
        if (tournament.knockoutMatches && tournament.knockoutMatches.length > 0) {
            document.getElementById('knockout-section').style.display = 'block';
        }
    } else {
        document.getElementById('grouping-section').style.display = 'block';
        document.getElementById('group-stage-section').style.display = 'none';
        document.getElementById('knockout-section').style.display = 'none';
        
        // 绑定抽签按钮
        const drawBtn = document.getElementById('draw-btn');
        drawBtn.onclick = () => drawGroups(tournament);
    }
}

// 抽签分组
function drawGroups(tournament) {
    const players = [...tournament.players];
    const shuffled = players.sort(() => Math.random() - 0.5);
    
    if (tournament.groupMethod === '2-groups') {
        // 2组，每组前2名出线
        const groupSize = Math.ceil(shuffled.length / 2);
        tournament.groups = {
            A: shuffled.slice(0, groupSize),
            B: shuffled.slice(groupSize)
        };
    } else if (tournament.groupMethod === '4-groups') {
        // 4组，每组第1名出线
        const groupSize = Math.ceil(shuffled.length / 4);
        tournament.groups = {
            A: shuffled.slice(0, groupSize),
            B: shuffled.slice(groupSize, groupSize * 2),
            C: shuffled.slice(groupSize * 2, groupSize * 3),
            D: shuffled.slice(groupSize * 3)
        };
    } else {
        // 无分组，直接淘汰赛
        tournament.groups = {};
    }
    
    generateGroupMatches(tournament);
    initializeStandings(tournament);
    
    saveToStorage();
    renderTournamentDetail(tournament);
}

// 生成小组循环赛对阵
function generateGroupMatches(tournament) {
    tournament.matches = {};
    
    Object.keys(tournament.groups).forEach(groupName => {
        const group = tournament.groups[groupName];
        tournament.matches[groupName] = generateRoundRobin(group, groupName);
    });
}

// 生成循环赛对阵表
function generateRoundRobin(group, groupName) {
    const matches = [];
    const n = group.length;
    
    for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
            matches.push({
                id: `${groupName}-${i}-${j}`,
                group: groupName,
                player1: group[i],
                player2: group[j],
                sets: [],
                completed: false,
                recordedBy: null,
                recordedAt: null
            });
        }
    }
    
    return matches;
}

// 初始化积分榜
function initializeStandings(tournament) {
    tournament.standings = {};
    
    Object.keys(tournament.groups).forEach(groupName => {
        const group = tournament.groups[groupName];
        tournament.standings[groupName] = group.map(player => ({
            player,
            matches: 0,
            wins: 0,
            losses: 0,
            setsWon: 0,
            setsLost: 0,
            gamesWon: 0,
            gamesLost: 0,
            points: 0
        }));
    });
}

// 渲染分组结果
function renderGroups(tournament) {
    const container = document.getElementById('groups-result');
    
    if (!tournament.groups || Object.keys(tournament.groups).length === 0) {
        container.innerHTML = '';
        return;
    }
    
    container.innerHTML = Object.keys(tournament.groups).map(groupName => `
        <div class="group-box">
            <h3 class="group-title">${groupName}组</h3>
            <div class="group-members">
                ${tournament.groups[groupName].map((p, i) => 
                    `<div class="member-item">${i + 1}. ${p}</div>`
                ).join('')}
            </div>
        </div>
    `).join('');
}

// 渲染比赛
function renderMatches(tournament) {
    const container = document.getElementById('groups-matches-container');
    
    if (!tournament.matches || Object.keys(tournament.matches).length === 0) {
        container.innerHTML = '';
        return;
    }
    
    container.innerHTML = Object.keys(tournament.matches).map(groupName => {
        const matches = tournament.matches[groupName];
        const standings = tournament.standings && tournament.standings[groupName] ? tournament.standings[groupName] : [];
        
        return `
            <div class="group-box">
                <h3 class="group-title">${groupName}组</h3>
                <div class="matches-container">
                    ${matches.map(match => {
                        const scoreDisplay = match.completed 
                            ? formatMatchScore(match, tournament.format)
                            : '<span class="match-score">-</span>';
                        
                        return `
                            <div class="match-card ${match.completed ? 'completed' : ''}">
                                <div class="match-players">
                                    <span>${match.player1}</span>
                                    ${scoreDisplay}
                                    <span>${match.player2}</span>
                                </div>
                                <button class="btn-score" onclick="openScoreModal('${match.id}', '${tournament.id}')">
                                    ${match.completed ? '修改' : '录入'}
                                </button>
                            </div>
                        `;
                    }).join('')}
                </div>
                ${standings.length > 0 ? renderGroupStandings(standings, tournament) : ''}
            </div>
        `;
    }).join('');
}

// 格式化比赛比分显示
function formatMatchScore(match, format) {
    if (!match.sets || match.sets.length === 0) {
        return '<span class="match-score">-</span>';
    }
    
    if (format === 'short-set') {
        const set = match.sets[0];
        if (set.tiebreak) {
            return `<span class="match-score">${set.score1}(${set.tiebreak1})-${set.score2}(${set.tiebreak2})</span>`;
        }
        return `<span class="match-score">${set.score1}-${set.score2}</span>`;
    } else {
        // 多盘制显示
        const setsDisplay = match.sets.map(set => {
            if (set.tiebreak) {
                return `${set.score1}(${set.tiebreak1})-${set.score2}(${set.tiebreak2})`;
            }
            return `${set.score1}-${set.score2}`;
        }).join(' ');
        return `<span class="match-score">${setsDisplay}</span>`;
    }
}

// 渲染小组积分榜
function renderGroupStandings(standings, tournament) {
    const sorted = [...standings].sort((a, b) => {
        // 先按积分
        if (b.points !== a.points) return b.points - a.points;
        // 再按胜负关系
        const headToHead = compareHeadToHead(a.player, b.player, standings, tournament);
        if (headToHead !== 0) return headToHead;
        // 再按净胜盘
        const setDiffA = a.setsWon - a.setsLost;
        const setDiffB = b.setsWon - b.setsLost;
        if (setDiffB !== setDiffA) return setDiffB - setDiffA;
        // 最后按净胜局
        return (b.gamesWon - b.gamesLost) - (a.gamesWon - a.gamesLost);
    });
    
    return `
        <div class="standings-container">
            <div class="standings-title">积分榜</div>
            <table class="standings-table">
                <thead>
                    <tr>
                        <th>排名</th>
                        <th>选手</th>
                        <th>胜</th>
                        <th>负</th>
                        <th>净胜盘</th>
                        <th>净胜局</th>
                        <th>积分</th>
                    </tr>
                </thead>
                <tbody>
                    ${sorted.map((s, index) => {
                        const rank = index + 1;
                        const rankClass = rank <= 2 ? `rank-${rank}` : '';
                        return `
                            <tr>
                                <td><span class="rank-badge ${rankClass}">${rank}</span></td>
                                <td>${s.player}</td>
                                <td>${s.wins}</td>
                                <td>${s.losses}</td>
                                <td>${s.setsWon - s.setsLost}</td>
                                <td>${s.gamesWon - s.gamesLost}</td>
                                <td><strong>${s.points}</strong></td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        </div>
    `;
}

// 比较胜负关系
function compareHeadToHead(player1, player2, standings, tournament) {
    // 查找两人之间的直接对战记录
    if (!tournament || !tournament.matches) return 0;
    
    // 遍历所有小组的比赛
    for (const groupName of Object.keys(tournament.matches)) {
        const match = tournament.matches[groupName].find(m => 
            m.completed && 
            ((m.player1 === player1 && m.player2 === player2) || 
             (m.player1 === player2 && m.player2 === player1))
        );
        
        if (match) {
            // 计算两人之间的胜负
            let player1SetsWon = 0;
            let player2SetsWon = 0;
            
            match.sets.forEach(set => {
                const setWinner = getSetWinner(set, tournament.format);
                if (match.player1 === player1) {
                    if (setWinner === 1) player1SetsWon++;
                    if (setWinner === 2) player2SetsWon++;
                } else {
                    if (setWinner === 1) player2SetsWon++;
                    if (setWinner === 2) player1SetsWon++;
                }
            });
            
            // 返回胜负关系（player1胜返回-1，player2胜返回1）
            if (player1SetsWon > player2SetsWon) return -1;
            if (player2SetsWon > player1SetsWon) return 1;
            return 0;
        }
    }
    
    return 0;
}

// 渲染积分榜（独立函数）
function renderStandings(tournament) {
    // 已在renderMatches中渲染
}

// 当前逐分录入状态
let pointInputState = {
    currentSet: 0,
    currentGame: { player1: 0, player2: 0 }, // 0, 15, 30, 40, 'AD'
    sets: [], // [{games: {player1: 4, player2: 2}, tiebreak: null}]
    servingPlayer: 1, // 1 or 2
    pointHistory: [],
    isTiebreak: false,
    tiebreakScore: { player1: 0, player2: 0 }
};

// 打开比分录入弹窗 - 逐分录入系统
function openScoreModal(matchId, tournamentId) {
    if (!appState.currentUser) {
        alert('请先登录');
        showLoginModal();
        return;
    }
    
    const tournament = appState.tournaments.find(t => t.id === tournamentId);
    if (!tournament) return;
    
    const match = findMatch(matchId, tournament);
    if (!match) return;
    
    appState.currentMatch = { match, tournament };
    
    // 初始化逐分录入状态
    initializePointInput(match, tournament);
    
    // 显示弹窗
    document.getElementById('score-modal').style.display = 'block';
    
    // 更新显示
    updatePointDisplay();
}

// 初始化逐分录入状态
function initializePointInput(match, tournament) {
    const formatInfo = formatConfigs[tournament.format];
    
    // 如果有已保存的比分，加载它
    if (match.sets && match.sets.length > 0) {
        pointInputState.sets = match.sets.map(set => ({
            games: { player1: set.score1 || 0, player2: set.score2 || 0 },
            tiebreak: set.tiebreak ? { player1: set.tiebreak1, player2: set.tiebreak2 } : null
        }));
        pointInputState.currentSet = match.sets.length;
        // 如果比赛已完成，从最后一盘开始
        if (match.completed) {
            pointInputState.currentSet = match.sets.length - 1;
        }
    } else {
        pointInputState.sets = [];
        pointInputState.currentSet = 0;
    }
    
    // 初始化当前局
    pointInputState.currentGame = { player1: 0, player2: 0 };
    pointInputState.servingPlayer = 1;
    pointInputState.isTiebreak = false;
    pointInputState.tiebreakScore = { player1: 0, player2: 0 };
    pointInputState.pointHistory = [];
    
    // 检查当前盘是否需要抢七
    if (pointInputState.sets[pointInputState.currentSet]) {
        const currentSet = pointInputState.sets[pointInputState.currentSet];
        const p1Games = currentSet.games.player1;
        const p2Games = currentSet.games.player2;
        if (p1Games === formatInfo.tiebreakAt && p2Games === formatInfo.tiebreakAt && !currentSet.tiebreak) {
            pointInputState.isTiebreak = true;
        }
    }
    
    // 设置选手名称
    document.getElementById('player1-current-name').textContent = match.player1;
    document.getElementById('player2-current-name').textContent = match.player2;
    document.getElementById('player1-point-label').textContent = match.player1 + '得分';
    document.getElementById('player2-point-label').textContent = match.player2 + '得分';
    
    let matchInfo = `${match.player1} VS ${match.player2}`;
    if (match.recordedBy) {
        const recorder = usersData.users.find(u => u.id === match.recordedBy);
        if (recorder) {
            matchInfo += ` (录入：${recorder.username})`;
        }
    }
    document.getElementById('modal-match-info').textContent = matchInfo;
}

// 生成比分输入界面
function generateScoreInput(formatInfo, match, tournament) {
    const container = document.getElementById('score-input-area');
    
    if (formatInfo.setsToWin === 1) {
        // 单盘制
        container.innerHTML = `
            <div class="score-input-container">
                <div class="player-score">
                    <label>${match.player1}</label>
                    <input type="number" id="player1-score" min="0" max="${formatInfo.gamesToWin + 1}" value="${match.sets[0]?.score1 || 0}">
                </div>
                <div class="vs-divider">VS</div>
                <div class="player-score">
                    <label>${match.player2}</label>
                    <input type="number" id="player2-score" min="0" max="${formatInfo.gamesToWin + 1}" value="${match.sets[0]?.score2 || 0}">
                </div>
            </div>
            <div class="tiebreak-container" id="tiebreak-container" style="display: none;">
                <label>抢七比分：</label>
                <input type="number" id="player1-tiebreak" min="0" value="${match.sets[0]?.tiebreak1 || 0}" placeholder="${match.player1}">
                <span> - </span>
                <input type="number" id="player2-tiebreak" min="0" value="${match.sets[0]?.tiebreak2 || 0}" placeholder="${match.player2}">
            </div>
        `;
        
        // 添加事件监听
        const score1Input = document.getElementById('player1-score');
        const score2Input = document.getElementById('player2-score');
        score1Input.addEventListener('input', () => checkTiebreak(formatInfo));
        score2Input.addEventListener('input', () => checkTiebreak(formatInfo));
        
        // 初始检查
        checkTiebreak(formatInfo);
    } else {
        // 多盘制
        const setsToPlay = formatInfo.setsToWin * 2 - 1; // 最多盘数
        const existingSets = match.sets || [];
        container.innerHTML = `
            <div class="sets-input-container">
                ${Array.from({ length: setsToPlay }, (_, i) => {
                    const set = existingSets[i] || { score1: 0, score2: 0, tiebreak1: 0, tiebreak2: 0 };
                    return `
                        <div class="set-input">
                            <div class="set-label">第${i + 1}盘</div>
                            <div class="score-input-container">
                                <input type="number" class="set-score" id="set${i}-score1" min="0" max="${formatInfo.gamesToWin + 1}" value="${set.score1 || 0}">
                                <span class="vs-divider">-</span>
                                <input type="number" class="set-score" id="set${i}-score2" min="0" max="${formatInfo.gamesToWin + 1}" value="${set.score2 || 0}">
                            </div>
                            <div class="tiebreak-input" id="set${i}-tiebreak" style="display: none;">
                                <label>抢七：</label>
                                <input type="number" id="set${i}-tiebreak1" min="0" value="${set.tiebreak1 || 0}">
                                <span>-</span>
                                <input type="number" id="set${i}-tiebreak2" min="0" value="${set.tiebreak2 || 0}">
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
        
        // 为每盘添加事件监听
        setTimeout(() => {
            for (let i = 0; i < setsToPlay; i++) {
                const score1Input = document.getElementById(`set${i}-score1`);
                const score2Input = document.getElementById(`set${i}-score2`);
                if (score1Input && score2Input) {
                    score1Input.addEventListener('input', () => checkSetTiebreak(i, formatInfo));
                    score2Input.addEventListener('input', () => checkSetTiebreak(i, formatInfo));
                    checkSetTiebreak(i, formatInfo);
                }
            }
        }, 100);
    }
}

// 检查是否需要抢七（单盘制）
function checkTiebreak(formatInfo) {
    const score1 = parseInt(document.getElementById('player1-score').value) || 0;
    const score2 = parseInt(document.getElementById('player2-score').value) || 0;
    const tiebreakContainer = document.getElementById('tiebreak-container');
    
    if (score1 === formatInfo.tiebreakAt && score2 === formatInfo.tiebreakAt) {
        tiebreakContainer.style.display = 'block';
    } else {
        tiebreakContainer.style.display = 'none';
        document.getElementById('player1-tiebreak').value = 0;
        document.getElementById('player2-tiebreak').value = 0;
    }
}

// 检查是否需要抢七（多盘制）
function checkSetTiebreak(setIndex, formatInfo) {
    const score1 = parseInt(document.getElementById(`set${setIndex}-score1`).value) || 0;
    const score2 = parseInt(document.getElementById(`set${setIndex}-score2`).value) || 0;
    const tiebreakContainer = document.getElementById(`set${setIndex}-tiebreak`);
    
    if (score1 === formatInfo.tiebreakAt && score2 === formatInfo.tiebreakAt) {
        tiebreakContainer.style.display = 'block';
    } else {
        tiebreakContainer.style.display = 'none';
        document.getElementById(`set${setIndex}-tiebreak1`).value = 0;
        document.getElementById(`set${setIndex}-tiebreak2`).value = 0;
    }
}

// 保存比分
function saveScore() {
    const { match, tournament } = appState.currentMatch;
    if (!match || !tournament) return;
    
    const formatInfo = formatConfigs[tournament.format];
    const wasCompleted = match.completed;
    
    if (formatInfo.setsToWin === 1) {
        // 单盘制
        const score1 = parseInt(document.getElementById('player1-score').value);
        const score2 = parseInt(document.getElementById('player2-score').value);
        const tiebreak1 = parseInt(document.getElementById('player1-tiebreak').value) || 0;
        const tiebreak2 = parseInt(document.getElementById('player2-tiebreak').value) || 0;
        
        if (!validateScore(score1, score2, tiebreak1, tiebreak2, formatInfo)) {
            alert('比分无效！请检查规则');
            return;
        }
        
        match.sets = [{
            score1,
            score2,
            tiebreak: score1 === formatInfo.tiebreakAt && score2 === formatInfo.tiebreakAt,
            tiebreak1: score1 === formatInfo.tiebreakAt && score2 === formatInfo.tiebreakAt ? tiebreak1 : null,
            tiebreak2: score1 === formatInfo.tiebreakAt && score2 === formatInfo.tiebreakAt ? tiebreak2 : null
        }];
    } else {
        // 多盘制
        const sets = [];
        let player1SetsWon = 0;
        let player2SetsWon = 0;
        
        for (let i = 0; i < formatInfo.setsToWin * 2 - 1; i++) {
            const score1Input = document.getElementById(`set${i}-score1`);
            const score2Input = document.getElementById(`set${i}-score2`);
            
            if (!score1Input || !score2Input) break;
            
            const score1 = parseInt(score1Input.value) || 0;
            const score2 = parseInt(score2Input.value) || 0;
            
            // 如果双方都是0，说明这盘没打
            if (score1 === 0 && score2 === 0) {
                // 如果已经有足够的盘数，可以停止
                if (player1SetsWon >= formatInfo.setsToWin || player2SetsWon >= formatInfo.setsToWin) {
                    break;
                }
                continue;
            }
            
            const tiebreak1Input = document.getElementById(`set${i}-tiebreak1`);
            const tiebreak2Input = document.getElementById(`set${i}-tiebreak2`);
            const tiebreak1 = tiebreak1Input ? (parseInt(tiebreak1Input.value) || 0) : 0;
            const tiebreak2 = tiebreak2Input ? (parseInt(tiebreak2Input.value) || 0) : 0;
            
            if (!validateScore(score1, score2, tiebreak1, tiebreak2, formatInfo)) {
                alert(`第${i + 1}盘比分无效！请检查规则`);
                return;
            }
            
            const set = {
                score1,
                score2,
                tiebreak: score1 === formatInfo.tiebreakAt && score2 === formatInfo.tiebreakAt,
                tiebreak1: score1 === formatInfo.tiebreakAt && score2 === formatInfo.tiebreakAt ? tiebreak1 : null,
                tiebreak2: score1 === formatInfo.tiebreakAt && score2 === formatInfo.tiebreakAt ? tiebreak2 : null
            };
            
            sets.push(set);
            
            // 判断这盘的胜负
            let setWinner = null;
            if (score1 === formatInfo.gamesToWin + 1) {
                setWinner = 1;
            } else if (score2 === formatInfo.gamesToWin + 1) {
                setWinner = 2;
            } else if (score1 === formatInfo.gamesToWin && score2 < formatInfo.gamesToWin - 1) {
                setWinner = 1;
            } else if (score2 === formatInfo.gamesToWin && score1 < formatInfo.gamesToWin - 1) {
                setWinner = 2;
            } else if (set.tiebreak) {
                setWinner = tiebreak1 > tiebreak2 ? 1 : 2;
            }
            
            if (setWinner === 1) player1SetsWon++;
            if (setWinner === 2) player2SetsWon++;
            
            // 如果已经有人达到获胜盘数，停止
            if (player1SetsWon >= formatInfo.setsToWin || player2SetsWon >= formatInfo.setsToWin) {
                break;
            }
        }
        
        if (sets.length === 0) {
            alert('请至少录入一盘的比分');
            return;
        }
        
        if (player1SetsWon < formatInfo.setsToWin && player2SetsWon < formatInfo.setsToWin) {
            alert('比赛尚未结束，请继续录入比分');
            return;
        }
        
        match.sets = sets;
    }
    
    match.completed = true;
    match.recordedBy = appState.currentUser ? appState.currentUser.id : null;
    match.recordedAt = new Date().toISOString();
    
    // 更新积分榜
    updateStandings(match, tournament, wasCompleted);
    
    // 保存
    saveToStorage();
    
    // 重新渲染
    renderTournamentDetail(tournament);
    
    // 检查是否可以进入淘汰赛
    checkKnockoutQualification(tournament);
    
    closeModal();
}

// 验证比分
function validateScore(score1, score2, tiebreak1, tiebreak2, formatInfo) {
    // 检查是否有人先胜足够局数
    if (score1 === formatInfo.gamesToWin + 1 && score2 < formatInfo.gamesToWin) return true;
    if (score2 === formatInfo.gamesToWin + 1 && score1 < formatInfo.gamesToWin) return true;
    if (score1 === formatInfo.gamesToWin && score2 <= formatInfo.gamesToWin - 2) return true;
    if (score2 === formatInfo.gamesToWin && score1 <= formatInfo.gamesToWin - 2) return true;
    
    // 检查抢七
    if (score1 === formatInfo.tiebreakAt && score2 === formatInfo.tiebreakAt) {
        if (tiebreak1 === 0 && tiebreak2 === 0) return false;
        const diff = Math.abs(tiebreak1 - tiebreak2);
        const max = Math.max(tiebreak1, tiebreak2);
        return max >= 7 && diff >= 2;
    }
    
    return false;
}

// 更新积分榜
function updateStandings(match, tournament, wasCompleted) {
    if (!match.group) return; // 淘汰赛不更新积分榜
    
    const group = tournament.standings[match.group];
    if (!group) return;
    
    // 如果之前已完成，先撤销
    if (wasCompleted && match.sets) {
        const oldSets = match.sets;
        const player1Standing = group.find(s => s.player === match.player1);
        const player2Standing = group.find(s => s.player === match.player2);
        
        // 撤销比赛记录
        player1Standing.matches--;
        player2Standing.matches--;
        
        // 计算旧的胜负和局数
        let oldPlayer1SetsWon = 0;
        let oldPlayer2SetsWon = 0;
        let oldPlayer1GamesWon = 0;
        let oldPlayer2GamesWon = 0;
        
        oldSets.forEach(set => {
            const setWinner = getSetWinner(set, tournament.format);
            if (setWinner === 1) oldPlayer1SetsWon++;
            if (setWinner === 2) oldPlayer2SetsWon++;
            oldPlayer1GamesWon += set.score1;
            oldPlayer2GamesWon += set.score2;
        });
        
        if (oldPlayer1SetsWon > oldPlayer2SetsWon) {
            player1Standing.wins--;
            player2Standing.losses--;
            player1Standing.points -= 2;
        } else {
            player2Standing.wins--;
            player1Standing.losses--;
            player2Standing.points -= 2;
        }
        
        player1Standing.setsWon -= oldPlayer1SetsWon;
        player1Standing.setsLost -= oldPlayer2SetsWon;
        player2Standing.setsWon -= oldPlayer2SetsWon;
        player2Standing.setsLost -= oldPlayer1SetsWon;
        player1Standing.gamesWon -= oldPlayer1GamesWon;
        player1Standing.gamesLost -= oldPlayer2GamesWon;
        player2Standing.gamesWon -= oldPlayer2GamesWon;
        player2Standing.gamesLost -= oldPlayer1GamesWon;
    }
    
    // 添加新的比赛记录
    const player1Standing = group.find(s => s.player === match.player1);
    const player2Standing = group.find(s => s.player === match.player2);
    
    player1Standing.matches++;
    player2Standing.matches++;
    
    // 计算新的胜负和局数
    let player1SetsWon = 0;
    let player2SetsWon = 0;
    let player1GamesWon = 0;
    let player2GamesWon = 0;
    
    match.sets.forEach(set => {
        const setWinner = getSetWinner(set, tournament.format);
        if (setWinner === 1) player1SetsWon++;
        if (setWinner === 2) player2SetsWon++;
        player1GamesWon += set.score1;
        player2GamesWon += set.score2;
    });
    
    if (player1SetsWon > player2SetsWon) {
        player1Standing.wins++;
        player2Standing.losses++;
        player1Standing.points += 2;
    } else {
        player2Standing.wins++;
        player1Standing.losses++;
        player2Standing.points += 2;
    }
    
    player1Standing.setsWon += player1SetsWon;
    player1Standing.setsLost += player2SetsWon;
    player2Standing.setsWon += player2SetsWon;
    player2Standing.setsLost += player1SetsWon;
    player1Standing.gamesWon += player1GamesWon;
    player1Standing.gamesLost += player2GamesWon;
    player2Standing.gamesWon += player2GamesWon;
    player2Standing.gamesLost += player1GamesWon;
}

// 获取一盘比赛的胜者
function getSetWinner(set, format) {
    const formatInfo = formatConfigs[format];
    
    if (set.score1 === formatInfo.gamesToWin + 1) return 1;
    if (set.score2 === formatInfo.gamesToWin + 1) return 2;
    if (set.score1 === formatInfo.gamesToWin && set.score2 <= formatInfo.gamesToWin - 2) return 1;
    if (set.score2 === formatInfo.gamesToWin && set.score1 <= formatInfo.gamesToWin - 2) return 2;
    if (set.tiebreak) {
        return set.tiebreak1 > set.tiebreak2 ? 1 : 2;
    }
    
    return null;
}

// 查找比赛
function findMatch(matchId, tournament) {
    // 查找小组赛
    if (tournament.matches) {
        for (const groupName of Object.keys(tournament.matches)) {
            const match = tournament.matches[groupName].find(m => m.id === matchId);
            if (match) return match;
        }
    }
    
    // 查找淘汰赛
    if (tournament.knockoutMatches) {
        const match = tournament.knockoutMatches.find(m => m.id === matchId);
        if (match) return match;
    }
    
    return null;
}

// 检查淘汰赛资格
function checkKnockoutQualification(tournament) {
    if (tournament.groupMethod === 'no-groups') return;
    
    // 检查所有小组赛是否完成
    const allMatchesCompleted = Object.values(tournament.matches).every(groupMatches => 
        groupMatches.every(m => m.completed)
    );
    
    if (!allMatchesCompleted) return;
    
    // 生成淘汰赛对阵
    if (tournament.groupMethod === '2-groups') {
        const qualifiers = {
            A: getTopTwo('A', tournament),
            B: getTopTwo('B', tournament)
        };
        
        if (qualifiers.A.length === 2 && qualifiers.B.length === 2) {
            tournament.knockoutMatches = [
                {
                    id: 'sf1',
                    player1: qualifiers.A[0],
                    player2: qualifiers.B[1],
                    sets: [],
                    completed: false,
                    round: '半决赛'
                },
                {
                    id: 'sf2',
                    player1: qualifiers.B[0],
                    player2: qualifiers.A[1],
                    sets: [],
                    completed: false,
                    round: '半决赛'
                }
            ];
        }
    } else if (tournament.groupMethod === '4-groups') {
        const qualifiers = {
            A: getTopOne('A', tournament),
            B: getTopOne('B', tournament),
            C: getTopOne('C', tournament),
            D: getTopOne('D', tournament)
        };
        
        if (qualifiers.A && qualifiers.B && qualifiers.C && qualifiers.D) {
            tournament.knockoutMatches = [
                {
                    id: 'sf1',
                    player1: qualifiers.A,
                    player2: qualifiers.B,
                    sets: [],
                    completed: false,
                    round: '半决赛'
                },
                {
                    id: 'sf2',
                    player1: qualifiers.C,
                    player2: qualifiers.D,
                    sets: [],
                    completed: false,
                    round: '半决赛'
                }
            ];
        }
    }
    
    saveToStorage();
    renderTournamentDetail(tournament);
}

// 获取小组前两名
function getTopTwo(groupName, tournament) {
    const standings = [...tournament.standings[groupName]];
    standings.sort((a, b) => {
        // 先按积分
        if (b.points !== a.points) return b.points - a.points;
        // 再按胜负关系
        const headToHead = compareHeadToHead(a.player, b.player, standings, tournament);
        if (headToHead !== 0) return headToHead;
        // 再按净胜盘
        const setDiffA = a.setsWon - a.setsLost;
        const setDiffB = b.setsWon - b.setsLost;
        if (setDiffB !== setDiffA) return setDiffB - setDiffA;
        // 最后按净胜局
        return (b.gamesWon - b.gamesLost) - (a.gamesWon - a.gamesLost);
    });
    return standings.slice(0, 2).map(s => s.player);
}

// 获取小组第一名
function getTopOne(groupName, tournament) {
    const standings = [...tournament.standings[groupName]];
    standings.sort((a, b) => {
        // 先按积分
        if (b.points !== a.points) return b.points - a.points;
        // 再按胜负关系
        const headToHead = compareHeadToHead(a.player, b.player, standings, tournament);
        if (headToHead !== 0) return headToHead;
        // 再按净胜盘
        const setDiffA = a.setsWon - a.setsLost;
        const setDiffB = b.setsWon - b.setsLost;
        if (setDiffB !== setDiffA) return setDiffB - setDiffA;
        // 最后按净胜局
        return (b.gamesWon - b.gamesLost) - (a.gamesWon - a.gamesLost);
    });
    return standings[0]?.player;
}

// 渲染淘汰赛
function renderKnockout(tournament) {
    const container = document.getElementById('knockout-bracket');
    
    if (!tournament.knockoutMatches || tournament.knockoutMatches.length === 0) {
        container.innerHTML = '';
        return;
    }
    
    container.innerHTML = tournament.knockoutMatches.map(match => {
        const scoreDisplay = match.completed 
            ? formatMatchScore(match, tournament.format)
            : '<span class="match-score">-</span>';
        
        return `
            <div class="knockout-match">
                <div>
                    <div class="match-info">${match.round}</div>
                    <div class="match-players">
                        <span>${match.player1}</span>
                        ${scoreDisplay}
                        <span>${match.player2}</span>
                    </div>
                </div>
                <button class="btn-score" onclick="openScoreModal('${match.id}', '${tournament.id}')">
                    ${match.completed ? '修改' : '录入'}
                </button>
            </div>
        `;
    }).join('');
}

// 关闭弹窗
function closeModal() {
    document.getElementById('score-modal').style.display = 'none';
    appState.currentMatch = null;
}

// 保存到本地存储
function saveToStorage() {
    try {
        localStorage.setItem('tennisTournaments', JSON.stringify(appState.tournaments));
    } catch (e) {
        console.error('保存失败:', e);
    }
}

// 从本地存储加载
function loadFromStorage() {
    try {
        const saved = localStorage.getItem('tennisTournaments');
        if (saved) {
            appState.tournaments = JSON.parse(saved);
        }
    } catch (e) {
        console.error('加载失败:', e);
    }
}

// ========== 逐分录入系统 ==========

// 更新比分显示
function updatePointDisplay() {
    const { match, tournament } = appState.currentMatch;
    if (!match || !tournament) return;
    
    const formatInfo = formatConfigs[tournament.format];
    
    // 更新盘分显示
    const setScoresDisplay = document.getElementById('set-scores-display');
    if (pointInputState.sets.length > 0) {
        setScoresDisplay.innerHTML = pointInputState.sets.map((set, index) => {
            const setNum = index + 1;
            let scoreText = `${set.games.player1}-${set.games.player2}`;
            if (set.tiebreak) {
                scoreText += `(${set.tiebreak.player1}-${set.tiebreak.player2})`;
            }
            const isCurrent = index === pointInputState.currentSet;
            return `<span class="set-score-item ${isCurrent ? 'current-set' : ''}">第${setNum}盘: ${scoreText}</span>`;
        }).join(' | ');
    } else {
        setScoresDisplay.innerHTML = '<span class="set-score-item current-set">第1盘: 0-0</span>';
    }
    
    // 更新局分显示
    if (pointInputState.isTiebreak) {
        document.getElementById('player1-game-score').textContent = pointInputState.tiebreakScore.player1;
        document.getElementById('player2-game-score').textContent = pointInputState.tiebreakScore.player2;
        document.getElementById('player1-game-score').parentElement.querySelector('.score-label')?.remove();
        document.getElementById('player2-game-score').parentElement.querySelector('.score-label')?.remove();
    } else {
        document.getElementById('player1-game-score').textContent = formatGameScore(pointInputState.currentGame.player1);
        document.getElementById('player2-game-score').textContent = formatGameScore(pointInputState.currentGame.player2);
    }
    
    // 更新发球指示
    document.getElementById('player1-serving').style.display = pointInputState.servingPlayer === 1 ? 'block' : 'none';
    document.getElementById('player2-serving').style.display = pointInputState.servingPlayer === 2 ? 'block' : 'none';
    
    // 更新操作历史
    updatePointHistory();
    
    // 检查是否需要显示完成按钮
    checkGameCompletion(formatInfo);
}

// 格式化局分显示
function formatGameScore(score) {
    if (score === 0) return '0';
    if (score === 1) return '15';
    if (score === 2) return '30';
    if (score === 3) return '40';
    if (score === 'AD') return 'AD';
    return score;
}

// 记录得分
function recordPoint(player, type) {
    const { match, tournament } = appState.currentMatch;
    if (!match || !tournament) return;
    
    const formatInfo = formatConfigs[tournament.format];
    const scoringMethod = tournament.scoringMethod || 'no-ad';
    
    // 播放声音
    playSound(type === 'ace' ? 'ace' : 'point');
    
    // 记录操作历史
    const playerName = player === 1 ? match.player1 : match.player2;
    const action = type === 'ace' ? 'ACE' : '得分';
    addPointHistory(`${playerName} ${action}`);
    
    if (pointInputState.isTiebreak) {
        // 抢七模式
        if (player === 1) {
            pointInputState.tiebreakScore.player1++;
        } else {
            pointInputState.tiebreakScore.player2++;
        }
        
        // 检查抢七是否结束（至少7分且领先2分）
        const p1 = pointInputState.tiebreakScore.player1;
        const p2 = pointInputState.tiebreakScore.player2;
        if ((p1 >= 7 || p2 >= 7) && Math.abs(p1 - p2) >= 2) {
            // 抢七结束，本盘结束
            finishSet(player === 1 ? 1 : 2, formatInfo);
        } else {
            // 切换发球（抢七每2分换发球）
            const totalPoints = p1 + p2;
            if (totalPoints > 0 && totalPoints % 2 === 0) {
                pointInputState.servingPlayer = pointInputState.servingPlayer === 1 ? 2 : 1;
            }
        }
    } else {
        // 正常局分模式
        const currentScore = pointInputState.currentGame;
        
        if (player === 1) {
            // 选手1得分
            if (currentScore.player1 === 3 && currentScore.player2 === 3) {
                // 40-40平分
                if (scoringMethod === 'no-ad') {
                    // 金球制：直接获胜
                    finishGame(1, formatInfo);
                } else {
                    // 占先制
                    if (currentScore.player1 === 'AD') {
                        finishGame(1, formatInfo);
                    } else {
                        pointInputState.currentGame.player1 = 'AD';
                    }
                }
            } else if (currentScore.player1 === 'AD') {
                finishGame(1, formatInfo);
            } else if (currentScore.player2 === 'AD') {
                // 对手占先，回到平分
                pointInputState.currentGame.player2 = 3;
            } else {
                pointInputState.currentGame.player1++;
                if (pointInputState.currentGame.player1 === 4) {
                    finishGame(1, formatInfo);
                }
            }
        } else {
            // 选手2得分
            if (currentScore.player1 === 3 && currentScore.player2 === 3) {
                // 40-40平分
                if (scoringMethod === 'no-ad') {
                    // 金球制：直接获胜
                    finishGame(2, formatInfo);
                } else {
                    // 占先制
                    if (currentScore.player2 === 'AD') {
                        finishGame(2, formatInfo);
                    } else {
                        pointInputState.currentGame.player2 = 'AD';
                    }
                }
            } else if (currentScore.player2 === 'AD') {
                finishGame(2, formatInfo);
            } else if (currentScore.player1 === 'AD') {
                // 对手占先，回到平分
                pointInputState.currentGame.player1 = 3;
            } else {
                pointInputState.currentGame.player2++;
                if (pointInputState.currentGame.player2 === 4) {
                    finishGame(2, formatInfo);
                }
            }
        }
    }
    
    updatePointDisplay();
}

// 记录特殊操作
function recordSpecial(type) {
    const { match, tournament } = appState.currentMatch;
    if (!match || !tournament) return;
    
    // 播放声音
    playSound(type);
    
    let actionText = '';
    switch(type) {
        case 'out':
            actionText = 'OUT（出界）';
            break;
        case 'fault':
            actionText = '发球失误';
            break;
        case 'doubleFault':
            actionText = '双误';
            // 双误意味着接发球方得分
            recordPoint(pointInputState.servingPlayer === 1 ? 2 : 1, 'normal');
            return;
        case 'let':
            actionText = '重发（Let）';
            break;
    }
    
    addPointHistory(actionText);
}

// 完成一局
function finishGame(winner, formatInfo) {
    const { match, tournament } = appState.currentMatch;
    
    // 确保当前盘存在
    if (!pointInputState.sets[pointInputState.currentSet]) {
        pointInputState.sets[pointInputState.currentSet] = {
            games: { player1: 0, player2: 0 },
            tiebreak: null
        };
    }
    
    const currentSet = pointInputState.sets[pointInputState.currentSet];
    
    // 增加获胜者的局数
    if (winner === 1) {
        currentSet.games.player1++;
    } else {
        currentSet.games.player2++;
    }
    
    addPointHistory(`${winner === 1 ? match.player1 : match.player2} 赢得本局`);
    
    // 重置局分
    pointInputState.currentGame = { player1: 0, player2: 0 };
    
    // 检查是否需要抢七
    const p1Games = currentSet.games.player1;
    const p2Games = currentSet.games.player2;
    
    if (p1Games === formatInfo.tiebreakAt && p2Games === formatInfo.tiebreakAt) {
        // 进入抢七
        pointInputState.isTiebreak = true;
        pointInputState.tiebreakScore = { player1: 0, player2: 0 };
        addPointHistory('进入抢七！');
        playSound('game');
    } else {
        // 检查是否本盘结束
        const gamesToWin = formatInfo.gamesToWin;
        if (p1Games >= gamesToWin && p1Games - p2Games >= 2) {
            finishSet(1, formatInfo);
        } else if (p2Games >= gamesToWin && p2Games - p1Games >= 2) {
            finishSet(2, formatInfo);
        } else {
            // 切换发球方
            pointInputState.servingPlayer = pointInputState.servingPlayer === 1 ? 2 : 1;
            playSound('game');
        }
    }
    
    updatePointDisplay();
}

// 完成一盘
function finishSet(winner, formatInfo) {
    const { match, tournament } = appState.currentMatch;
    const currentSet = pointInputState.sets[pointInputState.currentSet];
    
    // 保存抢七比分
    if (pointInputState.isTiebreak) {
        currentSet.tiebreak = {
            player1: pointInputState.tiebreakScore.player1,
            player2: pointInputState.tiebreakScore.player2
        };
    }
    
    addPointHistory(`第${pointInputState.currentSet + 1}盘结束！${winner === 1 ? match.player1 : match.player2}获胜`);
    
    // 检查是否比赛结束
    const setsWon = { player1: 0, player2: 0 };
    pointInputState.sets.forEach(set => {
        const p1Games = set.games.player1;
        const p2Games = set.games.player2;
        if (p1Games > p2Games || (p1Games === p2Games && set.tiebreak && set.tiebreak.player1 > set.tiebreak.player2)) {
            setsWon.player1++;
        } else if (p2Games > p1Games || (p1Games === p2Games && set.tiebreak && set.tiebreak.player2 > set.tiebreak.player1)) {
            setsWon.player2++;
        }
    });
    
    if (setsWon.player1 >= formatInfo.setsToWin || setsWon.player2 >= formatInfo.setsToWin) {
        // 比赛结束
        finishMatch();
    } else {
        // 开始下一盘
        pointInputState.currentSet++;
        pointInputState.currentGame = { player1: 0, player2: 0 };
        pointInputState.isTiebreak = false;
        pointInputState.tiebreakScore = { player1: 0, player2: 0 };
        // 切换发球方
        pointInputState.servingPlayer = pointInputState.servingPlayer === 1 ? 2 : 1;
    }
    
    playSound('set');
}

// 完成比赛
function finishMatch() {
    const { match, tournament } = appState.currentMatch;
    addPointHistory('比赛结束！');
    playSound('match');
    
    // 保存比分
    savePointScore();
    
    alert('比赛完成！');
    closeModal();
}

// 检查比赛完成状态
function checkGameCompletion(formatInfo) {
    // 这里可以添加逻辑来显示完成按钮
}

// 更新操作历史
function updatePointHistory() {
    const historyList = document.getElementById('point-history-list');
    if (!historyList) return;
    
    const recentHistory = pointInputState.pointHistory.slice(-10).reverse();
    historyList.innerHTML = recentHistory.map(item => 
        `<div class="history-item">${item}</div>`
    ).join('');
}

// 添加操作历史
function addPointHistory(action) {
    const time = new Date().toLocaleTimeString();
    pointInputState.pointHistory.push(`[${time}] ${action}`);
    if (pointInputState.pointHistory.length > 50) {
        pointInputState.pointHistory.shift();
    }
}

// 保存逐分录入的比分
function savePointScore() {
    const { match, tournament } = appState.currentMatch;
    if (!match || !tournament) return;
    
    // 转换格式
    match.sets = pointInputState.sets.map(set => ({
        score1: set.games.player1,
        score2: set.games.player2,
        tiebreak: set.tiebreak !== null,
        tiebreak1: set.tiebreak ? set.tiebreak.player1 : null,
        tiebreak2: set.tiebreak ? set.tiebreak.player2 : null
    }));
    
    match.completed = true;
    match.recordedBy = appState.currentUser ? appState.currentUser.id : null;
    match.recordedAt = new Date().toISOString();
    
    // 更新积分榜
    updateStandings(match, tournament, false);
    
    // 保存
    saveToStorage();
    
    // 重新渲染
    renderTournamentDetail(tournament);
    
    // 检查是否可以进入淘汰赛
    checkKnockoutQualification(tournament);
}

// 声音播放系统
function playSound(type) {
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        let frequency = 440;
        let duration = 0.1;
        
        switch(type) {
            case 'point':
                frequency = 600;
                duration = 0.1;
                break;
            case 'ace':
                frequency = 800;
                duration = 0.2;
                break;
            case 'out':
                frequency = 300;
                duration = 0.15;
                break;
            case 'fault':
                frequency = 350;
                duration = 0.1;
                break;
            case 'game':
                frequency = 500;
                duration = 0.3;
                break;
            case 'set':
                frequency = 600;
                duration = 0.5;
                break;
            case 'match':
                // 播放一个简单的胜利音效
                playTone(600, 0.2);
                setTimeout(() => playTone(700, 0.2), 100);
                setTimeout(() => playTone(800, 0.3), 200);
                return;
        }
        
        playTone(frequency, duration);
    } catch (e) {
        console.warn('声音播放失败:', e);
    }
}

function playTone(frequency, duration) {
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = frequency;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + duration);
    } catch (e) {
        console.warn('音调播放失败:', e);
    }
}

// 全局函数
window.openTournament = openTournament;
window.openScoreModal = openScoreModal;
window.recordPoint = recordPoint;
window.recordSpecial = recordSpecial;
