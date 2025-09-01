const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

class Database {
    constructor() {
        // 确保数据库目录存在
        const dbDir = path.join(__dirname, 'data');
        if (!fs.existsSync(dbDir)) {
            fs.mkdirSync(dbDir, { recursive: true });
        }

        // 连接数据库
        const dbPath = path.join(dbDir, 'candy_game.db');
        this.db = new sqlite3.Database(dbPath, (err) => {
            if (err) {
                console.error('数据库连接失败:', err);
            } else {
                console.log('✅ 数据库连接成功:', dbPath);
                this.initTables();
            }
        });
    }

    // 初始化数据表
    initTables() {
        // 用户表
        const createUsersTable = `
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT UNIQUE NOT NULL,
                username TEXT,
                email TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `;

        // 游戏记录表
        const createGamesTable = `
            CREATE TABLE IF NOT EXISTS game_records (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT NOT NULL,
                session_id TEXT UNIQUE NOT NULL,
                robot_type TEXT NOT NULL,
                score INTEGER NOT NULL,
                game_duration INTEGER,
                game_data TEXT,
                evaluation_ratings TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (user_id)
            )
        `;

        // 游戏事件表（详细的游戏行为记录）
        const createGameEventsTable = `
            CREATE TABLE IF NOT EXISTS game_events (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id TEXT NOT NULL,
                event_type TEXT NOT NULL,
                event_data TEXT,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (session_id) REFERENCES game_records (session_id)
            )
        `;

        // 执行建表语句
        this.db.serialize(() => {
            this.db.run(createUsersTable, (err) => {
                if (err) console.error('创建用户表失败:', err);
                else console.log('✅ 用户表初始化完成');
            });

            this.db.run(createGamesTable, (err) => {
                if (err) console.error('创建游戏记录表失败:', err);
                else console.log('✅ 游戏记录表初始化完成');
            });

            this.db.run(createGameEventsTable, (err) => {
                if (err) console.error('创建游戏事件表失败:', err);
                else console.log('✅ 游戏事件表初始化完成');
            });
        });
    }

    // 创建用户
    createUser(userData) {
        return new Promise((resolve, reject) => {
            const { user_id, username, email } = userData;
            const sql = `
                INSERT INTO users (user_id, username, email)
                VALUES (?, ?, ?)
            `;
            
            this.db.run(sql, [user_id, username, email], function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ id: this.lastID, user_id });
                }
            });
        });
    }

    // 获取所有用户
    getAllUsers() {
        return new Promise((resolve, reject) => {
            const sql = `SELECT * FROM users ORDER BY created_at DESC`;

            this.db.all(sql, [], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows || []);
                }
            });
        });
    }

    // 获取用户
    getUser(user_id) {
        return new Promise((resolve, reject) => {
            const sql = `SELECT * FROM users WHERE user_id = ?`;

            this.db.get(sql, [user_id], (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
    }

    // 保存游戏记录
    saveGameRecord(gameData) {
        return new Promise((resolve, reject) => {
            const {
                user_id,
                session_id,
                robot_type,
                score,
                game_duration,
                game_data,
                evaluation_ratings
            } = gameData;

            const sql = `
                INSERT INTO game_records 
                (user_id, session_id, robot_type, score, game_duration, game_data, evaluation_ratings)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `;

            this.db.run(sql, [
                user_id,
                session_id,
                robot_type,
                score,
                game_duration,
                JSON.stringify(game_data),
                JSON.stringify(evaluation_ratings)
            ], function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ id: this.lastID, session_id });
                }
            });
        });
    }

    // 保存游戏事件
    saveGameEvent(eventData) {
        return new Promise((resolve, reject) => {
            const { session_id, event_type, event_data } = eventData;
            const sql = `
                INSERT INTO game_events (session_id, event_type, event_data)
                VALUES (?, ?, ?)
            `;

            this.db.run(sql, [
                session_id,
                event_type,
                JSON.stringify(event_data)
            ], function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ id: this.lastID });
                }
            });
        });
    }

    // 获取用户游戏记录
    getUserGameRecords(user_id, limit = 10) {
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT * FROM game_records 
                WHERE user_id = ? 
                ORDER BY created_at DESC 
                LIMIT ?
            `;

            this.db.all(sql, [user_id, limit], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    // 解析JSON字段
                    const records = rows.map(row => ({
                        ...row,
                        game_data: JSON.parse(row.game_data || '{}'),
                        evaluation_ratings: JSON.parse(row.evaluation_ratings || '{}')
                    }));
                    resolve(records);
                }
            });
        });
    }

    // 关闭数据库连接
    close() {
        return new Promise((resolve) => {
            this.db.close((err) => {
                if (err) {
                    console.error('关闭数据库失败:', err);
                } else {
                    console.log('✅ 数据库连接已关闭');
                }
                resolve();
            });
        });
    }
}

module.exports = Database;
