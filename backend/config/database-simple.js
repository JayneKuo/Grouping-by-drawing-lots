// 简化版数据库配置（使用内存存储，适合开发测试）
// 如果不需要MySQL，可以使用这个版本

const bcrypt = require('bcryptjs');

const data = {
  users: [],
  tournaments: [],
  players: [],
  matches: [],
  sets: [],
  scores: [],
  operationLogs: []
};

// 模拟数据库操作
const db = {
  // 初始化默认账号
  async initDefaultUsers() {
    if (data.users.length === 0) {
      // 管理员账号
      const adminHash = await bcrypt.hash('admin123', 10);
      data.users.push({
        id: 1,
        username: 'admin',
        password: adminHash,
        role: 'admin',
        created_at: new Date()
      });
      
      // 用户1
      const user1Hash = await bcrypt.hash('user123', 10);
      data.users.push({
        id: 2,
        username: 'user1',
        password: user1Hash,
        role: 'user',
        created_at: new Date()
      });
      
      // 用户2
      const user2Hash = await bcrypt.hash('user123', 10);
      data.users.push({
        id: 3,
        username: 'user2',
        password: user2Hash,
        role: 'user',
        created_at: new Date()
      });
      
      // 用户3
      const user3Hash = await bcrypt.hash('user123', 10);
      data.users.push({
        id: 4,
        username: 'user3',
        password: user3Hash,
        role: 'user',
        created_at: new Date()
      });
      
      console.log('✅ 默认账号已初始化：');
      console.log('   管理员：admin / admin123');
      console.log('   用户1：user1 / user123');
      console.log('   用户2：user2 / user123');
      console.log('   用户3：user3 / user123');
    }
  },
  
  // 用户操作
  async findUser(username) {
    // 确保账号已初始化
    await this.initDefaultUsers();
    return data.users.find(u => u.username === username);
  },
  
  async createUser(user) {
    await this.initDefaultUsers();
    const newUser = {
      id: data.users.length + 1,
      ...user,
      created_at: new Date()
    };
    data.users.push(newUser);
    return newUser;
  },
  
  // 比赛操作
  async getTournaments() {
    return data.tournaments;
  },
  
  async getTournament(id) {
    return data.tournaments.find(t => t.id === parseInt(id));
  },
  
  async createTournament(tournament) {
    const newTournament = {
      id: data.tournaments.length + 1,
      ...tournament,
      created_at: new Date()
    };
    data.tournaments.push(newTournament);
    return newTournament;
  },
  
  async updateTournament(id, updates) {
    const index = data.tournaments.findIndex(t => t.id === parseInt(id));
    if (index !== -1) {
      data.tournaments[index] = { 
        ...data.tournaments[index], 
        ...updates,
        updated_at: new Date()
      };
      return data.tournaments[index];
    }
    return null;
  },
  
  // 选手操作
  async addPlayer(tournamentId, player) {
    const tournament = await this.getTournament(tournamentId);
    if (!tournament) return null;
    
    if (!tournament.players) {
      tournament.players = [];
    }
    
    const newPlayer = {
      id: Date.now().toString(),
      ...player,
      tournament_id: parseInt(tournamentId)
    };
    
    tournament.players.push(newPlayer);
    return newPlayer;
  },
  
  async getPlayers(tournamentId) {
    const tournament = await this.getTournament(tournamentId);
    return tournament?.players || [];
  },
  
  async deletePlayer(tournamentId, playerId) {
    const tournament = await this.getTournament(tournamentId);
    if (!tournament || !tournament.players) return false;
    
    tournament.players = tournament.players.filter(p => p.id !== playerId);
    return true;
  }
};

// 立即初始化默认账号
db.initDefaultUsers().catch(err => {
  console.error('初始化默认账号失败:', err);
});

module.exports = db;
