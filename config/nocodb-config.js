/**
 * NocoDB配置文件
 * 用于配置NocoDB连接参数
 */

// NocoDB配置选项
const NOCODB_CONFIG = {
    // 方案1: NocoDB云服务 (推荐)
    CLOUD: {
        baseURL: 'https://app.nocodb.com',
        projectId: '', // 需要填入实际项目ID
        apiToken: '', // 需要填入实际API Token
        description: 'NocoDB官方云服务，稳定可靠'
    },

    // 方案2: 自建NocoDB服务
    SELF_HOSTED: {
        baseURL: 'https://your-nocodb-domain.com', // 替换为你的NocoDB域名
        projectId: '', // 需要填入实际项目ID
        apiToken: '', // 需要填入实际API Token
        description: '自建NocoDB服务，完全控制'
    },

    // 方案3: 使用IP直接访问（如果有自建服务）
    IP_DIRECT: {
        baseURL: 'http://106.15.184.68:8080', // 假设NocoDB运行在8080端口
        projectId: '', // 需要填入实际项目ID
        apiToken: '', // 需要填入实际API Token
        description: '直接IP访问，绕过域名'
    }
};

// 当前使用的配置
const CURRENT_CONFIG = NOCODB_CONFIG.CLOUD; // 默认使用云服务

// 数据表结构定义
const TABLE_SCHEMAS = {
    users: {
        tableName: 'users',
        fields: [
            { column_name: 'user_id', dt: 'varchar', rqd: true, unique: true },
            { column_name: 'username', dt: 'varchar' },
            { column_name: 'email', dt: 'varchar' },
            { column_name: 'created_at', dt: 'datetime', default: 'CURRENT_TIMESTAMP' },
            { column_name: 'updated_at', dt: 'datetime', default: 'CURRENT_TIMESTAMP' }
        ]
    },
    
    game_records: {
        tableName: 'game_records',
        fields: [
            { column_name: 'user_id', dt: 'varchar', rqd: true },
            { column_name: 'session_id', dt: 'varchar', rqd: true, unique: true },
            { column_name: 'robot_type', dt: 'varchar', rqd: true },
            { column_name: 'score', dt: 'int', rqd: true, default: 0 },
            { column_name: 'game_duration', dt: 'int', default: 0 },
            { column_name: 'game_data', dt: 'longtext' },
            { column_name: 'evaluation_ratings', dt: 'longtext' },
            { column_name: 'created_at', dt: 'datetime', default: 'CURRENT_TIMESTAMP' }
        ]
    }
};

// 导出配置
if (typeof module !== 'undefined' && module.exports) {
    // Node.js环境
    module.exports = {
        NOCODB_CONFIG,
        CURRENT_CONFIG,
        TABLE_SCHEMAS
    };
} else {
    // 浏览器环境
    window.NOCODB_CONFIG = NOCODB_CONFIG;
    window.CURRENT_CONFIG = CURRENT_CONFIG;
    window.TABLE_SCHEMAS = TABLE_SCHEMAS;
}
