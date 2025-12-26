// 测试批量添加API
const axios = require('axios');

async function testBatchAdd() {
  try {
    console.log('测试批量添加API...');
    
    // 先创建一个测试比赛
    const createRes = await axios.post('http://localhost:3000/api/tournaments', {
      name: '测试比赛',
      format: 'short-set',
      scoringMethod: 'no-ad',
      groupMethod: '2-groups'
    });
    
    console.log('创建比赛:', createRes.data);
    
    if (!createRes.data.success) {
      console.error('创建比赛失败');
      return;
    }
    
    const tournamentId = createRes.data.data.id;
    console.log('比赛ID:', tournamentId);
    
    // 测试批量添加
    const batchRes = await axios.post(`http://localhost:3000/api/tournaments/${tournamentId}/players/batch`, {
      players: [
        { name: '张三', status: 'pending' },
        { name: '李四', status: 'pending' },
        { name: '王五', status: 'pending' }
      ]
    });
    
    console.log('批量添加结果:', batchRes.data);
  } catch (error) {
    if (error.response) {
      console.error('❌ 错误:', error.response.status, error.response.data);
    } else {
      console.error('❌ 网络错误:', error.message);
    }
  }
}

testBatchAdd();

