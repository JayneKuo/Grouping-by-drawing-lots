// 数据存储工具 - 可选择使用Vercel API或Firebase
// 设置 USE_VERCEL_API = true 使用Vercel API（国内访问快）
// 设置 USE_VERCEL_API = false 使用Firebase（需要VPN）

const USE_VERCEL_API = false // 改为true使用Vercel API（需要先部署Vercel API）

// 使用Firebase（默认）
export { storage, syncStatus } from './firebase'

// 如果要使用Vercel API，取消下面的注释并注释掉上面的行
// export { storage, syncStatus } from './vercel'
