# PowerShell脚本：上传文件到服务器
param(
    [string]$ServerIP = "106.15.184.68",
    [string]$Username = "root",
    [string]$Password = "Zj123456"
)

Write-Host "🚀 开始上传文件到服务器..." -ForegroundColor Green

# 创建临时的SSH密钥文件（如果需要）
$frontendFiles = @(
    "frontend\candy_game.html",
    "frontend\js\api-client.js",
    "frontend\admin.html"
)

foreach ($file in $frontendFiles) {
    if (Test-Path $file) {
        Write-Host "📤 上传文件: $file" -ForegroundColor Yellow
        
        # 读取文件内容
        $content = Get-Content $file -Raw -Encoding UTF8
        
        # 获取目标路径
        $targetPath = $file -replace "frontend\\", ""
        $targetPath = $targetPath -replace "\\", "/"
        
        Write-Host "   目标路径: /var/www/candy-game/$targetPath" -ForegroundColor Cyan
        
        # 这里我们需要使用其他方法上传文件
        # 由于没有直接的PowerShell SSH上传工具，我们先跳过
        Write-Host "   ⚠️  需要手动上传此文件" -ForegroundColor Yellow
    } else {
        Write-Host "❌ 文件不存在: $file" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "📋 手动上传步骤:" -ForegroundColor Green
Write-Host "1. 使用WinSCP或其他SFTP工具连接到服务器"
Write-Host "2. 服务器地址: $ServerIP"
Write-Host "3. 用户名: $Username"
Write-Host "4. 上传以下文件到 /var/www/candy-game/ 目录:"
foreach ($file in $frontendFiles) {
    if (Test-Path $file) {
        Write-Host "   - $file"
    }
}
Write-Host ""
Write-Host "🔄 或者，在服务器上直接编辑文件:"
Write-Host "ssh $Username@$ServerIP"
Write-Host "nano /var/www/candy-game/js/api-client.js"
