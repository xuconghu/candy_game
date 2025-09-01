const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');

const Database = require('./database');
const userRoutes = require('./routes/users');
const gameRoutes = require('./routes/games');

const app = express();
const PORT = process.env.PORT || 3000;

// 创建数据库实例
const db = new Database();

// 中间件配置
app.use(helmet({
    contentSecurityPolicy: false, // 允许内联脚本，适配游戏需求
}));
app.use(compression());
app.use(morgan('combined'));
app.use(cors({
    origin: function (origin, callback) {
        // 允许没有origin的请求（如直接打开HTML文件）
        if (!origin) return callback(null, true);

        // 生产环境允许的域名
        const allowedOrigins = process.env.NODE_ENV === 'production'
            ? ['https://yourdomain.com', 'http://106.15.184.68', 'http://localhost:8080', 'http://127.0.0.1:8080']
            : ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:8080', 'http://127.0.0.1:8080'];

        // 检查origin是否在允许列表中
        if (allowedOrigins.indexOf(origin) !== -1) {
            return callback(null, true);
        }

        // 对于其他origin，也允许（开发阶段）
        if (process.env.NODE_ENV !== 'production') {
            return callback(null, true);
        }

        return callback(new Error('Not allowed by CORS'));
    },
    credentials: true
}));

// 限流配置
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15分钟
    max: 100, // 每个IP最多100个请求
    message: '请求过于频繁，请稍后再试'
});
app.use('/api/', limiter);

// 解析JSON和URL编码数据
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 静态文件服务
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 创建上传目录
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// API路由
app.use('/api/users', userRoutes);
app.use('/api/games', gameRoutes);

// 健康检查
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

// 错误处理中间件
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ 
        error: '服务器内部错误',
        message: process.env.NODE_ENV === 'development' ? err.message : '请稍后重试'
    });
});

// 404处理
app.use('*', (req, res) => {
    res.status(404).json({ error: '接口不存在' });
});

// 启动服务器
app.listen(PORT, () => {
    console.log(`🚀 糖果世界游戏后端服务启动成功！`);
    console.log(`📍 服务地址: http://localhost:${PORT}`);
    console.log(`📍 API文档: http://localhost:${PORT}/api/health`);
    console.log(`🕒 启动时间: ${new Date().toLocaleString()}`);
});

// 优雅关闭
process.on('SIGTERM', () => {
    console.log('收到SIGTERM信号，正在关闭服务器...');
    db.close();
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('收到SIGINT信号，正在关闭服务器...');
    db.close();
    process.exit(0);
});
