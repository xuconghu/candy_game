# 糖果世界游戏部署指南

## 📋 部署概览

本指南将帮助您将糖果世界游戏部署到Ubuntu服务器上，包括：
- 前端静态文件服务
- Node.js后端API服务
- SQLite数据库
- Nginx反向代理

## 🛠️ 服务器要求

- **操作系统**: Ubuntu 22.04 LTS
- **内存**: 至少4GB推荐
- **存储**: 至少20GB可用空间
- **网络**: 公网IP地址

## 🚀 快速部署

### 1. 服务器环境准备

```bash
# 上传server-setup.sh到服务器
chmod +x server-setup.sh
./server-setup.sh
```

### 2. 上传项目文件

将整个项目文件夹上传到服务器：

```bash
# 在本地执行（替换为您的服务器IP）
scp -r "social simon" username@your-server-ip:~/candy-game/
```

### 3. 执行部署脚本

```bash
# 在服务器上执行
cd ~/candy-game
chmod +x deploy/deploy.sh
./deploy/deploy.sh
```

## 📝 详细部署步骤

### 步骤1: 环境安装

```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# 安装其他依赖
sudo apt install -y nginx sqlite3 git curl wget
sudo npm install -g pm2
```

### 步骤2: 配置防火墙

```bash
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw --force enable
```

### 步骤3: 部署后端

```bash
# 创建项目目录
sudo mkdir -p /var/www/candy-game
sudo chown -R $USER:$USER /var/www/candy-game

# 复制后端文件
cp -r backend /var/www/candy-game/

# 安装依赖
cd /var/www/candy-game/backend
npm install --production
```

### 步骤4: 部署前端

```bash
# 复制前端文件
mkdir -p /var/www/candy-game/frontend
cp candy_game.html /var/www/candy-game/frontend/
cp -r image js *.ttf *.mp3 /var/www/candy-game/frontend/
```

### 步骤5: 配置Nginx

```bash
# 复制配置文件
sudo cp deploy/nginx.conf /etc/nginx/sites-available/candy-game

# 启用站点
sudo ln -s /etc/nginx/sites-available/candy-game /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default

# 测试并重启
sudo nginx -t
sudo systemctl restart nginx
```

### 步骤6: 启动后端服务

```bash
cd /var/www/candy-game/backend

# 使用PM2启动
pm2 start server.js --name candy-game-backend
pm2 save
pm2 startup
```

## 🔧 配置说明

### API客户端配置

修改 `js/api-client.js` 中的API地址：

```javascript
getBaseURL() {
    // 生产环境 - 替换为您的域名
    return 'https://yourdomain.com/api';
}
```

### Nginx配置

修改 `deploy/nginx.conf` 中的域名：

```nginx
server_name your-domain.com www.your-domain.com;
```

## 📊 服务管理

### 后端服务管理

```bash
# 查看状态
pm2 status

# 查看日志
pm2 logs candy-game-backend

# 重启服务
pm2 restart candy-game-backend

# 停止服务
pm2 stop candy-game-backend
```

### Nginx管理

```bash
# 重启Nginx
sudo systemctl restart nginx

# 查看状态
sudo systemctl status nginx

# 查看日志
sudo tail -f /var/log/nginx/candy-game-error.log
```

### 数据库管理

```bash
# 查看数据库
cd /var/www/candy-game/backend/data
sqlite3 candy_game.db

# 备份数据库
cp candy_game.db candy_game_backup_$(date +%Y%m%d).db
```

## 🔒 安全配置

### SSL证书配置（推荐）

```bash
# 安装Certbot
sudo apt install certbot python3-certbot-nginx

# 获取SSL证书
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# 自动续期
sudo crontab -e
# 添加: 0 12 * * * /usr/bin/certbot renew --quiet
```

### 防火墙配置

```bash
# 只允许必要端口
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

## 📈 监控和维护

### 日志位置

- **后端日志**: `/var/log/candy-game/`
- **Nginx日志**: `/var/log/nginx/`
- **PM2日志**: `~/.pm2/logs/`

### 定期维护

```bash
# 清理日志（每周执行）
sudo logrotate -f /etc/logrotate.conf

# 更新系统（每月执行）
sudo apt update && sudo apt upgrade -y

# 备份数据库（每天执行）
cd /var/www/candy-game/backend/data
cp candy_game.db /backup/candy_game_$(date +%Y%m%d).db
```

## 🐛 故障排除

### 常见问题

1. **后端服务无法启动**
   ```bash
   pm2 logs candy-game-backend
   # 检查端口是否被占用
   sudo netstat -tlnp | grep :3000
   ```

2. **前端无法访问API**
   - 检查防火墙设置
   - 确认Nginx配置正确
   - 查看浏览器控制台错误

3. **数据库权限问题**
   ```bash
   sudo chown -R $USER:$USER /var/www/candy-game/backend/data
   chmod 755 /var/www/candy-game/backend/data
   ```

## 📞 技术支持

如果遇到问题，请检查：
1. 服务器日志文件
2. 浏览器开发者工具
3. 网络连接状态
4. 防火墙配置

---

**部署完成后，访问您的服务器IP地址即可开始使用糖果世界游戏！** 🎮
