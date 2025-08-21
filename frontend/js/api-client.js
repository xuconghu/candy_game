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

    // 保存游戏记录
    async saveGameRecord(gameData) {
        try {
            const response = await this.request('/games', {
                method: 'POST',
                body: JSON.stringify(gameData)
            });
            
            return response;
        } catch (error) {
            console.error('保存游戏记录失败:', error);
            return { success: false, message: error.message };
        }
    }

    // 获取排行榜
    async getLeaderboard() {
        try {
            const response = await this.request('/leaderboard');
            return response;
        } catch (error) {
            console.error('获取排行榜失败:', error);
            return { success: false, message: error.message };
        }
    }

    // 获取统计信息
    async getStats() {
        try {
            const response = await this.request('/stats');
            return response;
        } catch (error) {
            console.error('获取统计信息失败:', error);
            return { success: false, message: error.message };
        }
    }

    // 健康检查
    async healthCheck() {
        try {
            const response = await this.request('/health');
            return response;
        } catch (error) {
            console.error('健康检查失败:', error);
            return { success: false, message: error.message };
        }
    }

    // 保存用户信息到本地存储
    saveUserToStorage(user) {
        try {
            localStorage.setItem('candyGameUser', JSON.stringify(user));
        } catch (error) {
            console.warn('无法保存用户信息到本地存储:', error);
        }
    }

    // 从本地存储加载用户信息
    loadUserFromStorage() {
        try {
            const userStr = localStorage.getItem('candyGameUser');
            if (userStr) {
                this.currentUser = JSON.parse(userStr);
                return this.currentUser;
            }
        } catch (error) {
            console.warn('无法从本地存储加载用户信息:', error);
        }
        return null;
    }

    // 清除用户信息
    clearUserFromStorage() {
        try {
            localStorage.removeItem('candyGameUser');
            this.currentUser = null;
        } catch (error) {
            console.warn('无法清除本地存储的用户信息:', error);
        }
    }

    // 获取当前用户
    getCurrentUser() {
        return this.currentUser || this.loadUserFromStorage();
    }

    // 检查是否已登录
    isLoggedIn() {
        return !!this.getCurrentUser();
    }

    // 退出登录
    logout() {
        this.clearUserFromStorage();
        this.currentUser = null;
        this.currentSession = null;
    }

    // 格式化错误消息
    formatError(error) {
        if (typeof error === 'string') {
            return error;
        }
        
        if (error.message) {
            return error.message;
        }
        
        return '未知错误';
    }

    // 检查网络连接
    async checkConnection() {
        try {
            const response = await this.healthCheck();
            return response.success;
        } catch (error) {
            return false;
        }
    }

    // 重试机制
    async requestWithRetry(endpoint, options = {}, maxRetries = 3) {
        let lastError;
        
        for (let i = 0; i < maxRetries; i++) {
            try {
                return await this.request(endpoint, options);
            } catch (error) {
                lastError = error;
                console.warn(`请求失败，正在重试 (${i + 1}/${maxRetries}):`, error.message);
                
                if (i < maxRetries - 1) {
                    // 等待一段时间后重试
                    await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
                }
            }
        }
        
        throw lastError;
    }

    // 批量操作
    async batchRequest(requests) {
        const results = [];
        
        for (const request of requests) {
            try {
                const result = await this.request(request.endpoint, request.options);
                results.push({ success: true, data: result });
            } catch (error) {
                results.push({ success: false, error: error.message });
            }
        }
        
        return results;
    }

    // 获取API状态
    getStatus() {
        return {
            baseURL: this.baseURL,
            currentUser: this.currentUser,
            isLoggedIn: this.isLoggedIn(),
            timestamp: new Date().toISOString()
        };
    }
}

// 创建全局API客户端实例
const apiClient = new ApiClient();

// 页面加载时自动加载用户信息
document.addEventListener('DOMContentLoaded', function() {
    apiClient.loadUserFromStorage();
    console.log('🎮 糖果游戏API客户端已初始化');
    console.log('📊 API状态:', apiClient.getStatus());
});
