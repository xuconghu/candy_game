/**
 * 糖果世界游戏 API 客户端
 * 负责与后端服务器通信
 */
class ApiClient {
    constructor() {
        // 根据环境设置API基础URL
        this.baseURL = this.getBaseURL();
        this.currentUser = null;
        this.currentSession = null;
    }

    // 获取API基础URL
    getBaseURL() {
        // 开发环境
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            return 'http://localhost:3000/api';
        }
        // 生产环境 - 使用阿里云服务器IP
        return 'http://106.15.184.68/api';
    }

    // 通用HTTP请求方法
    async request(endpoint, options = {}) {
        // 本地测试模式：返回模拟数据
        if (window.LOCAL_TEST_MODE) {
            console.log(`🔧 本地测试模式 - 模拟API请求: ${options.method || 'GET'} ${endpoint}`);
            return this.getMockResponse(endpoint, options);
        }

        const url = `${this.baseURL}${endpoint}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        };

        try {
            console.log(`🌐 API请求: ${config.method || 'GET'} ${url}`);

            const response = await fetch(url, config);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || `HTTP ${response.status}`);
            }

            console.log(`✅ API响应:`, data);
            return data;

        } catch (error) {
            console.error(`❌ API请求失败:`, error);
            throw error;
        }
    }

    // 获取模拟API响应
    getMockResponse(endpoint, options) {
        const method = options.method || 'GET';

        // 用户注册
        if (endpoint === '/users/register' && method === 'POST') {
            const body = JSON.parse(options.body || '{}');
            return {
                success: true,
                data: {
                    user_id: 'test-user-' + Date.now(),
                    username: body.username || '测试玩家',
                    created_at: new Date().toISOString()
                }
            };
        }

        // 开始游戏会话
        if (endpoint === '/games/start' && method === 'POST') {
            const body = JSON.parse(options.body || '{}');
            return {
                success: true,
                data: {
                    session_id: 'test-session-' + Date.now(),
                    user_id: body.user_id || 'test-user',
                    robot_type: body.robot_type || 'robot1',
                    created_at: new Date().toISOString()
                }
            };
        }

        // 记录游戏事件
        if (endpoint === '/games/events' && method === 'POST') {
            return {
                success: true,
                message: '事件记录成功'
            };
        }

        // 结束游戏会话
        if (endpoint.includes('/games/') && endpoint.includes('/end') && method === 'POST') {
            return {
                success: true,
                message: '游戏会话结束'
            };
        }

        // 默认响应
        return {
            success: true,
            message: '模拟API响应'
        };
    }

    // 用户相关API
    async registerUser(username, email = null) {
        try {
            const response = await this.request('/users/register', {
                method: 'POST',
                body: JSON.stringify({ username, email })
            });

            if (response.success) {
                this.currentUser = response.data;
                // 保存到本地存储
                localStorage.setItem('candy_game_user', JSON.stringify(this.currentUser));
                console.log('✅ 用户注册成功:', this.currentUser);
            }

            return response;
        } catch (error) {
            console.error('用户注册失败:', error);
            throw error;
        }
    }

    // 用户登录（实际上是注册或获取现有用户）
    async login(username) {
        return await this.registerUser(username);
    }

    // 用户注册（与登录相同，因为后端会自动处理）
    async register(username) {
        return await this.registerUser(username);
    }

    // 获取用户信息
    async getUser(user_id) {
        try {
            const response = await this.request(`/users/${user_id}`);
            return response;
        } catch (error) {
            console.error('获取用户信息失败:', error);
            throw error;
        }
    }

    // 获取用户游戏记录
    async getUserGameRecords(user_id, limit = 10) {
        try {
            const response = await this.request(`/users/${user_id}/games?limit=${limit}`);
            return response;
        } catch (error) {
            console.error('获取用户游戏记录失败:', error);
            throw error;
        }
    }

    // 获取用户统计信息
    async getUserStats(user_id) {
        try {
            const response = await this.request(`/users/${user_id}/stats`);
            return response;
        } catch (error) {
            console.error('获取用户统计信息失败:', error);
            throw error;
        }
    }

    // 游戏相关API
    async startGameSession(user_id, robot_type) {
        try {
            const response = await this.request('/games/start', {
                method: 'POST',
                body: JSON.stringify({ user_id, robot_type })
            });

            if (response.success) {
                this.currentSession = response.data;
                console.log('✅ 游戏会话创建成功:', this.currentSession);
            }

            return response;
        } catch (error) {
            console.error('创建游戏会话失败:', error);
            throw error;
        }
    }

    // 记录游戏事件
    async recordGameEvent(event_type, event_data = {}) {
        if (!this.currentSession) {
            console.warn('⚠️ 没有活动的游戏会话，跳过事件记录');
            return;
        }

        try {
            const response = await this.request('/games/events', {
                method: 'POST',
                body: JSON.stringify({
                    session_id: this.currentSession.session_id,
                    event_type,
                    event_data
                })
            });

            return response;
        } catch (error) {
            console.error('记录游戏事件失败:', error);
            // 不抛出错误，避免影响游戏流程
        }
    }

    // 完成游戏并保存数据
    async completeGame(gameData) {
        if (!this.currentSession || !this.currentUser) {
            throw new Error('缺少游戏会话或用户信息');
        }

        try {
            const response = await this.request('/games/complete', {
                method: 'POST',
                body: JSON.stringify({
                    user_id: this.currentUser.user_id,
                    session_id: this.currentSession.session_id,
                    robot_type: this.currentSession.robot_type,
                    ...gameData
                })
            });

            if (response.success) {
                console.log('✅ 游戏数据保存成功');
                // 清除当前会话
                this.currentSession = null;
            }

            return response;
        } catch (error) {
            console.error('保存游戏数据失败:', error);
            throw error;
        }
    }

    // 上传游戏数据文件
    async uploadGameData(gameDataBlob, filename) {
        if (!this.currentSession || !this.currentUser) {
            throw new Error('缺少游戏会话或用户信息');
        }

        try {
            const formData = new FormData();
            formData.append('gameData', gameDataBlob, filename);
            formData.append('user_id', this.currentUser.user_id);
            formData.append('session_id', this.currentSession.session_id);

            const response = await this.request('/games/upload', {
                method: 'POST',
                body: formData,
                headers: {} // 让浏览器自动设置Content-Type
            });

            return response;
        } catch (error) {
            console.error('上传游戏数据失败:', error);
            throw error;
        }
    }

    // 本地存储管理
    loadUserFromStorage() {
        try {
            const userData = localStorage.getItem('candy_game_user');
            if (userData) {
                this.currentUser = JSON.parse(userData);
                console.log('✅ 从本地存储加载用户:', this.currentUser);
                return this.currentUser;
            }
        } catch (error) {
            console.error('加载本地用户数据失败:', error);
        }
        return null;
    }

    clearUserData() {
        this.currentUser = null;
        this.currentSession = null;
        localStorage.removeItem('candy_game_user');
        console.log('✅ 用户数据已清除');
    }

    // 健康检查
    async healthCheck() {
        try {
            const response = await this.request('/health');
            console.log('✅ 服务器健康检查通过:', response);
            return response;
        } catch (error) {
            console.error('❌ 服务器健康检查失败:', error);
            throw error;
        }
    }
}

// 创建全局API客户端实例
window.apiClient = new ApiClient();
