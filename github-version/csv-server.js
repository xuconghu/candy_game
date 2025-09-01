const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// 确保上传目录存在
const UPLOAD_DIR = path.join(__dirname, 'csv-uploads');
async function ensureUploadDir() {
    try {
        await fs.access(UPLOAD_DIR);
    } catch {
        await fs.mkdir(UPLOAD_DIR, { recursive: true });
        console.log('📁 创建上传目录:', UPLOAD_DIR);
    }
}

// 配置multer用于文件上传
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, UPLOAD_DIR);
    },
    filename: function (req, file, cb) {
        // 保持原始文件名，但添加时间戳避免冲突
        const timestamp = Date.now();
        const originalName = Buffer.from(file.originalname, 'latin1').toString('utf8');
        cb(null, `${timestamp}_${originalName}`);
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB限制
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
            cb(null, true);
        } else {
            cb(new Error('只允许上传CSV文件'));
        }
    }
});

// API路由

// 上传CSV文件
app.post('/api/upload-csv', upload.single('csvFile'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: '没有上传文件' });
        }

        const { userName, userGender, userId, uploadTime } = req.body;
        
        // 获取文件信息
        const fileStats = await fs.stat(req.file.path);
        
        // 创建文件元数据
        const fileMetadata = {
            filename: req.file.filename,
            originalName: req.file.originalname,
            size: fileStats.size,
            uploadTime: uploadTime || new Date().toISOString(),
            userName: userName || '未知用户',
            userGender: userGender || '',
            userId: userId || '',
            path: req.file.path
        };

        // 保存元数据到JSON文件
        const metadataPath = path.join(UPLOAD_DIR, `${req.file.filename}.meta.json`);
        await fs.writeFile(metadataPath, JSON.stringify(fileMetadata, null, 2));

        console.log('✅ CSV文件上传成功:', fileMetadata);

        res.json({
            success: true,
            message: 'CSV文件上传成功',
            data: {
                filename: req.file.filename,
                originalName: req.file.originalname,
                size: fileStats.size,
                uploadTime: fileMetadata.uploadTime
            }
        });

    } catch (error) {
        console.error('❌ CSV文件上传失败:', error);
        
        // 删除上传的文件（如果存在）
        if (req.file && req.file.path) {
            try {
                await fs.unlink(req.file.path);
            } catch (unlinkError) {
                console.error('删除失败的上传文件时出错:', unlinkError);
            }
        }

        res.status(500).json({ 
            error: error.message || 'CSV文件上传失败' 
        });
    }
});

// 获取CSV文件列表
app.get('/api/csv-files', async (req, res) => {
    try {
        const files = await fs.readdir(UPLOAD_DIR);
        const csvFiles = files.filter(file => file.endsWith('.csv'));
        
        const fileList = [];
        
        for (const filename of csvFiles) {
            try {
                const filePath = path.join(UPLOAD_DIR, filename);
                const metadataPath = path.join(UPLOAD_DIR, `${filename}.meta.json`);
                
                // 获取文件统计信息
                const fileStats = await fs.stat(filePath);
                
                // 尝试读取元数据
                let metadata = {};
                try {
                    const metadataContent = await fs.readFile(metadataPath, 'utf8');
                    metadata = JSON.parse(metadataContent);
                } catch (metaError) {
                    // 如果没有元数据文件，使用默认值
                    console.warn(`没有找到元数据文件: ${metadataPath}`);
                }

                fileList.push({
                    filename: filename,
                    originalName: metadata.originalName || filename,
                    size: fileStats.size,
                    uploadTime: metadata.uploadTime || fileStats.birthtime.toISOString(),
                    created_at: fileStats.birthtime.toISOString(),
                    modified_at: fileStats.mtime.toISOString(),
                    userName: metadata.userName || '未知用户',
                    userGender: metadata.userGender || '',
                    userId: metadata.userId || ''
                });
            } catch (fileError) {
                console.error(`处理文件 ${filename} 时出错:`, fileError);
            }
        }

        // 按上传时间倒序排列
        fileList.sort((a, b) => new Date(b.uploadTime) - new Date(a.uploadTime));

        res.json({
            success: true,
            files: fileList,
            total: fileList.length
        });

    } catch (error) {
        console.error('❌ 获取CSV文件列表失败:', error);
        res.status(500).json({ 
            error: '获取文件列表失败' 
        });
    }
});

// 下载CSV文件
app.get('/api/download-csv/:filename', async (req, res) => {
    try {
        const filename = decodeURIComponent(req.params.filename);
        const filePath = path.join(UPLOAD_DIR, filename);
        
        // 检查文件是否存在
        try {
            await fs.access(filePath);
        } catch {
            return res.status(404).json({ error: '文件不存在' });
        }

        // 设置响应头
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
        
        // 发送文件
        res.sendFile(filePath);

    } catch (error) {
        console.error('❌ 下载CSV文件失败:', error);
        res.status(500).json({ 
            error: '下载文件失败' 
        });
    }
});

// 删除CSV文件
app.delete('/api/delete-csv/:filename', async (req, res) => {
    try {
        const filename = decodeURIComponent(req.params.filename);
        const filePath = path.join(UPLOAD_DIR, filename);
        const metadataPath = path.join(UPLOAD_DIR, `${filename}.meta.json`);
        
        // 删除CSV文件
        try {
            await fs.unlink(filePath);
        } catch (error) {
            if (error.code !== 'ENOENT') {
                throw error;
            }
        }

        // 删除元数据文件
        try {
            await fs.unlink(metadataPath);
        } catch (error) {
            if (error.code !== 'ENOENT') {
                console.warn('删除元数据文件失败:', error);
            }
        }

        console.log('✅ CSV文件删除成功:', filename);

        res.json({
            success: true,
            message: '文件删除成功'
        });

    } catch (error) {
        console.error('❌ 删除CSV文件失败:', error);
        res.status(500).json({ 
            error: '删除文件失败' 
        });
    }
});

// 获取存储统计信息
app.get('/api/storage-stats', async (req, res) => {
    try {
        const files = await fs.readdir(UPLOAD_DIR);
        const csvFiles = files.filter(file => file.endsWith('.csv'));
        
        let totalSize = 0;
        let todayCount = 0;
        const today = new Date().toDateString();

        for (const filename of csvFiles) {
            try {
                const filePath = path.join(UPLOAD_DIR, filename);
                const fileStats = await fs.stat(filePath);
                
                totalSize += fileStats.size;
                
                if (fileStats.birthtime.toDateString() === today) {
                    todayCount++;
                }
            } catch (error) {
                console.error(`获取文件 ${filename} 统计信息失败:`, error);
            }
        }

        res.json({
            success: true,
            stats: {
                totalFiles: csvFiles.length,
                totalSize: totalSize,
                todayFiles: todayCount,
                uploadDir: UPLOAD_DIR
            }
        });

    } catch (error) {
        console.error('❌ 获取存储统计失败:', error);
        res.status(500).json({ 
            error: '获取统计信息失败' 
        });
    }
});

// 健康检查
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// 错误处理中间件
app.use((error, req, res, next) => {
    console.error('服务器错误:', error);
    res.status(500).json({ 
        error: error.message || '服务器内部错误' 
    });
});

// 启动服务器
async function startServer() {
    try {
        await ensureUploadDir();
        
        app.listen(PORT, () => {
            console.log(`🚀 CSV文件服务器启动成功!`);
            console.log(`📡 服务地址: http://localhost:${PORT}`);
            console.log(`📁 上传目录: ${UPLOAD_DIR}`);
            console.log(`🎮 游戏地址: http://localhost:${PORT}/index.html`);
            console.log(`📊 文件管理: http://localhost:${PORT}/csv-manager.html`);
        });
    } catch (error) {
        console.error('❌ 启动服务器失败:', error);
        process.exit(1);
    }
}

startServer();
