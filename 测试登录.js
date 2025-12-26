// 测试登录API
const axios = require('axios');

async function testLogin() {
  try {
    console.log('测试登录API...');
    
    const response = await axios.post('http://localhost:3000/api/auth/login', {
      username: 'admin',
      password: 'admin123'
    });
    
    console.log('✅ 登录成功:', response.data);
  } catch (error) {
    if (error.response) {
      console.error('❌ 登录失败:', error.response.status, error.response.data);
    } else {
      console.error('❌ 网络错误:', error.message);
    }
  }
}

testLogin();

