# 网球赛事管理系统 - 架构设计文档

## 一、系统整体架构

### 1.1 技术栈
- **前端框架**: 原生 JavaScript (ES6+)，模块化设计，便于后续迁移到Vue3
- **UI组件**: 自定义组件库，响应式设计
- **数据存储**: 
  - 前端: localStorage (加密缓存)
  - 后端: MySQL (未来扩展)
- **实时同步**: WebSocket / Server-Sent Events (未来扩展)，当前使用轮询+localStorage事件

### 1.2 系统模块划分

```
网球赛事管理系统
├── 操作端 (手机端)
│   ├── 登录模块 (auth.js)
│   ├── 缓存模块 (cache.js)
│   ├── 赛事管理模块 (tournament.js)
│   ├── 比分录入模块 (score.js)
│   └── 大屏控制模块 (display.js)
│
├── 大屏端 (display.html)
│   ├── 实时比分展示
│   ├── 场次切换
│   └── 样式自定义
│
└── 共享模块
    ├── 数据模型 (models.js)
    ├── 工具函数 (utils.js)
    └── 配置管理 (config.js)
```

## 二、数据模型设计

### 2.1 用户模型 (User)
```javascript
{
  id: string,
  username: string,
  password: string (加密),
  role: 'admin' | 'user',
  createdAt: timestamp
}
```

### 2.2 比赛模型 (Tournament)
```javascript
{
  id: string,
  name: string,
  format: 'short-set' | 'best-of-3' | 'best-of-5',
  scoringMethod: 'ad' | 'no-ad', // 占先/金球
  tiebreakRule: {
    enabled: boolean,
    pointsToWin: number, // 默认7
    minLead: number // 默认2
  },
  groupMethod: '2-groups' | '4-groups' | 'no-groups',
  status: 'draft' | 'registration' | 'group-stage' | 'knockout' | 'finished',
  rulesLocked: boolean, // 赛事开始后锁定
  createdAt: timestamp,
  createdBy: userId
}
```

### 2.3 选手模型 (Player)
```javascript
{
  id: string,
  tournamentId: string,
  name: string,
  status: 'pending' | 'approved' | 'rejected',
  stats: {
    aces: number,
    faults: number,
    doubleFaults: number
  }
}
```

### 2.4 分组模型 (Group)
```javascript
{
  id: string,
  tournamentId: string,
  name: string, // 'A', 'B', 'C', 'D'
  players: [playerId],
  matches: [matchId],
  standings: [standingId]
}
```

### 2.5 比赛场次模型 (Match)
```javascript
{
  id: string,
  tournamentId: string,
  groupId: string | null, // null表示淘汰赛
  round: 'group' | 'semi-final' | 'final',
  player1Id: string,
  player2Id: string,
  status: 'scheduled' | 'in-progress' | 'finished',
  sets: [{
    games: { player1: number, player2: number },
    tiebreak: { player1: number, player2: number } | null,
    pointHistory: [{
      player: 1 | 2,
      type: 'point' | 'ace' | 'fault' | 'double-fault' | 'out',
      timestamp: timestamp,
      recordedBy: userId
    }]
  }],
  currentGame: {
    player1: 0 | 15 | 30 | 40 | 'AD',
    player2: 0 | 15 | 30 | 40 | 'AD',
    serving: 1 | 2
  },
  isTiebreak: boolean,
  tiebreakScore: { player1: number, player2: number },
  recordedBy: userId,
  recordedAt: timestamp
}
```

### 2.6 积分榜模型 (Standing)
```javascript
{
  id: string,
  tournamentId: string,
  groupId: string,
  playerId: string,
  matches: number,
  wins: number,
  losses: number,
  setsWon: number,
  setsLost: number,
  gamesWon: number,
  gamesLost: number,
  aces: number,
  faults: number,
  points: number, // 积分
  tiebreakCriteria: {
    // 平分出线排序依据
    gamesDiff: number,
    headToHead: 'win' | 'loss' | null,
    acesDiff: number,
    pointsDiff: number
  }
}
```

### 2.7 操作日志模型 (OperationLog)
```javascript
{
  id: string,
  tournamentId: string,
  matchId: string,
  userId: string,
  action: string,
  data: object,
  timestamp: timestamp,
  canUndo: boolean
}
```

## 三、核心算法设计

### 3.1 平分出线排序算法
优先级顺序：
1. **积分** (points) - 胜场2分
2. **局数差** (gamesDiff = gamesWon - gamesLost)
3. **直胜** (headToHead) - 两人直接对战结果
4. **ACE数差** (acesDiff)
5. **净胜分** (pointsDiff)
6. **人工裁定** (manualDecision)

### 3.2 占先/金球计分逻辑

#### 占先制 (Advantage)
- 40-40后，需要领先2分才能获胜
- 40-40 → AD-40 → Game (获胜)
- 40-40 → 40-AD → 回到40-40

#### 金球制 (No-Ad)
- 40-40后，下一分直接决定胜负
- 40-40 → 下一分 → Game (获胜)

### 3.3 抢七计分逻辑
- 触发条件：局数达到6-6
- 规则：先到7分且领先2分
- 发球：第1分由先发球方发，之后每2分换发球

## 四、前后端交互流程

### 4.1 当前实现（纯前端）
- 所有数据存储在localStorage
- 使用localStorage事件实现多标签页同步
- 加密存储敏感数据

### 4.2 未来扩展（后端）
- WebSocket实时同步
- RESTful API数据交互
- MySQL持久化存储

## 五、缓存机制

### 5.1 加密存储
- 使用AES加密（简化版，实际应使用Web Crypto API）
- 存储未提交的比赛数据
- 支持离线操作

### 5.2 同步机制
- 检测网络状态
- 自动同步缓存数据
- 冲突检测和解决

## 六、大屏展示

### 6.1 独立页面
- 无登录入口
- 通过URL参数选择场次
- 实时同步比分（轮询localStorage）

### 6.2 展示内容
- 选手姓名
- 实时比分（盘分、局分、抢七分）
- 占先/金球状态
- ACE/失误统计
- 比赛状态

### 6.3 自定义样式
- 背景颜色/图片
- 字体大小/颜色
- 适配不同分辨率

