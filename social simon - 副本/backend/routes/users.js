const express = require('express');
const { v4: uuidv4 } = require('uuid');
const Database = require('../database');

const router = express.Router();
const db = new Database();

// 获取所有用户列表
router.get('/', async (req, res) => {
    try {
        const users = await db.getAllUsers();
        res.json({
            success: true,
            data: users
        });
    } catch (error) {
        console.error('获取用户列表失败:', error);
        res.status(500).json({
            success: false,
            error: '获取用户列表失败',
            message: error.message
        });
    }
});

// 创建或获取用户
router.post('/register', async (req, res) => {
    try {
        const { username, email } = req.body;
        
        // 验证输入
        if (!username) {
            return res.status(400).json({ error: '用户名不能为空' });
        }

        // 生成唯一用户ID
        const user_id = uuidv4();

        // 创建用户
        const result = await db.createUser({
            user_id,
            username,
            email: email || null
        });

        res.json({
            success: true,
            message: '用户创建成功',
            data: {
                user_id: result.user_id,
                username
            }
        });

    } catch (error) {
        console.error('创建用户失败:', error);
        
        // 处理重复用户ID的情况（虽然UUID重复概率极低）
        if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
            return res.status(409).json({ error: '用户已存在' });
        }

        res.status(500).json({ error: '创建用户失败' });
    }
});

// 获取用户信息
router.get('/:user_id', async (req, res) => {
    try {
        const { user_id } = req.params;

        const user = await db.getUser(user_id);
        
        if (!user) {
            return res.status(404).json({ error: '用户不存在' });
        }

        res.json({
            success: true,
            data: {
                user_id: user.user_id,
                username: user.username,
                email: user.email,
                created_at: user.created_at
            }
        });

    } catch (error) {
        console.error('获取用户信息失败:', error);
        res.status(500).json({ error: '获取用户信息失败' });
    }
});

// 获取用户游戏记录
router.get('/:user_id/games', async (req, res) => {
    try {
        const { user_id } = req.params;
        const limit = parseInt(req.query.limit) || 10;

        // 验证用户是否存在
        const user = await db.getUser(user_id);
        if (!user) {
            return res.status(404).json({ error: '用户不存在' });
        }

        const gameRecords = await db.getUserGameRecords(user_id, limit);

        res.json({
            success: true,
            data: {
                user_id,
                total: gameRecords.length,
                games: gameRecords
            }
        });

    } catch (error) {
        console.error('获取用户游戏记录失败:', error);
        res.status(500).json({ error: '获取游戏记录失败' });
    }
});

// 用户统计信息
router.get('/:user_id/stats', async (req, res) => {
    try {
        const { user_id } = req.params;

        // 验证用户是否存在
        const user = await db.getUser(user_id);
        if (!user) {
            return res.status(404).json({ error: '用户不存在' });
        }

        const gameRecords = await db.getUserGameRecords(user_id, 100); // 获取更多记录用于统计

        // 计算统计信息
        const stats = {
            total_games: gameRecords.length,
            average_score: 0,
            highest_score: 0,
            total_playtime: 0,
            robot_preferences: {
                robot1: 0,
                robot2: 0
            }
        };

        if (gameRecords.length > 0) {
            const scores = gameRecords.map(record => record.score);
            stats.average_score = Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
            stats.highest_score = Math.max(...scores);
            stats.total_playtime = gameRecords.reduce((sum, record) => sum + (record.game_duration || 0), 0);

            // 统计机器人偏好
            gameRecords.forEach(record => {
                if (record.robot_type === 'robot1') {
                    stats.robot_preferences.robot1++;
                } else if (record.robot_type === 'robot2') {
                    stats.robot_preferences.robot2++;
                }
            });
        }

        res.json({
            success: true,
            data: {
                user_id,
                username: user.username,
                stats
            }
        });

    } catch (error) {
        console.error('获取用户统计信息失败:', error);
        res.status(500).json({ error: '获取统计信息失败' });
    }
});

module.exports = router;
