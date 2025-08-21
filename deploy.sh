#!/bin/bash
set -e

echo "🚀 在服务器上部署糖果游戏..."

# 更新系统
sudo apt update

# 安装Node.js (如果未安装)
if ! command -v node &> /dev/null; then
    echo "📦 安装Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

# 安装Nginx (如果未安装)
if ! command -v nginx &> /dev/null; then
    echo "📦 安装Nginx..."
    sudo apt install -y nginx
fi

# 安装PM2 (如果未安装)
if ! command -v pm2 &> /dev/null; then
    echo "📦 安装PM2..."
    sudo npm install -g pm2
fi

# 创建项目目录
PROJECT_DIR="/var/www/candy-game"
sudo mkdir -p $PROJECT_DIR
sudo chown -R $USER:$USER $PROJECT_DIR

# 部署文件
echo "📦 部署文件..."
cp -r frontend/* $PROJECT_DIR/
cp -r backend $PROJECT_DIR/

# 安装后端依赖
cd $PROJECT_DIR/backend
if [ -f package.json ]; then
    npm install
fi

# 配置Nginx
echo "⚙️ 配置Nginx..."
sudo tee /etc/nginx/sites-available/candy-game > /dev/null << 'NGINXEOF'
server {
    listen 80;
    server_name _;
    
    # 前端静态文件
    location / {
        root /var/www/candy-game;
        index candy_game.html;
        try_files $uri $uri/ =404;
    }
    
    # 后端API代理
    location /api/ {
        proxy_pass http://localhost:3000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
NGINXEOF

# 启用站点
sudo ln -sf /etc/nginx/sites-available/candy-game /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# 测试Nginx配置
sudo nginx -t

# 重启Nginx
sudo systemctl restart nginx
sudo systemctl enable nginx

# 启动后端服务
echo "🚀 启动后端服务..."
cd $PROJECT_DIR/backend

# 停止现有进程
pm2 delete candy-game-backend 2>/dev/null || true

# 启动新进程
pm2 start simple-server.js --name candy-game-backend
pm2 save
pm2 startup | grep -E '^sudo' | bash || true

# 检查服务状态
sleep 3
if curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
    echo "✅ 后端服务启动成功"
else
    echo "❌ 后端服务启动失败，查看日志："
    pm2 logs candy-game-backend --lines 10
fi

if sudo systemctl is-active --quiet nginx; then
    echo "✅ Nginx运行正常"
else
    echo "❌ Nginx启动失败"
    sudo systemctl status nginx
fi

echo ""
echo "🎉 部署完成！"
echo "📍 游戏地址: http://106.15.184.68"
echo "📍 管理后台: http://106.15.184.68/admin-dashboard.html"
echo "📍 API健康检查: http://106.15.184.68/api/health"
echo ""
echo "🔧 管理命令:"
echo "  查看后端日志: pm2 logs candy-game-backend"
echo "  重启后端: pm2 restart candy-game-backend"
echo "  重启Nginx: sudo systemctl restart nginx"
