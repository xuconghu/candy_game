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
                const user = {
                    id: currentId++,
                    ...userData,
                    createdAt: new Date().toISOString()
                };
                users.push(user);
                res.writeHead(201);
                res.end(JSON.stringify({ success: true, user: { id: user.id, username: user.username } }));
            } catch (error) {
                res.writeHead(400);
                res.end(JSON.stringify({ success: false, error: '无效的请求数据' }));
            }
        });
    }
    else if (path === '/api/users/login' && method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            try {
                const { username } = JSON.parse(body);
                const user = users.find(u => u.username === username);
                if (user) {
                    res.writeHead(200);
                    res.end(JSON.stringify({ success: true, user: { id: user.id, username: user.username } }));
                } else {
                    res.writeHead(404);
                    res.end(JSON.stringify({ success: false, error: '用户不存在' }));
                }
            } catch (error) {
                res.writeHead(400);
                res.end(JSON.stringify({ success: false, error: '无效的请求数据' }));
            }
        });
    }
    else if (path === '/api/games' && method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            try {
                const gameData = JSON.parse(body);
                const game = {
                    id: currentId++,
                    ...gameData,
                    createdAt: new Date().toISOString()
                };
                games.push(game);
                res.writeHead(201);
                res.end(JSON.stringify({ success: true, game }));
            } catch (error) {
                res.writeHead(400);
                res.end(JSON.stringify({ success: false, error: '无效的游戏数据' }));
            }
        });
    }
    else if (path === '/api/games' && method === 'GET') {
        res.writeHead(200);
        res.end(JSON.stringify({ success: true, games }));
    }
    else if (path === '/api/users' && method === 'GET') {
        res.writeHead(200);
        res.end(JSON.stringify({ success: true, users }));
    }
    else {
        res.writeHead(404);
        res.end(JSON.stringify({ success: false, error: '接口不存在' }));
    }
});

server.listen(PORT, () => {
    console.log(`🚀 糖果游戏后端服务器启动成功！`);
    console.log(`📍 服务地址: http://localhost:${PORT}`);
    console.log(`🔍 健康检查: http://localhost:${PORT}/api/health`);
    console.log(`📊 当前注册用户: ${users.length}`);
    console.log(`🎮 游戏记录: ${games.length}`);
});
