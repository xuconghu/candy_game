# 🌐 Cloudflare配置指南 - 绕过备案

## 📋 概述

使用Cloudflare可以绕过域名备案要求，通过CDN代理访问你的服务器，避免域名直接解析到国内服务器IP。

## 🚀 配置步骤

### 第一步：注册Cloudflare

1. **访问Cloudflare官网**
   - 网址: https://cloudflare.com
   - 点击 "Sign Up" 注册免费账号

2. **添加域名**
   - 登录后点击 "Add a Site"
   - 输入你的域名: `xuconghu.top`
   - 选择 "Free" 免费计划
   - 点击 "Continue"

### 第二步：DNS配置

在Cloudflare DNS管理页面添加以下记录：

```
记录类型: A
名称: @
内容: 106.15.184.68
代理状态: 已代理 🟠 (橙色云朵，重要！)
TTL: 自动

记录类型: A
名称: api
内容: 106.15.184.68
代理状态: 已代理 🟠 (橙色云朵，重要！)
TTL: 自动
```

**重要提示**: 
- 🟠 橙色云朵 = 已代理 (通过Cloudflare CDN)
- 🔘 灰色云朵 = 仅DNS (直接解析到服务器)
- **必须选择橙色云朵才能绕过备案！**

### 第三步：更改域名DNS服务器

1. **获取Cloudflare DNS服务器地址**
   - Cloudflare会显示两个DNS服务器地址，类似：
   ```
   ns1.cloudflare.com
   ns2.cloudflare.com
   ```

2. **在域名注册商修改DNS**
   - 登录你的域名注册商管理面板
   - 找到DNS设置或域名解析设置
   - 将DNS服务器改为Cloudflare提供的地址
   - 保存设置

3. **等待生效**
   - DNS更改通常需要几分钟到24小时生效
   - Cloudflare会自动检测并确认

### 第四步：SSL/TLS配置

1. **进入SSL/TLS设置**
   - 在Cloudflare控制台点击 "SSL/TLS"
   - 选择 "概述" 标签

2. **选择加密模式**
   - 选择 "灵活" (Flexible)
   - 这样用户到Cloudflare是HTTPS，Cloudflare到服务器是HTTP

3. **启用Always Use HTTPS**
   - 进入 "边缘证书" 标签
   - 开启 "Always Use HTTPS"
   - 这样所有HTTP请求会自动重定向到HTTPS

### 第五步：验证配置

1. **检查DNS生效**
   ```bash
   nslookup xuconghu.top
   # 应该返回Cloudflare的IP地址，而不是你的服务器IP
   ```

2. **测试API访问**
   - 访问: https://xuconghu.top/api/health
   - 应该返回: `{"success":true,"message":"服务器运行正常"}`

3. **测试游戏**
   - 访问你的GitHub Pages: https://yourusername.github.io/candy_game/
   - 游戏应该能正常连接API

## 🔧 服务器端配置（可选优化）

### 获取真实IP地址

由于使用了Cloudflare代理，服务器看到的都是Cloudflare的IP。如果需要获取用户真实IP，可以更新Nginx配置：

```nginx
server {
    listen 80;
    server_name xuconghu.top api.xuconghu.top;

    # Cloudflare真实IP配置
    set_real_ip_from 173.245.48.0/20;
    set_real_ip_from 103.21.244.0/22;
    set_real_ip_from 103.22.200.0/22;
    set_real_ip_from 103.31.4.0/22;
    set_real_ip_from 141.101.64.0/18;
    set_real_ip_from 108.162.192.0/18;
    set_real_ip_from 190.93.240.0/20;
    set_real_ip_from 188.114.96.0/20;
    set_real_ip_from 197.234.240.0/22;
    set_real_ip_from 198.41.128.0/17;
    set_real_ip_from 162.158.0.0/15;
    set_real_ip_from 104.16.0.0/13;
    set_real_ip_from 104.24.0.0/14;
    set_real_ip_from 172.64.0.0/13;
    set_real_ip_from 131.0.72.0/22;
    real_ip_header CF-Connecting-IP;

    # 其他配置保持不变...
}
```

## 🎯 优势和注意事项

### ✅ 优势
- **绕过备案**: 域名不直接解析到国内服务器
- **免费HTTPS**: 自动提供SSL证书
- **CDN加速**: 全球CDN节点加速访问
- **DDoS防护**: 基础DDoS防护
- **缓存优化**: 静态资源缓存

### ⚠️ 注意事项
- **延迟增加**: 通过CDN可能增加一些延迟
- **功能限制**: 免费版有一些功能限制
- **依赖性**: 依赖Cloudflare服务稳定性
- **合规性**: 确保符合当地法律法规

## 🐛 故障排除

### 常见问题

1. **DNS未生效**
   - 检查是否正确更改了DNS服务器
   - 等待更长时间（最多24小时）
   - 使用在线DNS检查工具验证

2. **SSL证书错误**
   - 确保选择了"灵活"加密模式
   - 等待SSL证书自动配置完成

3. **API访问失败**
   - 检查代理状态是否为橙色云朵
   - 确认服务器防火墙允许Cloudflare IP访问
   - 检查Nginx配置是否正确

4. **混合内容错误**
   - 确保前端代码使用HTTPS API地址
   - 开启"Always Use HTTPS"

### 调试命令

```bash
# 检查DNS解析
nslookup xuconghu.top
dig xuconghu.top

# 检查SSL证书
openssl s_client -connect xuconghu.top:443

# 测试API连接
curl -v https://xuconghu.top/api/health
```

## 📊 监控和维护

### Cloudflare Analytics
- 查看流量统计
- 监控安全事件
- 分析性能指标

### 定期检查
- SSL证书状态
- DNS记录配置
- 安全设置

---

**配置完成后，你的域名将通过Cloudflare CDN提供服务，无需备案即可正常访问！**

**最后更新**: 2025-08-22
