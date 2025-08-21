// 简单的后端服务器 - 不需要复杂依赖
const http = require('http');
const url = require('url');
const fs = require('fs');
const path = require('path');

const PORT = 3000;

// 简单的内存数据库
let users = [];
let games = [];
let currentId = 1;

// CORS 头部
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json'
};

// 处理请求
const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const path = parsedUrl.pathname;
    const method = req.method;

    // 处理 OPTIONS 请求（CORS 预检）
    if (method === 'OPTIONS') {
        res.writeHead(200, corsHeaders);
        res.end();
        return;
    }

    // 设置响应头
    Object.keys(corsHeaders).forEach(key => {
        res.setHeader(key, corsHeaders[key]);
    });

    // 路由处理
    if (path === '/api/health') {
        res.writeHead(200);
        res.end(JSON.stringify({ status: 'ok', message: '糖果游戏后端服务正常运行' }));
    }
    else if (path === '/api/users/register' && method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            try {
                const userData = JSON.parse(body);
                const username = userData.username;

                if (!username || username.trim() === '') {
                    res.writeHead(400);
                    res.end(JSON.stringify({ success: false, message: '用户名不能为空' }));
                    return;
                }

                // 检查用户是否已存在
                const existingUser = users.find(u => u.username === username);
                if (existingUser) {
                    res.writeHead(400);
                    res.end(JSON.stringify({ success: false, message: '用户名已存在' }));
                    return;
                }

                // 创建新用户
                const newUser = {
                    id: currentId++,
                    username: username,
                    created_at: new Date().toISOString()
                };
                users.push(newUser);

                res.writeHead(201);
                res.end(JSON.stringify({ success: true, data: newUser }));
            } catch (error) {
                res.writeHead(400);
                res.end(JSON.stringify({ success: false, message: '无效的请求数据' }));
            }
        });
    }
    else if (path === '/api/users' && method === 'GET') {
        // 获取所有用户列表
        res.writeHead(200);
        res.end(JSON.stringify({
            success: true,
            data: users.map(user => ({
                user_id: user.user_id,
                username: user.username,
                email: user.email,
                created_at: user.created_at
            }))
        }));
    }
    else if (path === '/api/users/login' && method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            try {
                const userData = JSON.parse(body);
                const username = userData.username;

                if (!username || username.trim() === '') {
                    res.writeHead(400);
                    res.end(JSON.stringify({ success: false, message: '用户名不能为空' }));
                    return;
                }

                // 查找用户
                const user = users.find(u => u.username === username);
                if (!user) {
                    res.writeHead(404);
                    res.end(JSON.stringify({ success: false, message: '用户不存在' }));
                    return;
                }

                res.writeHead(200);
                res.end(JSON.stringify({ success: true, data: user }));
            } catch (error) {
                res.writeHead(400);
                res.end(JSON.stringify({ success: false, message: '无效的请求数据' }));
            }
        });
    }
    else if (path === '/api/games' && method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            try {
                const gameData = JSON.parse(body);
                
                // 验证必需字段
                if (!gameData.username || typeof gameData.score !== 'number') {
                    res.writeHead(400);
                    res.end(JSON.stringify({ success: false, message: '缺少必需字段' }));
                    return;
                }

                // 创建游戏记录
                const newGame = {
                    id: currentId++,
                    username: gameData.username,
                    score: gameData.score,
                    moves_used: gameData.moves_used || 0,
                    duration: gameData.duration || 0,
                    created_at: new Date().toISOString()
                };
                games.push(newGame);

                res.writeHead(201);
                res.end(JSON.stringify({ success: true, data: newGame }));
            } catch (error) {
                res.writeHead(400);
                res.end(JSON.stringify({ success: false, message: '无效的请求数据' }));
            }
        });
    }
    else if (path === '/api/leaderboard' && method === 'GET') {
        // 计算排行榜
        const leaderboard = {};
        
        games.forEach(game => {
            if (!leaderboard[game.username] || leaderboard[game.username].best_score < game.score) {
                leaderboard[game.username] = {
                    username: game.username,
                    best_score: game.score,
                    total_games: 0,
                    avg_score: 0
                };
            }
        });

        // 计算总游戏数和平均分
        games.forEach(game => {
            if (leaderboard[game.username]) {
                leaderboard[game.username].total_games++;
            }
        });

        Object.keys(leaderboard).forEach(username => {
            const userGames = games.filter(g => g.username === username);
            const totalScore = userGames.reduce((sum, g) => sum + g.score, 0);
            leaderboard[username].avg_score = Math.round(totalScore / userGames.length);
        });

        // 转换为数组并排序
        const sortedLeaderboard = Object.values(leaderboard)
            .sort((a, b) => b.best_score - a.best_score);

        res.writeHead(200);
        res.end(JSON.stringify({ success: true, data: sortedLeaderboard }));
    }
    else if (path === '/api/stats' && method === 'GET') {
        const stats = {
            total_users: users.length,
            total_games: games.length,
            avg_score: games.length > 0 ? Math.round(games.reduce((sum, g) => sum + g.score, 0) / games.length) : 0,
            highest_score: games.length > 0 ? Math.max(...games.map(g => g.score)) : 0
        };

        res.writeHead(200);
        res.end(JSON.stringify({ success: true, data: stats }));
    }
    else {
        res.writeHead(404);
        res.end(JSON.stringify({ success: false, message: '接口不存在' }));
    }
});

server.listen(PORT, () => {
    console.log('🚀 糖果游戏后端服务器启动成功！');
    console.log(`📍 服务地址: http://localhost:${PORT}`);
    console.log(`🔍 健康检查: http://localhost:${PORT}/api/health`);
    console.log(`📊 当前注册用户: ${users.length}`);
    console.log(`🎮 游戏记录: ${games.length}`);
});

// 优雅关闭
process.on('SIGINT', () => {
    console.log('\n🛑 正在关闭服务器...');
    server.close(() => {
        console.log('✅ 服务器已关闭');
        process.exit(0);
    });
});

process.on('SIGTERM', () => {
    console.log('\n🛑 收到终止信号，正在关闭服务器...');
    server.close(() => {
        console.log('✅ 服务器已关闭');
        process.exit(0);
    });
});
