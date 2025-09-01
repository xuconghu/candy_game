const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const Database = require('../database');

const router = express.Router();
const db = new Database();

// 配置文件上传
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '../uploads/game-data');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueName = `${Date.now()}-${uuidv4()}.json`;
        cb(null, uniqueName);
    }
});

const upload = multer({
    storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB限制
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/json' || file.originalname.endsWith('.json')) {
            cb(null, true);
        } else {
            cb(new Error('只允许上传JSON文件'));
        }
    }
});

// 开始新游戏会话
router.post('/start', async (req, res) => {
    try {
        const { user_id, robot_type } = req.body;

        // 验证输入
        if (!user_id || !robot_type) {
            return res.status(400).json({ error: '缺少必要参数' });
        }

        if (!['robot1', 'robot2'].includes(robot_type)) {
            return res.status(400).json({ error: '无效的机器人类型' });
        }

        // 验证用户是否存在
        const user = await db.getUser(user_id);
        if (!user) {
            return res.status(404).json({ error: '用户不存在' });
        }

        // 生成会话ID
        const session_id = uuidv4();

        res.json({
            success: true,
            message: '游戏会话创建成功',
            data: {
                session_id,
                user_id,
                robot_type,
                start_time: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error('创建游戏会话失败:', error);
        res.status(500).json({ error: '创建游戏会话失败' });
    }
});

// 记录游戏事件
router.post('/events', async (req, res) => {
    try {
        const { session_id, event_type, event_data } = req.body;

        // 验证输入
        if (!session_id || !event_type) {
            return res.status(400).json({ error: '缺少必要参数' });
        }

        // 保存游戏事件
        const result = await db.saveGameEvent({
            session_id,
            event_type,
            event_data: event_data || {}
        });

        res.json({
            success: true,
            message: '游戏事件记录成功',
            data: {
                event_id: result.id
            }
        });

    } catch (error) {
        console.error('记录游戏事件失败:', error);
        res.status(500).json({ error: '记录游戏事件失败' });
    }
});

// 完成游戏并保存完整数据
router.post('/complete', async (req, res) => {
    try {
        const {
            user_id,
            session_id,
            robot_type,
            score,
            game_duration,
            game_data,
            evaluation_ratings
        } = req.body;

        // 验证必要参数
        if (!user_id || !session_id || !robot_type || score === undefined) {
            return res.status(400).json({ error: '缺少必要参数' });
        }

        // 验证用户是否存在
        const user = await db.getUser(user_id);
        if (!user) {
            return res.status(404).json({ error: '用户不存在' });
        }

        // 保存游戏记录
        const result = await db.saveGameRecord({
            user_id,
            session_id,
            robot_type,
            score: parseInt(score),
            game_duration: parseInt(game_duration) || 0,
            game_data: game_data || {},
            evaluation_ratings: evaluation_ratings || {}
        });

        res.json({
            success: true,
            message: '游戏数据保存成功',
            data: {
                record_id: result.id,
                session_id: result.session_id
            }
        });

    } catch (error) {
        console.error('保存游戏数据失败:', error);
        res.status(500).json({ error: '保存游戏数据失败' });
    }
});

// 上传游戏数据文件
router.post('/upload', upload.single('gameData'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: '没有上传文件' });
        }

        const { user_id, session_id } = req.body;

        if (!user_id || !session_id) {
            return res.status(400).json({ error: '缺少用户ID或会话ID' });
        }

        // 读取上传的JSON文件
        const filePath = req.file.path;
        const gameData = JSON.parse(fs.readFileSync(filePath, 'utf8'));

        // 验证JSON数据结构
        if (!gameData.score || !gameData.robotType) {
            return res.status(400).json({ error: '游戏数据格式不正确' });
        }

        // 保存到数据库
        const result = await db.saveGameRecord({
            user_id,
            session_id,
            robot_type: gameData.robotType,
            score: gameData.score,
            game_duration: gameData.gameDuration || 0,
            game_data: gameData,
            evaluation_ratings: gameData.evaluationRatings || {}
        });

        res.json({
            success: true,
            message: '游戏数据上传成功',
            data: {
                record_id: result.id,
                filename: req.file.filename,
                upload_time: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error('上传游戏数据失败:', error);
        
        // 删除上传的文件（如果存在）
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }

        res.status(500).json({ error: '上传游戏数据失败' });
    }
});

// 获取游戏统计信息
router.get('/stats', async (req, res) => {
    try {
        // 这里可以添加全局游戏统计逻辑
        // 暂时返回基础信息
        res.json({
            success: true,
            message: '游戏统计功能开发中',
            data: {
                total_games: 0,
                total_users: 0,
                average_score: 0
            }
        });

    } catch (error) {
        console.error('获取游戏统计失败:', error);
        res.status(500).json({ error: '获取游戏统计失败' });
    }
});

module.exports = router;
