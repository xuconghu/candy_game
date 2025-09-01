/**
 * 糖果世界游戏 API 客户端
 * 使用 NocoDB 作为数据存储
 */
class ApiClient {
    constructor() {
        // NocoDB 配置
        this.baseURL = 'https://app.nocodb.com';
        this.projectId = 'p1hebvdada8pwye';
        this.apiToken = 'ZfM81BlPlNBZD8tGfanBEIK2LfjnxA9yp1e7m_5f';
        this.playersTableId = 'moudplvavlcwl26';
        this.gameEventsTableId = 'mii4k5ptxhxwzq2'; // 游戏事件表

        // Supabase 配置
        this.supabaseUrl = 'https://zvikkmbaymneaqxyoafh.supabase.co';
        this.supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp2aWtrbWJheW1uZWFxeHlvYWZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY2Njk4NTYsImV4cCI6MjA3MjI0NTg1Nn0.IrUnNCAaXULrsThUgkeMO_ToUq1wO8Cw3xVPbxVq_uw';

        this.currentUser = null;
        this.currentSession = null;
    }

    // NocoDB HTTP请求方法
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
                throw new Error(data.msg || `HTTP ${response.status}: ${response.statusText}`);
            }

            console.log(`✅ NocoDB响应:`, data);
            return data;

        } catch (error) {
            console.error(`❌ NocoDB请求失败:`, error);
            throw error;
        }
    }

    // 获取模拟API响应
    getMockResponse(endpoint, options) {
        const method = options.method || 'GET';

        // 用户查询/注册
        if (endpoint.includes('records') && method === 'GET') {
            return {
                list: [{
                    Id: Date.now(),
                    name: '测试玩家',
                    gender: '男',
                    ID_Number: '123456789012345678',
                    Phone: '13800138000',
                    Time: new Date().toISOString()
                }],
                pageInfo: { totalRows: 1 }
            };
        }

        if (endpoint.includes('records') && method === 'POST') {
            const body = JSON.parse(options.body || '{}');
            return {
                Id: Date.now(),
                name: body.name || '测试玩家',
                gender: body.gender || '男',
                ID_Number: body.ID_Number || '123456789012345678',
                Phone: body.Phone || '13800138000',
                Time: new Date().toISOString()
            };
        }

        // 默认响应
        return {
            success: true,
            message: '模拟API响应'
        };
    }

    // 用户相关API - 从NocoDB查询被试信息
    async findUserByName(name) {
        try {
            // 从NocoDB的players表中查询用户
            const response = await this.request(`${this.playersTableId}/records?where=(name,eq,${encodeURIComponent(name)})`);

            if (response.list && response.list.length > 0) {
                const user = response.list[0];
                this.currentUser = {
                    id: user.Id,
                    name: user.name,
                    gender: user.gender,
                    idNumber: user.ID_Number,
                    phone: user.Phone,
                    registerTime: user.Time,
                    dayCount: user.Days || 1,
                    selectedRobot: user.robot || null,
                    user_id: `user_${user.Id}`
                };

                // 保存到本地存储
                localStorage.setItem('candy_game_user', JSON.stringify(this.currentUser));
                console.log('✅ 找到用户:', this.currentUser);

                return {
                    success: true,
                    data: this.currentUser
                };
            } else {
                return {
                    success: false,
                    error: '未找到该用户，请检查姓名是否正确'
                };
            }
        } catch (error) {
            console.error('查询用户失败:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // 注册新用户到NocoDB
    async registerUser(name, gender = null, idNumber = null, phone = null) {
        try {
            const userData = {
                name: name,
                gender: gender || '',
                ID_Number: idNumber || '',
                Phone: phone || '',
                Time: new Date().toISOString(),
                Days: 1,  // 新用户默认第1天
                robot: null  // 新用户默认未选择机器人
            };

            const response = await this.request(`${this.playersTableId}/records`, {
                method: 'POST',
                body: JSON.stringify(userData)
            });

            this.currentUser = {
                id: response.Id,
                name: response.name,
                gender: response.gender,
                idNumber: response.ID_Number,
                phone: response.Phone,
                registerTime: response.Time,
                dayCount: response.Days || 1,
                selectedRobot: response.robot || null,
                user_id: `user_${response.Id}`
            };

            // 保存到本地存储
            localStorage.setItem('candy_game_user', JSON.stringify(this.currentUser));
            console.log('✅ 用户注册成功:', this.currentUser);

            return {
                success: true,
                data: this.currentUser
            };
        } catch (error) {
            console.error('用户注册失败:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // 更新用户的机器人选择
    async updateUserRobot(userId, robotType) {
        try {
            console.log('🔄 开始更新用户机器人选择:', {
                userId: userId,
                robotType: robotType
            });

            // 使用NocoDB的单记录更新API
            const updateData = {
                Id: userId,
                robot: robotType
            };

            const response = await this.request(`${this.playersTableId}/records`, {
                method: 'PATCH',
                body: JSON.stringify([updateData])  // 注意：需要传递数组
            });

            console.log('✅ 更新用户机器人选择成功:', response);

            // 更新本地用户信息
            if (this.currentUser && this.currentUser.id == userId) {
                this.currentUser.selectedRobot = robotType;
                localStorage.setItem('candy_game_user', JSON.stringify(this.currentUser));
                console.log('📱 本地用户信息已更新');
            }

            return {
                success: true,
                data: response
            };
        } catch (error) {
            console.error('❌ 更新用户机器人选择失败:', error);
            console.error('错误详情:', {
                message: error.message,
                userId: userId,
                robotType: robotType
            });
            return {
                success: false,
                error: error.message
            };
        }
    }

    // 用户登录（查找现有用户）
    async login(username) {
        return await this.findUserByName(username);
    }

    // 用户注册（创建新用户）
    async register(username) {
        return await this.registerUser(username);
    }

    // 获取所有用户列表
    async getAllUsers() {
        try {
            const response = await this.request(`${this.playersTableId}/records`);
            return {
                success: true,
                users: response.list || []
            };
        } catch (error) {
            console.error('获取用户列表失败:', error);
            return {
                success: false,
                error: error.message,
                users: []
            };
        }
    }

    // 游戏相关API - 简化版本
    async startGameSession(user_id, robot_type) {
        // 创建简单的游戏会话
        this.currentSession = {
            session_id: 'session_' + Date.now(),
            user_id: user_id,
            robot_type: robot_type,
            created_at: new Date().toISOString()
        };

        console.log('✅ 游戏会话创建成功:', this.currentSession);
        return {
            success: true,
            data: this.currentSession
        };
    }

    // 上传CSV文件到云服务器
    async uploadCSVFile(csvData, filename, userInfo) {
        try {
            console.log('📤 开始上传CSV文件到云服务器:', filename);

            // 创建CSV Blob
            const csvBlob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });

            // 准备表单数据
            const formData = new FormData();
            formData.append('csvFile', csvBlob, filename);
            formData.append('userName', userInfo.name || '');
            formData.append('userGender', userInfo.gender || '');
            formData.append('userId', userInfo.id || '');
            formData.append('uploadTime', new Date().toISOString());

            // 发送到您的云服务器API
            const response = await fetch('http://106.15.184.68/api/upload-csv', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error(`上传失败: ${response.status} ${response.statusText}`);
            }

            const result = await response.json();
            console.log('✅ CSV文件上传成功:', result);

            return {
                success: true,
                data: result
            };

        } catch (error) {
            console.error('❌ CSV文件上传失败:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // 上传JSON文件到云服务器
    async uploadJSONFile(jsonData, filename, userInfo) {
        try {
            console.log('📤 开始上传JSON文件到云服务器:', filename);

            // 创建JSON Blob
            const jsonBlob = new Blob([JSON.stringify(jsonData, null, 2)], {
                type: 'application/json;charset=utf-8;'
            });

            // 准备表单数据
            const formData = new FormData();
            formData.append('jsonFile', jsonBlob, filename);
            formData.append('userName', userInfo.name || '');
            formData.append('userGender', userInfo.gender || '');
            formData.append('userId', userInfo.id || '');
            formData.append('uploadTime', new Date().toISOString());
            formData.append('fileType', 'game_data');
            formData.append('totalEvents', jsonData.metadata?.totalEvents || 0);

            // 发送到云服务器API（需要新的接口）
            const response = await fetch('http://106.15.184.68/api/upload-json', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error(`上传失败: ${response.status} ${response.statusText}`);
            }

            const result = await response.json();
            console.log('✅ JSON文件上传成功:', result);

            return {
                success: true,
                data: result
            };

        } catch (error) {
            console.error('❌ JSON文件上传失败:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // 从云服务器获取CSV文件列表
    async getCSVFileList() {
        try {
            const response = await fetch('/api/csv-files');

            if (!response.ok) {
                throw new Error(`获取文件列表失败: ${response.status} ${response.statusText}`);
            }

            const result = await response.json();
            return {
                success: true,
                files: result.files || []
            };

        } catch (error) {
            console.error('❌ 获取CSV文件列表失败:', error);
            return {
                success: false,
                error: error.message,
                files: []
            };
        }
    }

    // 从云服务器下载CSV文件
    async downloadCSVFile(filename) {
        try {
            const response = await fetch(`/api/download-csv/${encodeURIComponent(filename)}`);

            if (!response.ok) {
                throw new Error(`下载失败: ${response.status} ${response.statusText}`);
            }

            const blob = await response.blob();

            // 创建下载链接
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            return {
                success: true,
                message: '文件下载成功'
            };

        } catch (error) {
            console.error('❌ 下载CSV文件失败:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // 记录游戏事件（本地存储，等待批量上传）
    async recordGameEvent(event_type, event_data = {}) {
        const event = {
            timestamp: new Date().toISOString(),
            event_type: event_type,
            candy_color: event_data.candyColor || '',
            candy_position: event_data.candyPosition || '',
            candy_grid_index: event_data.candyIndex || null,
            key_pressed: event_data.keyPressed || '',
            reaction_time_ms: event_data.reactionTime || null,
            score_change: event_data.scoreChange || 0,
            is_correct: event_data.isCorrect ? 'true' : 'false',
            current_total_score: event_data.currentScore || 0,
            Q1: event_data.Q1 || null,
            Q2: event_data.Q2 || null,
            Q3: event_data.Q3 || null,
            Q4: event_data.Q4 || null,
            Q5: event_data.Q5 || null
        };

        console.log('📝 本地记录游戏事件:', event);

        // 保存到本地存储，等待批量上传
        let gameEvents = JSON.parse(localStorage.getItem('candy_game_events_pending') || '[]');
        gameEvents.push(event);
        localStorage.setItem('candy_game_events_pending', JSON.stringify(gameEvents));

        return { success: true, event: event };
    }

    // 自动上传游戏数据JSON到NocoDB
    async uploadGameDataJSON(userName, evaluationRatings = {}) {
        // 获取本地存储的所有事件
        let gameEvents = JSON.parse(localStorage.getItem('candy_game_events_pending') || '[]');

        if (gameEvents.length === 0) {
            console.log('📝 没有游戏事件数据');
            return { success: false, message: '没有数据可上传' };
        }

        // 构造完整的游戏数据
        const gameData = {
            metadata: {
                playerName: userName || '未知用户',
                sessionId: this.currentSession?.session_id || `session_${Date.now()}`,
                gameStartTime: gameEvents.length > 0 ? gameEvents[0].timestamp : new Date().toISOString(),
                gameEndTime: new Date().toISOString(),
                totalEvents: gameEvents.length,
                exportTime: new Date().toISOString()
            },
            evaluationRatings: evaluationRatings,
            gameEvents: gameEvents
        };

        console.log('📝 准备上传游戏数据JSON到NocoDB:', gameData);

        // 获取用户天数和机器人信息
        const dayCount = this.currentUser?.dayCount || 1;
        const robotType = gameData.game_data?.selectedRobot || 'robot1';
        const robotName = robotType === 'robot1' ? '波波' : '可乐方';

        // 生成文件名：用户名+第几天+时间+机器人名字
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        const filename = `${userName || 'unknown'}_第${dayCount}天_${timestamp}_${robotName}.json`;

        // 构造NocoDB记录 - 将整个JSON作为一条记录上传
        const nocoRecord = {
            Name: userName || '未知用户', // 用户姓名
            Timestamp: new Date().toISOString(),
            event_type: 'complete_game_data',
            candy_color: '', // 留空
            candy_position: '', // 留空
            candy_grid_index: gameData.metadata.totalEvents, // 用这个字段存储事件总数
            key_pressed: filename, // 用这个字段存储文件名
            reaction_time_ms: null, // 留空
            score_change: 0, // 留空
            is_correct: 'complete', // 标记为完整数据
            current_total_score: gameData.gameEvents.reduce((sum, event) => sum + (event.score_change || 0), 0), // 总分
            Q1: evaluationRatings.Q1 || null,
            Q2: evaluationRatings.Q2 || null,
            Q3: evaluationRatings.Q3 || null,
            Q4: evaluationRatings.Q4 || null,
            Q5: evaluationRatings.Q5 || null
        };

        try {
            // 1. 上传汇总数据到NocoDB
            const nocoResponse = await this.request(`${this.gameEventsTableId}/records`, {
                method: 'POST',
                body: JSON.stringify(nocoRecord)
            });

            console.log('✅ 游戏汇总数据已上传到NocoDB:', nocoResponse);

            // 2. 上传完整JSON文件到云服务器
            const userInfo = {
                name: userName,
                gender: '', // 如果有的话可以传入
                id: this.currentUser?.user_id || ''
            };

            const cloudUploadResult = await this.uploadJSONFile(gameData, filename, userInfo);

            // 3. 同时下载JSON文件作为本地备份
            const jsonString = JSON.stringify(gameData, null, 2);
            const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8;' });

            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            // 清除本地存储
            localStorage.removeItem('candy_game_events_pending');
            console.log('✅ 本地待上传事件已清除');

            return {
                success: true,
                filename: filename,
                totalEvents: gameEvents.length,
                nocoResponse: nocoResponse,
                cloudUploadResult: cloudUploadResult,
                message: `游戏数据已上传到NocoDB和云服务器，并下载备份文件 ${filename}`
            };

        } catch (error) {
            console.error('❌ 上传游戏数据到NocoDB失败:', error);

            // 失败时仍然下载JSON文件
            const jsonString = JSON.stringify(gameData, null, 2);
            const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8;' });

            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            return {
                success: false,
                error: error.message,
                filename: filename,
                totalEvents: gameEvents.length,
                message: `上传失败，但已下载备份文件 ${filename}`
            };
        }
    }

    // 上传游戏数据文件到 Supabase
    async uploadGameData(blob, filename) {
        try {
            console.log('📤 开始上传游戏数据到 Supabase:', filename);

            // 初始化 Supabase 客户端
            if (!window.supabase) {
                throw new Error('Supabase 客户端未加载');
            }

            const supabase = window.supabase.createClient(this.supabaseUrl, this.supabaseKey, {
                auth: {
                    persistSession: false,
                    autoRefreshToken: false
                }
            });

            // 读取 blob 内容
            const text = await blob.text();
            const gameData = JSON.parse(text);

            // 准备上传到 Supabase 的数据
            const uploadData = {
                content: gameData,
                user_name: this.currentUser?.name || '未知用户',
                upload_time: new Date().toISOString()
            };

            // 上传到 Supabase
            const { data, error } = await supabase
                .from('uploads')
                .insert(uploadData)
                .select();

            if (error) {
                console.error('Supabase 上传错误:', error);
                throw new Error(`Supabase 上传失败: ${error.message}`);
            }

            console.log('✅ 游戏数据上传到 Supabase 成功:', data);

            return {
                success: true,
                data: data[0],
                message: '游戏数据已成功上传到 Supabase'
            };

        } catch (error) {
            console.error('❌ 上传游戏数据到 Supabase 失败:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // 完成游戏并自动上传JSON数据到 Supabase
    async completeGame(gameData) {
        console.log('✅ 游戏完成，准备上传JSON数据到 Supabase:', gameData);
        console.log('🔍 游戏事件数量:', gameData.game_data?.gameEvents?.length || 0);
        console.log('🔍 当前用户信息:', this.currentUser);
        console.log('🔍 游戏中玩家名:', gameData.game_data?.playerName);

        try {
            // 初始化 Supabase 客户端
            if (!window.supabase) {
                throw new Error('Supabase 客户端未加载');
            }

            const supabase = window.supabase.createClient(this.supabaseUrl, this.supabaseKey, {
                auth: {
                    persistSession: false,
                    autoRefreshToken: false
                }
            });

            // 获取用户姓名 - 优先使用登录用户名，其次是游戏中设置的名字
            const userName = this.currentUser?.name || gameData.game_data?.playerName || '未知用户';

            // 获取用户天数和机器人信息
            const dayCount = this.currentUser?.dayCount || 1;
            const robotType = gameData.game_data?.selectedRobot || 'robot1';
            const robotName = robotType === 'robot1' ? '波波' : '可乐方';

            // 生成文件名：用户名+第几天+时间+机器人名字
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
            const filename = `${userName}_第${dayCount}天_${timestamp}_${robotName}.json`;

            // 准备完整的游戏数据
            const completeData = {
                metadata: {
                    playerName: userName,
                    sessionId: gameData.game_data?.sessionId || `session_${Date.now()}`,
                    gameStartTime: gameData.game_data?.startTime || new Date().toISOString(),
                    gameEndTime: new Date().toISOString(),
                    exportTime: new Date().toISOString(),
                    finalScore: gameData.score || 0,
                    gameDuration: gameData.game_duration || 0,
                    totalEvents: gameData.game_data?.gameEvents?.length || 0
                },
                gameData: {
                    ...gameData.game_data,
                    gameEvents: gameData.game_data?.gameEvents || [],
                    playerName: userName,
                    finalScore: gameData.score || 0
                },
                // evaluationRatings 已经在 gameData.game_data 中，不需要重复
                score: gameData.score || 0,
                gameDuration: gameData.game_duration || 0
            };

            // 准备上传到 Supabase 的数据
            const uploadData = {
                content: completeData,
                user_name: userName,
                upload_time: new Date().toISOString()
            };

            // 上传到 Supabase
            const { data, error } = await supabase
                .from('uploads')
                .insert(uploadData)
                .select();

            if (error) {
                console.error('Supabase 上传错误:', error);
                throw new Error(`Supabase 上传失败: ${error.message}`);
            }

            console.log('✅ 完整游戏数据上传到 Supabase 成功:', data);

            // 清除当前会话
            this.currentSession = null;

            return {
                success: true,
                data: data[0],
                filename: filename,
                message: `游戏数据已成功上传到 Supabase: ${filename}`
            };

        } catch (error) {
            console.error('❌ 上传完整游戏数据到 Supabase 失败:', error);

            // 清除当前会话
            this.currentSession = null;

            return {
                success: false,
                error: error.message,
                message: `上传失败: ${error.message}`
            };
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

    // 健康检查 - 测试NocoDB连接
    async healthCheck() {
        try {
            const response = await this.request(`${this.playersTableId}/records?limit=1`);
            console.log('✅ NocoDB连接检查通过:', response);
            return {
                success: true,
                message: 'NocoDB连接正常',
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('❌ NocoDB连接检查失败:', error);
            return {
                success: false,
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }
}

// 创建全局API客户端实例
window.apiClient = new ApiClient();
