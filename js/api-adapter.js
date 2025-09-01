/**
 * API适配器
 * 支持在原始API和NocoDB之间切换
 */
class ApiAdapter {
    constructor() {
        // 检测使用哪种API
        this.useNocoDB = this.shouldUseNocoDB();
        
        if (this.useNocoDB) {
            console.log('🗄️ 使用NocoDB作为数据后端');
            this.client = new NocoDBClient();
        } else {
            console.log('🔧 使用原始API后端');
            this.client = new ApiClient();
        }
    }

    // 判断是否应该使用NocoDB
    shouldUseNocoDB() {
        // 检查URL参数
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('use_nocodb') === 'true') {
            return true;
        }
        
        // 检查本地存储设置
        const setting = localStorage.getItem('use_nocodb');
        if (setting === 'true') {
            return true;
        }
        
        // 检查是否在GitHub Pages且原始API不可用
        if (window.location.hostname.includes('github.io')) {
            // 可以在这里添加原始API可用性检测
            return false; // 默认仍使用代理
        }
        
        return false; // 默认使用原始API
    }

    // 切换API后端
    switchBackend(useNocoDB) {
        this.useNocoDB = useNocoDB;
        localStorage.setItem('use_nocodb', useNocoDB.toString());
        
        if (useNocoDB) {
            this.client = new NocoDBClient();
            console.log('🔄 已切换到NocoDB后端');
        } else {
            this.client = new ApiClient();
            console.log('🔄 已切换到原始API后端');
        }
        
        // 触发重新初始化事件
        window.dispatchEvent(new CustomEvent('apiBackendChanged', {
            detail: { useNocoDB: this.useNocoDB }
        }));
    }

    // 统一的API方法 - 用户相关
    async registerUser(userData) {
        return await this.client.registerUser(userData);
    }

    async loginUser(userId) {
        return await this.client.loginUser(userId);
    }

    // 统一的API方法 - 游戏相关
    async createGameSession(sessionData) {
        return await this.client.createGameSession(sessionData);
    }

    async updateGameSession(sessionId, updateData) {
        return await this.client.updateGameSession(sessionId, updateData);
    }

    async getUserGameRecords(userId, limit = 10) {
        return await this.client.getUserGameRecords(userId, limit);
    }

    async getLeaderboard(limit = 10) {
        return await this.client.getLeaderboard(limit);
    }

    // 健康检查
    async healthCheck() {
        return await this.client.healthCheck();
    }

    // 获取当前后端类型
    getBackendType() {
        return this.useNocoDB ? 'NocoDB' : 'Original API';
    }

    // 获取当前用户
    getCurrentUser() {
        return this.client.currentUser;
    }

    // 获取当前会话
    getCurrentSession() {
        return this.client.currentSession;
    }
}

// 创建全局API适配器实例
window.apiAdapter = new ApiAdapter();

// 为了向后兼容，也创建apiClient别名
window.apiClient = window.apiAdapter;
