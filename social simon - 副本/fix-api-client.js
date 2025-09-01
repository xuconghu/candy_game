/**
 * 糖果小游戏 API 客户端
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
        // 生产环境 - 使用相对路径，让Nginx代理处理
        return '/api';
    }

    // 通用HTTP请求方法
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        };

        try {
            console.log(`🔍 API请求: ${config.method || 'GET'} ${url}`);

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

    // 用户注册
    async register(username) {
        try {
            const response = await this.request('/users/register', {
                method: 'POST',
                body: JSON.stringify({ username })
            });
            
            if (response.success) {
                this.currentUser = response.data;
                this.saveUserToStorage(response.data);
            }
            
            return response;
        } catch (error) {
            console.error('注册失败:', error);
            return { success: false, message: error.message };
        }
    }

    // 用户登录（实际上调用注册端点，后端会处理已存在的用户）
    async login(username) {
        try {
            const response = await this.request('/users/register', {
                method: 'POST',
                body: JSON.stringify({ username })
            });
            
            if (response.success) {
                this.currentUser = response.data;
                this.saveUserToStorage(response.data);
            }
            
            return response;
        } catch (error) {
            console.error('登录失败:', error);
            return { success: false, message: error.message };
        }
    }

    // 用户相关API（兼容旧版本）
    async registerUser(username, email = null) {
        return await this.register(username);
    }

    // 保存用户到本地存储
    saveUserToStorage(userData) {
        try {
            localStorage.setItem('candy_game_user', JSON.stringify(userData));
            console.log('✅ 用户数据已保存到本地存储');
        } catch (error) {
            console.error('保存用户数据失败:', error);
        }
    }

    // 从本地存储加载用户
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

    // 清除用户数据
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
}

// 创建全局API客户端实例
window.apiClient = new ApiClient();
