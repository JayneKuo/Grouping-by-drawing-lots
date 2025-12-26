#!/bin/bash
# 阿里云服务器一键配置脚本
# 适用于Ubuntu/CentOS系统

echo "========================================"
echo "   阿里云服务器一键配置脚本"
echo "========================================"
echo ""

# 检查是否为root用户
if [ "$EUID" -ne 0 ]; then 
    echo "❌ 请使用root用户运行此脚本"
    echo "   使用命令: sudo bash 一键配置阿里云服务器.sh"
    exit 1
fi

echo "[1/6] 更新系统..."
apt update && apt upgrade -y || yum update -y

echo ""
echo "[2/6] 安装Node.js 18..."
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs || yum install -y nodejs

# 验证安装
NODE_VERSION=$(node -v)
NPM_VERSION=$(npm -v)
echo "✅ Node.js版本: $NODE_VERSION"
echo "✅ npm版本: $NPM_VERSION"

echo ""
echo "[3/6] 安装PM2..."
npm install -g pm2

echo ""
echo "[4/6] 安装Redis客户端（用于测试连接）..."
apt install -y redis-tools || yum install -y redis

echo ""
echo "[5/6] 创建项目目录..."
mkdir -p /www/wwwroot/tennis-tournament
cd /www/wwwroot/tennis-tournament

echo ""
echo "[6/6] 配置完成！"
echo ""
echo "========================================"
echo "   下一步操作"
echo "========================================"
echo ""
echo "1. 上传项目文件到: /www/wwwroot/tennis-tournament"
echo "2. 进入backend目录: cd /www/wwwroot/tennis-tournament/backend"
echo "3. 安装依赖: npm install"
echo "4. 创建.env文件，配置REDIS_URL"
echo "5. 启动服务: pm2 start server-local-api.js --name tennis-api"
echo "6. 保存PM2配置: pm2 save && pm2 startup"
echo ""
echo "========================================"
echo "   常用命令"
echo "========================================"
echo ""
echo "查看PM2服务: pm2 list"
echo "查看日志: pm2 logs tennis-api"
echo "重启服务: pm2 restart tennis-api"
echo "停止服务: pm2 stop tennis-api"
echo ""

