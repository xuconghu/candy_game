/**
 * NocoDB API 客户端
 * 用于绕过域名封锁，直接使用NocoDB云服务
 */
class NocoDBClient {
    constructor() {
        // NocoDB配置
        this.baseURL = 'https://app.nocodb.com'; // NocoDB云服务
        this.projectId = 'YOUR_PROJECT_ID'; // 需要替换为实际项目ID
        this.apiToken = 'YOUR_API_TOKEN'; // 需要替换为实际API Token
        
        this.currentUser = null;
        this.currentSession = null;
    }

    // 通用HTTP请求方法
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}/api/v2/tables/${endpoint}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
                'xc-token': this.apiToken,
                ...options.headers
            },
            ...options
        };

        try {
            console.log(`🌐 NocoDB请求: ${config.method || 'GET'} ${url}`);

            const response = await fetch(url, config);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.msg || `HTTP ${response.status}`);
            }

            console.log(`✅ NocoDB响应:`, data);
            return data;

        } catch (error) {
            console.error(`❌ NocoDB请求失败:`, error);
            throw error;
        }
    }

    // 用户相关API - 适配players表结构
    async registerUser(userData) {
        try {
            const tableId = 'moudplvavlcwl26'; // players表ID

            // 创建新用户记录
            const url = `${this.baseURL}/api/v2/tables/${tableId}/records`;

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'xc-token': this.apiToken
                },
                body: JSON.stringify({
                    name: userData.name || '',
                    gender: userData.gender || '',
                    ID_Number: userData.ID_Number || '',
                    Phone: userData.Phone || '',
                    Time: new Date().toISOString()
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.msg || `HTTP ${response.status}: ${response.statusText}`);
            }

            const newUser = await response.json();
            this.currentUser = newUser;

            return {
                success: true,
                user: newUser
            };

        } catch (error) {
            console.error('用户注册失败:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async loginUser(userId) {
        try {
            const users = await this.request('/users', {
                method: 'GET',
                headers: {
                    'where': `(user_id,eq,${userId})`
                }
            });

            if (!users.list || users.list.length === 0) {
                throw new Error('用户不存在');
            }

            this.currentUser = users.list[0];
            return {
                success: true,
                user: this.currentUser
            };

        } catch (error) {
            console.error('用户登录失败:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // 游戏会话API
    async createGameSession(sessionData) {
        try {
            const session = await this.request('/game_records', {
                method: 'POST',
                body: JSON.stringify({
                    user_id: sessionData.user_id,
                    session_id: sessionData.session_id,
                    robot_type: sessionData.robot_type,
                    score: 0,
                    game_duration: 0,
                    game_data: JSON.stringify(sessionData.game_data || {}),
                    created_at: new Date().toISOString()
                })
            });

            this.currentSession = session;
            return {
                success: true,
                session: session
            };

        } catch (error) {
            console.error('创建游戏会话失败:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async updateGameSession(sessionId, updateData) {
        try {
            // 先获取记录ID
            const records = await this.request('/game_records', {
                method: 'GET',
                headers: {
                    'where': `(session_id,eq,${sessionId})`
                }
            });

            if (!records.list || records.list.length === 0) {
                throw new Error('游戏会话不存在');
            }

            const recordId = records.list[0].Id;

            // 更新记录
            const updatedSession = await this.request(`/game_records/${recordId}`, {
                method: 'PATCH',
                body: JSON.stringify({
                    score: updateData.score,
                    game_duration: updateData.game_duration,
                    game_data: JSON.stringify(updateData.game_data || {}),
                    evaluation_ratings: JSON.stringify(updateData.evaluation_ratings || {})
                })
            });

            return {
                success: true,
                session: updatedSession
            };

        } catch (error) {
            console.error('更新游戏会话失败:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // 获取用户游戏记录
    async getUserGameRecords(userId, limit = 10) {
        try {
            const records = await this.request('/game_records', {
                method: 'GET',
                headers: {
                    'where': `(user_id,eq,${userId})`,
                    'sort': '-created_at',
                    'limit': limit.toString()
                }
            });

            return {
                success: true,
                records: records.list || []
            };

        } catch (error) {
            console.error('获取游戏记录失败:', error);
            return {
                success: false,
                error: error.message,
                records: []
            };
        }
    }

    // 获取排行榜
    async getLeaderboard(limit = 10) {
        try {
            const records = await this.request('/game_records', {
                method: 'GET',
                headers: {
                    'sort': '-score',
                    'limit': limit.toString()
                }
            });

            return {
                success: true,
                leaderboard: records.list || []
            };

        } catch (error) {
            console.error('获取排行榜失败:', error);
            return {
                success: false,
                error: error.message,
                leaderboard: []
            };
        }
    }

    // 健康检查
    async healthCheck() {
        try {
            // 使用实际的表ID进行连接测试
            const tableId = 'moudplvavlcwl26'; // 你的players表ID
            const url = `${this.baseURL}/api/v2/tables/${tableId}/records?limit=1`;

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'xc-token': this.apiToken
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.msg || `HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();

            return {
                success: true,
                message: 'NocoDB连接正常',
                timestamp: new Date().toISOString(),
                data: data
            };

        } catch (error) {
            return {
                success: false,
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }
}

// 创建全局NocoDB客户端实例
window.nocoDBClient = new NocoDBClient();
