// Vercel Serverless Function - 健康检查
module.exports = async function handler(req, res) {
  return res.status(200).json({
    status: 'ok',
    message: '服务器运行正常（Vercel Serverless）'
  });
}
