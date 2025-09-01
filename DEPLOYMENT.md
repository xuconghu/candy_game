# 🍭 糖果游戏部署说明

## 📋 概述

糖果游戏现在已经配置为使用你的域名API服务器。前端代码已经更新，可以正确连接到你的后端API。

## 🌐 API配置

### 当前API地址
- **域名**: `xuconghu.top`
- **API基础URL**: `http://xuconghu.top/api`

### API端点
- 健康检查: `GET /api/health`
- 用户列表: `GET /api/users`
- 用户注册: `POST /api/users`
- 开始游戏: `POST /api/games/start`
- 记录事件: `POST /api/games/events`
- 完成游戏: `POST /api/games/complete`

## 🔧 前端配置

### API客户端配置
文件: `js/api-client.js`

```javascript
getBaseURL() {
    // 开发环境
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        return 'http://localhost:3000/api';
    }

    // GitHub Pages环境 - 使用你的域名
    if (window.location.hostname.includes('github.io')) {
        return 'http://xuconghu.top/api';
    }

    // 其他生产环境 - 使用你的域名
    return 'http://xuconghu.top/api';
}
```

### 本地测试模式
当在本地环境（file://协议）运行时，游戏会自动启用本地测试模式，使用模拟数据而不是真实API。

## 🚀 部署方式

### 1. GitHub Pages部署
1. 将 `github-version` 文件夹内容推送到GitHub仓库
2. 在仓库设置中启用GitHub Pages
3. 选择主分支作为源
4. 访问 `https://yourusername.github.io/repository-name`

### 2. 本地测试
1. 直接打开 `index.html` 文件
2. 游戏会自动启用本地测试模式
3. 使用 `api-test.html` 测试API连接

### 3. 其他静态托管服务
- Netlify
- Vercel
- Firebase Hosting
- 阿里云OSS
- 腾讯云COS

## 🧪 测试工具

### API连接测试
访问 `api-test.html` 页面进行API连接测试：

1. **健康检查**: 测试服务器是否在线
2. **用户API**: 测试用户注册和获取功能
3. **游戏API**: 测试游戏会话创建和事件记录

### 测试步骤
1. 打开 `api-test.html`
2. 点击"健康检查"按钮
3. 如果服务器在线，继续测试其他功能
4. 查看测试结果汇总

## 🔒 HTTPS支持

### 当前状态
- API服务器: HTTP (端口80)
- 前端: 支持HTTP和HTTPS

### HTTPS升级建议
为了更好的安全性和兼容性，建议：

1. **配置SSL证书**
   ```bash
   # 使用Let's Encrypt免费证书
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d xuconghu.top
   ```

2. **更新Nginx配置**
   ```nginx
   server {
       listen 443 ssl;
       server_name xuconghu.top;
       
       ssl_certificate /etc/letsencrypt/live/xuconghu.top/fullchain.pem;
       ssl_certificate_key /etc/letsencrypt/live/xuconghu.top/privkey.pem;
       
       # 其他配置...
   }
   ```

3. **更新前端API地址**
   ```javascript
   return 'https://xuconghu.top/api';
   ```

## 🐛 故障排除

### 常见问题

1. **CORS错误**
   - 确保Nginx配置了正确的CORS头
   - 检查 `Access-Control-Allow-Origin` 设置

2. **混合内容错误**
   - HTTPS页面无法访问HTTP API
   - 使用代理服务或升级API到HTTPS

3. **DNS解析问题**
   - 检查域名DNS记录
   - 使用 `nslookup xuconghu.top` 验证

4. **API连接超时**
   - 检查服务器防火墙设置
   - 确认API服务正在运行

### 调试工具
- 浏览器开发者工具 (F12)
- Network标签查看API请求
- Console标签查看错误信息

## 📊 监控和日志

### 前端日志
游戏会在浏览器控制台输出详细日志：
- API请求和响应
- 游戏事件记录
- 错误信息

### 后端日志
检查服务器日志：
```bash
# API服务日志
sudo journalctl -u candy-game-api -f

# Nginx日志
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

## 🔄 更新流程

### 前端更新
1. 修改代码
2. 测试本地功能
3. 使用 `api-test.html` 验证API连接
4. 部署到托管服务

### 后端更新
1. 修改API代码
2. 重启服务: `sudo systemctl restart candy-game-api`
3. 检查服务状态: `sudo systemctl status candy-game-api`
4. 验证API功能

## 📞 支持

如果遇到问题，请检查：
1. API服务器状态
2. DNS解析
3. 网络连接
4. 浏览器控制台错误

---

**最后更新**: 2025-08-22
**API版本**: v1.0
**前端版本**: v1.0
