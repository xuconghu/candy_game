# 🍬 糖果游戏 (Candy Game)

一个基于Web的人机协作糖果点击游戏，支持数据收集和分析。

## 🎮 在线游戏

**直接访问游戏：** [https://xuconghu.github.io/candy_game/](https://xuconghu.github.io/candy_game/)

## 🎯 游戏特色

- **人机协作**：玩家与AI机器人协作完成游戏
- **实时数据收集**：记录所有按键、反应时间和游戏事件
- **多种机器人**：选择不同的AI伙伴（波波/可乐方）
- **完整评价系统**：游戏结束后的主观评价问卷
- **数据导出**：支持CSV和JSON格式的数据导出

## 🎲 游戏规则

1. **目标**：在5分钟内尽可能多地点击正确颜色的糖果
2. **分工**：
   - 玩家负责：红色(Q键)、浅绿色(W键)、粉色(E键)
   - 机器人负责：蓝色(7键)、黄色(8键)、深绿色(9键)
3. **评分**：反应越快分数越高，错误按键会扣分

## 📊 数据收集

游戏会自动收集以下数据：
- 所有按键事件和反应时间
- 游戏表现和得分
- 用户对机器人的主观评价
- 完整的游戏会话信息

## 🔧 技术特性

- **前端**：纯HTML5/CSS3/JavaScript
- **数据存储**：Supabase云数据库
- **部署**：GitHub Pages
- **兼容性**：支持现代浏览器

## 📁 项目结构

```
candy_game/
├── index.html              # 入口页面（重定向）
├── github-version/         # 主要游戏文件
│   ├── index.html         # 游戏主页面
│   ├── js/
│   │   └── api-client.js  # API客户端
│   ├── image/             # 游戏资源
│   └── config/            # 配置文件
└── README.md              # 项目说明
```

## 🚀 本地运行

1. 克隆仓库：
```bash
git clone https://github.com/xuconghu/candy_game.git
```

2. 进入项目目录：
```bash
cd candy_game
```

3. 使用本地服务器运行：
```bash
# 使用Python
python -m http.server 8000

# 或使用Node.js
npx serve .
```

4. 访问 `http://localhost:8000`

## 📈 数据格式

### 文件命名格式
- JSON: `用户名_第X天_时间_机器人名字.json`
- CSV: `用户名_第X天_时间_机器人名字.csv`

### 数据内容
- 游戏事件详情（按键、反应时间等）
- 用户信息和游戏设置
- 主观评价结果

## 🤝 贡献

欢迎提交Issue和Pull Request来改进游戏！

## 📄 许可证

MIT License
