const express = require('express');
const crypto = require('crypto');
const WebSocket = require('ws');
const cors = require('cors');
const axios = require('axios');
const sqlite3 = require('sqlite3').verbose();
const { v4: uuidv4 } = require('uuid');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// 数据库初始化
const dbPath = path.join(__dirname, 'memoirs.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('数据库连接失败:', err.message);
    } else {
        console.log('✅ SQLite数据库连接成功');
        initDatabase();
    }
});

// 初始化数据库表
function initDatabase() {
    const createMemoirsTable = `
        CREATE TABLE IF NOT EXISTS memoirs (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            content TEXT NOT NULL,
            theme TEXT NOT NULL,
            style TEXT NOT NULL,
            word_count INTEGER,
            conversation_data TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            user_id TEXT,
            is_public BOOLEAN DEFAULT 0,
            views INTEGER DEFAULT 0
        )
    `;
    
    db.run(createMemoirsTable, (err) => {
        if (err) {
            console.error('创建memoirs表失败:', err.message);
        } else {
            console.log('✅ memoirs表就绪');
        }
    });
}

// 中间件
app.use(cors());
app.use(express.json());

// 环境变量配置
const IFLYTEK_APPID = process.env.IFLYTEK_APPID;
const IFLYTEK_API_KEY = process.env.IFLYTEK_API_KEY;
const IFLYTEK_API_SECRET = process.env.IFLYTEK_API_SECRET;
const MOONSHOT_API_KEY = process.env.MOONSHOT_API_KEY;

// 智能提示词配置
const MEMOIR_CONFIG = {
    // 每个主题的问答轮次配置
    questionLimits: {
        '童年时光': 8,
        '求学之路': 6, 
        '工作经历': 7,
        '情感生活': 6,
        '时代记忆': 8,
        '生活感悟': 5
    },
    
    // 写作风格配置
    writingStyles: {
        'warm': {
            name: '温馨怀旧',
            description: '温暖亲切的叙述，充满怀念之情',
            tone: '温暖、亲切、怀念',
            keywords: ['温馨', '回忆', '珍贵', '美好', '难忘']
        },
        'vivid': {
            name: '生动叙述',
            description: '详细生动的描述，如临其境',
            tone: '生动、详细、形象',
            keywords: ['生动', '清晰', '仿佛', '历历在目', '栩栩如生']
        },
        'poetic': {
            name: '诗意抒情',
            description: '富有诗意的表达，情感丰富',
            tone: '诗意、抒情、深刻',
            keywords: ['如诗', '深情', '悠远', '意境', '情怀']
        },
        'simple': {
            name: '朴实真挚',
            description: '朴素真实的表达，平实感人',
            tone: '朴实、真挚、自然',
            keywords: ['朴实', '真挚', '平凡', '真实', '感人']
        }
    }
};

// 深度引导问题库
const QUESTION_LIBRARY = {
    '童年时光': {
        opening: [
            "您还记得小时候最快乐的一天是什么样的吗？",
            "您小时候最喜欢的游戏或玩具是什么？",
            "您童年时最要好的朋友是谁？能说说你们的故事吗？"
        ],
        deepening: [
            "那个时候，您的家是什么样子的？有什么特别的地方吗？",
            "您还记得童年时最难忘的一顿饭吗？是在什么场合？",
            "小时候您最崇拜的人是谁？为什么？",
            "您记得第一次离开家的经历吗？当时是什么感受？",
            "童年时，您最害怕的事情是什么？后来是怎么克服的？"
        ],
        emotion: [
            "回想起童年，您觉得那时候的自己和现在有什么不同？",
            "如果能回到童年，您最想重新体验哪个时刻？",
            "童年的哪个经历对您后来的人生影响最大？"
        ],
        closure: [
            "您觉得童年教会了您什么最重要的东西？",
            "您想对童年的自己说些什么话吗？"
        ]
    },
    '求学之路': {
        opening: [
            "您还记得第一天上学时的情景吗？",
            "您最喜欢的老师是谁？他/她给您留下了什么印象？",
            "您在学校里最难忘的一件事是什么？"
        ],
        deepening: [
            "您在学习中遇到过什么困难？是怎么解决的？",
            "您最喜欢的科目是什么？为什么？",
            "您记得哪次考试或竞赛的经历吗？",
            "您和同学们有什么有趣的回忆？",
            "您参加过什么课外活动吗？给您带来了什么收获？"
        ],
        emotion: [
            "求学路上，什么时候让您感到最自豪？",
            "您觉得教育改变了您什么？",
            "如果重新选择，您会走同样的求学路吗？"
        ],
        closure: [
            "您觉得求学经历对您的人生观有什么影响？",
            "您想对正在求学的年轻人说些什么？"
        ]
    }
    // 可以继续添加其他主题...
};

// 智能问题生成器
const generateIntelligentQuestion = (messages, theme, questionCount) => {
    const config = MEMOIR_CONFIG.questionLimits;
    const library = QUESTION_LIBRARY[theme] || QUESTION_LIBRARY['童年时光'];
    const maxQuestions = config[theme] || 8;
    
    // 分析当前对话深度
    const userResponses = messages.filter(msg => msg.role === 'user');
    const responseCount = userResponses.length;
    
    // 确定问题类型阶段
    let questionType;
    if (responseCount === 0) {
        questionType = 'opening';
    } else if (responseCount < maxQuestions * 0.6) {
        questionType = 'deepening';
    } else if (responseCount < maxQuestions * 0.8) {
        questionType = 'emotion';
    } else {
        questionType = 'closure';
    }
    
    // 智能选择问题
    const questions = library[questionType] || library.opening;
    const lastResponse = userResponses[userResponses.length - 1]?.content || '';
    
    // 基于上一个回答生成更有针对性的问题
    if (questionType === 'deepening' && lastResponse) {
        return generateContextualQuestion(lastResponse, questions, theme);
    }
    
    // 随机选择但避免重复
    const usedQuestions = messages.filter(msg => msg.role === 'assistant').map(msg => msg.content);
    const availableQuestions = questions.filter(q => !usedQuestions.some(used => used.includes(q.substring(0, 10))));
    
    if (availableQuestions.length > 0) {
        return availableQuestions[Math.floor(Math.random() * availableQuestions.length)];
    }
    
    return questions[Math.floor(Math.random() * questions.length)];
};

// 基于上下文生成问题
const generateContextualQuestion = (lastResponse, baseQuestions, theme) => {
    // 简单的关键词匹配来生成相关问题
    const keywords = {
        '游戏': '您还记得和小伙伴们一起玩游戏的情景吗？那时候你们是怎么安排游戏时间的？',
        '朋友': '您和这位朋友是怎么认识的？你们经常一起做什么？',
        '学校': '您还记得学校的样子吗？最喜欢学校的哪个地方？',
        '老师': '这位老师给您印象最深的是什么？有什么特别的教学方式吗？',
        '家': '您还记得家里的布置吗？家人平时都做些什么？',
        '害怕': '后来您是怎么克服这种害怕的？家人有帮助您吗？'
    };
    
    for (const [keyword, question] of Object.entries(keywords)) {
        if (lastResponse.includes(keyword)) {
            return question;
        }
    }
    
    return baseQuestions[Math.floor(Math.random() * baseQuestions.length)];
};

// 智能回忆录生成器
const generateIntelligentMemoir = (messages, theme, style = 'warm') => {
    const userResponses = messages.filter(msg => msg.role === 'user').map(msg => msg.content);
    const styleConfig = MEMOIR_CONFIG.writingStyles[style] || MEMOIR_CONFIG.writingStyles.warm;
    
    // 提取关键信息
    const keyMoments = extractKeyMoments(userResponses);
    const emotions = extractEmotions(userResponses);
    const characters = extractCharacters(userResponses);
    
    // 根据风格生成标题
    const titles = {
        '童年时光': {
            'warm': '温馨童年，美好回忆',
            'vivid': '童年往事，历历在目', 
            'poetic': '童年如歌，岁月如诗',
            'simple': '我的童年故事'
        },
        '求学之路': {
            'warm': '求学路上的温暖回忆',
            'vivid': '那些年，我们一起读过的书',
            'poetic': '书山有路，青春作伴',
            'simple': '我的学生时代'
        }
    };
    
    const title = titles[theme]?.[style] || `我的${theme}`;
    
    // 生成正文内容
    const content = generateMemoirContent(userResponses, theme, styleConfig, keyMoments, emotions, characters);
    
    return {
        title,
        content,
        style: styleConfig.name,
        wordCount: content.length,
        generatedAt: new Date().toISOString()
    };
};

// 提取关键时刻
const extractKeyMoments = (responses) => {
    const moments = [];
    responses.forEach(response => {
        // 简单的关键时刻识别逻辑
        if (response.includes('第一次') || response.includes('记得') || response.includes('那时候')) {
            moments.push(response.substring(0, 50) + '...');
        }
    });
    return moments.slice(0, 5); // 最多5个关键时刻
};

// 提取情感色彩
const extractEmotions = (responses) => {
    const emotions = {
        positive: ['高兴', '快乐', '开心', '喜欢', '美好', '温暖'],
        nostalgic: ['想念', '怀念', '回忆', '往昔', '那时', '曾经'],
        challenging: ['困难', '艰难', '挫折', '不容易', '辛苦', '努力']
    };
    
    const detected = { positive: 0, nostalgic: 0, challenging: 0 };
    
    responses.forEach(response => {
        Object.keys(emotions).forEach(emotion => {
            emotions[emotion].forEach(word => {
                if (response.includes(word)) {
                    detected[emotion]++;
                }
            });
        });
    });
    
    return detected;
};

// 提取人物角色
const extractCharacters = (responses) => {
    const characters = [];
    const patterns = ['妈妈', '爸爸', '老师', '朋友', '同学', '奶奶', '爷爷', '兄弟', '姐妹'];
    
    responses.forEach(response => {
        patterns.forEach(pattern => {
            if (response.includes(pattern) && !characters.includes(pattern)) {
                characters.push(pattern);
            }
        });
    });
    
    return characters.slice(0, 5); // 最多5个主要人物
};

// 生成回忆录内容
const generateMemoirContent = (responses, theme, styleConfig, keyMoments, emotions, characters) => {
    let content = '';
    
    // 开头段落
    const openings = {
        'warm': `回忆如温暖的阳光，轻柔地洒在心田。`,
        'vivid': `时光荏苒，但那些珍贵的片段却清晰如昨。`,
        'poetic': `岁月如诗，每一行都写满了生活的真谛。`,
        'simple': `回想起那些日子，心中总是充满了感动。`
    };
    
    content += openings[styleConfig.tone.split('、')[0]] || openings.simple;
    content += '\n\n';
    
    // 主体内容 - 整合用户回应
    if (responses.length > 0) {
        content += '在我的记忆中，';
        responses.slice(0, 6).forEach((response, index) => {
            if (index > 0) content += '，';
            content += response.length > 60 ? response.substring(0, 60) + '...' : response;
        });
        content += '。这些珍贵的记忆，构成了我生命中最宝贵的财富。\n\n';
    }
    
    // 人物描述
    if (characters.length > 0) {
        content += `在这段${theme}中，${characters.slice(0, 3).join('、')}等人都给我留下了深刻的印象。他们的身影至今还深深印在我的心里。\n\n`;
    }
    
    // 关键时刻
    if (keyMoments.length > 0) {
        content += '那些特别的时刻，';
        content += keyMoments.slice(0, 3).join('，');
        content += '，每一个都是那么珍贵，那么值得回味。\n\n';
    }
    
    // 情感总结
    const emotionSummary = emotions.positive > emotions.challenging ? 
        '回想起来，那段时光虽然简单，却充满了纯真的快乐和美好。' :
        '虽然路上有过挫折和困难，但正是这些经历让我成长，让我懂得了坚强和珍惜。';
    
    content += emotionSummary + '\n\n';
    
    // 结尾
    const endings = {
        'warm': '这些温暖的回忆，将永远伴随我前行，成为我心中最温馨的港湾。',
        'vivid': '这些生动的画面，将永远在我的记忆中闪闪发光，照亮人生的道路。',
        'poetic': '时光会老去，但这些美好的记忆将如诗般永恒，在岁月的长河中闪闪发光。',
        'simple': '这些简单而真实的记忆，是我一生中最宝贵的财富。'
    };
    
    content += endings[styleConfig.tone.split('、')[0]] || endings.simple;
    
    return content;
};

// 生成回忆录分享HTML页面
const generateMemoirHTML = (memoir) => {
    const formattedDate = new Date(memoir.created_at).toLocaleDateString('zh-CN');
    
    return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${memoir.title} - 时光留声</title>
    <meta name="description" content="${memoir.content.substring(0, 100)}...">
    
    <!-- 微信分享优化 -->
    <meta property="og:title" content="${memoir.title}">
    <meta property="og:description" content="${memoir.content.substring(0, 100)}...">
    <meta property="og:type" content="article">
    <meta property="og:site_name" content="时光留声">
    
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', '微软雅黑', Arial, sans-serif;
            line-height: 1.8;
            color: #333;
            background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
            min-height: 100vh;
            padding: 20px;
        }
        
        .container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            border-radius: 15px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 40px 30px;
            text-align: center;
        }
        
        .title {
            font-size: 28px;
            font-weight: 600;
            margin-bottom: 15px;
            text-shadow: 0 2px 4px rgba(0,0,0,0.3);
        }
        
        .meta {
            font-size: 16px;
            opacity: 0.9;
            display: flex;
            justify-content: center;
            gap: 20px;
            flex-wrap: wrap;
        }
        
        .meta-item {
            background: rgba(255,255,255,0.2);
            padding: 8px 16px;
            border-radius: 20px;
            backdrop-filter: blur(10px);
        }
        
        .content {
            padding: 40px 30px;
            font-size: 18px;
            line-height: 2;
            color: #2c3e50;
        }
        
        .content p {
            margin-bottom: 20px;
            text-indent: 2em;
        }
        
        .footer {
            background: #f8f9fa;
            padding: 30px;
            text-align: center;
            border-top: 1px solid #e9ecef;
        }
        
        .logo {
            font-size: 24px;
            font-weight: 600;
            color: #667eea;
            margin-bottom: 10px;
        }
        
        .tagline {
            color: #6c757d;
            font-size: 14px;
        }
        
        .stats {
            display: flex;
            justify-content: center;
            gap: 30px;
            margin: 20px 0;
            font-size: 14px;
            color: #6c757d;
        }
        
        @media (max-width: 768px) {
            body {
                padding: 10px;
            }
            
            .header {
                padding: 30px 20px;
            }
            
            .title {
                font-size: 24px;
            }
            
            .content {
                padding: 30px 20px;
                font-size: 16px;
            }
            
            .meta {
                flex-direction: column;
                align-items: center;
                gap: 10px;
            }
            
            .stats {
                flex-direction: column;
                gap: 10px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 class="title">${memoir.title}</h1>
            <div class="meta">
                <div class="meta-item">📖 ${memoir.theme}</div>
                <div class="meta-item">✨ ${memoir.style}</div>
                <div class="meta-item">📅 ${formattedDate}</div>
            </div>
        </div>
        
        <div class="content">
            ${memoir.content.split('\n\n').map(paragraph => 
                paragraph.trim() ? `<p>${paragraph.trim()}</p>` : ''
            ).join('')}
        </div>
        
        <div class="footer">
            <div class="logo">🎙️ 时光留声</div>
            <div class="tagline">用声音记录生活，用回忆温暖人心</div>
            <div class="stats">
                <div>📝 ${memoir.word_count} 字</div>
                <div>👁️ ${memoir.views || 0} 次阅读</div>
            </div>
        </div>
    </div>
    
    <script>
        // 微信分享配置
        document.addEventListener('DOMContentLoaded', function() {
            console.log('回忆录页面加载完成');
        });
    </script>
</body>
</html>`;
};

// 修改现有的智能问题生成函数
const generateSmartQuestion = (messages, theme) => {
    const userResponses = messages.filter(msg => msg.role === 'user');
    return generateIntelligentQuestion(messages, theme, userResponses.length);
};

// 已移除：使用下方增强版的generateSmartMemoir函数

// 健康检查
app.get('/', (req, res) => {
    res.json({ 
        message: '时光留声 AI回忆录助手 - 后端服务',
        status: 'running',
        timestamp: new Date().toISOString()
    });
});

// 讯飞TTS服务
function getAuthUrl() {
    const host = 'tts-api.xfyun.cn';
    const date = new Date().toUTCString();
    const signatureOrigin = `host: ${host}\ndate: ${date}\nGET /v2/tts HTTP/1.1`;
    const signature = crypto.createHmac('sha256', IFLYTEK_API_SECRET).update(signatureOrigin).digest('base64');
    const authorization = `api_key="${IFLYTEK_API_KEY}", algorithm="hmac-sha256", headers="host date request-line", signature="${signature}"`;
    const encodedAuthorization = Buffer.from(authorization).toString('base64');
    return `wss://${host}/v2/tts?authorization=${encodedAuthorization}&date=${encodeURIComponent(date)}&host=${host}`;
}

app.post('/api/tts', (req, res) => {
    const { text } = req.body;
    if (!text) {
        return res.status(400).json({ error: 'Text is required' });
    }

    if (!IFLYTEK_APPID || !IFLYTEK_API_KEY || !IFLYTEK_API_SECRET) {
        return res.status(500).json({ error: 'TTS service not configured' });
    }

    const authUrl = getAuthUrl();
    const ws = new WebSocket(authUrl);
    let audioBuffer = Buffer.from([]);

    ws.on('open', () => {
        const frame = {
            common: { app_id: IFLYTEK_APPID },
            business: { 
                aue: 'lame', 
                vcn: 'x4_yezi',
                reg: '2',
                tte: 'UTF8',
                speed: 45,
                volume: 85,
                pitch: 50
            },
            data: { 
                status: 2, 
                text: Buffer.from(text).toString('base64') 
            }
        };
        
        console.log(`🎤 特色发音人配置: vcn=${frame.business.vcn}, reg=${frame.business.reg}`);
        console.log(`📝 TTS文本长度: ${text.length} 字符`);
        ws.send(JSON.stringify(frame));
    });

    ws.on('message', (data) => {
        const response = JSON.parse(data);
        if (response.code !== 0) {
            console.error(`🚫 特色发音人TTS错误: code=${response.code}, message=${response.message}`);
            console.error(`📊 完整响应:`, JSON.stringify(response, null, 2));
            ws.close();
            return res.status(500).json({ 
                error: 'TTS service error', 
                code: response.code, 
                message: response.message 
            });
        }
        
        if (response.data && response.data.audio) {
            const audioChunk = Buffer.from(response.data.audio, 'base64');
            audioBuffer = Buffer.concat([audioBuffer, audioChunk]);
        }

        if (response.data && response.data.status === 2) {
            ws.close();
            
            console.log(`🎵 生成小露语音MP3文件，大小: ${audioBuffer.length} bytes`);
            console.log('🔧 强制MP3格式输出 - v2.0');
            
            res.set({
                'Content-Type': 'audio/mpeg',
                'Content-Length': audioBuffer.length,
                'Cache-Control': 'no-cache',
                'X-Audio-Format': 'MP3-LAME'
            });
            res.send(audioBuffer);
        }
    });

    ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        res.status(500).json({ error: 'TTS service connection error' });
    });
});

// 获取问答进度接口
app.post('/api/question-progress', (req, res) => {
    const { messages, theme } = req.body;
    const userResponses = messages.filter(msg => msg.role === 'user');
    const maxQuestions = MEMOIR_CONFIG.questionLimits[theme] || 8;
    const currentCount = userResponses.length;
    
    res.json({
        currentCount,
        maxQuestions,
        progress: Math.min((currentCount / maxQuestions) * 100, 100),
        canGenerateMemoir: currentCount >= Math.ceil(maxQuestions * 0.6), // 60%完成度即可生成
        isComplete: currentCount >= maxQuestions
    });
});

// 获取写作风格接口
app.get('/api/writing-styles', (req, res) => {
    res.json(MEMOIR_CONFIG.writingStyles);
});

// 保存回忆录接口
app.post('/api/memoirs', (req, res) => {
    const { title, content, theme, style, conversationData, userId } = req.body;
    
    if (!title || !content || !theme || !style) {
        return res.status(400).json({ error: '缺少必要的字段' });
    }
    
    // 清理数据格式 - 移除"标题："和"正文："前缀
    const cleanTitle = title.replace(/^(标题：|Title:\s*)/g, '').trim();
    const cleanContent = content.replace(/^(正文：|Content:\s*)/g, '').trim();
    
    console.log('📝 保存回忆录数据清理:', {
        原标题: title,
        清理后标题: cleanTitle,
        原内容长度: content.length,
        清理后内容长度: cleanContent.length,
        清理后内容预览: cleanContent.substring(0, 100) + '...'
    });
    
    const id = uuidv4();
    const wordCount = cleanContent.length;
    const conversationJson = JSON.stringify(conversationData || []);
    
    const sql = `
        INSERT INTO memoirs (id, title, content, theme, style, word_count, conversation_data, user_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    db.run(sql, [id, cleanTitle, cleanContent, theme, style, wordCount, conversationJson, userId || 'anonymous'], function(err) {
        if (err) {
            console.error('保存回忆录失败:', err.message);
            return res.status(500).json({ error: '保存失败' });
        }
        
        res.json({
            id,
            title: cleanTitle,
            content: cleanContent,
            theme,
            style,
            wordCount,
            createdAt: new Date().toISOString(),
            shareUrl: `${req.protocol}://${req.get('host')}/memoir/${id}`
        });
    });
});

// 获取回忆录详情（支持分享链接）
app.get('/memoir/:id', (req, res) => {
    const { id } = req.params;
    
    const sql = `
        SELECT id, title, content, theme, style, word_count, created_at, views
        FROM memoirs 
        WHERE id = ?
    `;
    
    db.get(sql, [id], (err, memoir) => {
        if (err) {
            console.error('查询回忆录失败:', err.message);
            return res.status(500).json({ error: '查询失败' });
        }
        
        if (!memoir) {
            return res.status(404).json({ error: '回忆录不存在' });
        }
        
        // 增加访问次数
        db.run('UPDATE memoirs SET views = views + 1 WHERE id = ?', [id]);
        
        // 返回HTML页面（用于微信分享）
        const html = generateMemoirHTML(memoir);
        res.send(html);
    });
});

// 获取回忆录JSON数据
app.get('/api/memoirs/:id', (req, res) => {
    const { id } = req.params;
    
    const sql = `
        SELECT id, title, content, theme, style, word_count, created_at, views
        FROM memoirs 
        WHERE id = ?
    `;
    
    db.get(sql, [id], (err, memoir) => {
        if (err) {
            console.error('查询回忆录失败:', err.message);
            return res.status(500).json({ error: '查询失败' });
        }
        
        if (!memoir) {
            return res.status(404).json({ error: '回忆录不存在' });
        }
        
        res.json({
            id: memoir.id,
            title: memoir.title,
            content: memoir.content,
            theme: memoir.theme,
            style: memoir.style,
            wordCount: memoir.word_count,
            createdAt: memoir.created_at,
            views: memoir.views
        });
    });
});

// 获取用户的回忆录列表
app.get('/api/memoirs', (req, res) => {
    const { userId } = req.query;
    
    const sql = `
        SELECT id, title, theme, style, word_count, created_at, views
        FROM memoirs 
        WHERE user_id = ? OR user_id = 'anonymous'
        ORDER BY created_at DESC
        LIMIT 50
    `;
    
    db.all(sql, [userId || 'anonymous'], (err, memoirs) => {
        if (err) {
            console.error('查询回忆录列表失败:', err.message);
            return res.status(500).json({ error: '查询失败' });
        }
        
        const formattedMemoirs = memoirs.map(memoir => ({
            id: memoir.id,
            title: memoir.title,
            theme: memoir.theme,
            style: memoir.style,
            wordCount: memoir.word_count,
            createdAt: memoir.created_at,
            views: memoir.views,
            shareUrl: `${req.protocol}://${req.get('host')}/memoir/${memoir.id}`
        }));
        
        res.json(formattedMemoirs);
    });
});

// 月之暗面 Kimi API
app.post('/api/chat', async (req, res) => {
    const { messages, type, theme, style } = req.body;
    
    if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ error: 'Messages array is required' });
    }

    // 强制使用生产级模拟AI (暂时禁用外部API)
    const USE_SIMULATION = true;
    
    if (USE_SIMULATION || !MOONSHOT_API_KEY) {
        // 生产级模拟AI - 智能生成个性化问题和回忆录
        console.log('🤖 强制使用增强AI模拟 - 生产级响应');
        
        // 分析对话历史，生成更智能的问题
        const generateSmartQuestion = (messages, theme) => {
            const userMessages = messages.filter(msg => msg.role === 'user');
            const questionCount = userMessages.length;
            
            console.log(`🎯 智能提问 - 主题: ${theme}, 问题数: ${questionCount}`);
            
            // 分阶段深度提问框架
            const questionSets = {
                '童年时光': {
                    opening: [
                        "您好，今天我们来聊聊您的童年时光。您还记得小时候最喜欢做什么吗？",
                        "能跟我说说您印象最深刻的童年回忆吗？"
                    ],
                    deepening: [
                        "您小时候最常去的地方是哪里？那里有什么特别的回忆？",
                        "您还记得童年时最要好的朋友吗？你们一起做过什么有趣的事？",
                        "小时候家里的情况是怎样的？您在家中排行第几？",
                        "您还记得过年过节时的情景吗？有什么特别的习俗或传统？",
                        "小时候您最喜欢玩什么游戏？能详细说说吗？"
                    ],
                    emotion: [
                        "回想起童年，什么时候让您觉得最快乐？",
                        "童年时期有什么事情让您印象特别深刻的吗？",
                        "您觉得童年时光教会了您什么重要的东西？"
                    ],
                    closure: [
                        "如果能重新经历童年，您最想改变什么，或者最想重温什么？",
                        "您想对现在的孩子们说些什么关于童年的话吗？"
                    ]
                },
                '求学之路': {
                    opening: [
                        "我们来聊聊您的求学经历吧。您还记得第一天上学时的情景吗？",
                        "您最难忘的一位老师是谁？"
                    ],
                    deepening: [
                        "您最喜欢的科目是什么？为什么喜欢它？",
                        "学生时代有什么特别难忘的考试或竞赛经历吗？",
                        "您和同学们的关系怎么样？有特别要好的朋友吗？",
                        "那个年代的学校生活是什么样的？",
                        "您在学习中遇到过什么困难吗？是怎么克服的？"
                    ],
                    emotion: [
                        "求学路上什么时候让您感到最自豪？",
                        "您觉得教育对您的人生有什么重要影响？",
                        "毕业的时候，您对未来有什么期望？"
                    ],
                    closure: [
                        "如果重新选择，您会走同样的求学路吗？",
                        "您想对正在求学的年轻人说些什么？"
                    ]
                }
            };
            
            // 获取当前主题的问题库
            const themeQuestions = questionSets[theme] || questionSets['童年时光'];
            
            // 根据问题数量确定提问阶段
            let stage = 'opening';
            if (questionCount >= 1 && questionCount <= 4) {
                stage = 'deepening';
            } else if (questionCount >= 5 && questionCount <= 6) {
                stage = 'emotion';
            } else if (questionCount >= 7) {
                stage = 'closure';
            }
            
            const stageQuestions = themeQuestions[stage] || themeQuestions.opening;
            const questionIndex = questionCount === 0 ? 0 : Math.min(questionCount - (stage === 'deepening' ? 1 : stage === 'emotion' ? 5 : 7), stageQuestions.length - 1);
            
            return stageQuestions[questionIndex] || `经过我们的对话，我感受到了您丰富的人生阅历。还有什么关于${theme}的珍贵回忆想要分享的吗？`;
        };
        
        // 生成智能回忆录 - 增强版800-1000字
        const generateSmartMemoir = (messages, theme, style = 'warm') => {
            const userResponses = messages.filter(msg => msg.role === 'user').map(msg => msg.content);
            
            // 分析对话内容
            const fullDialogue = messages.map(msg => `${msg.role === 'user' ? '我' : 'AI'}：${msg.content}`).join('\n');
            
            // 根据主题生成详细回忆录
            const generateDetailedMemoir = (theme, responses, style) => {
                const styleTemplates = {
                    warm: {
                        opening: '时光荏苒，回想起',
                        transition: '在我的记忆中，',
                        emotion: '那些温暖的',
                        ending: '这些珍贵的回忆，如温暖的阳光，永远照亮着我前行的路。'
                    },
                    vivid: {
                        opening: '历历在目的是',
                        transition: '清晰地记得，',
                        emotion: '那些生动的',
                        ending: '这些如画般的回忆，永远在我心中闪闪发光。'
                    },
                    poetic: {
                        opening: '岁月如诗，吟唱着',
                        transition: '在时光的长河中，',
                        emotion: '那些如诗如梦的',
                        ending: '这些美好如诗的记忆，将在岁月的长河中永远流淌。'
                    },
                    simple: {
                        opening: '回想起来，',
                        transition: '那时候，',
                        emotion: '那些真实的',
                        ending: '这些朴实无华的回忆，是我一生中最真实的财富。'
                    }
                };
                
                const template = styleTemplates[style] || styleTemplates.warm;
                
                // 构建详细内容
                let content = template.opening + theme + '，心中总是涌起阵阵暖流。';
                
                // 添加具体回忆内容 - 基于用户回答详细展开
                if (responses.length > 0) {
                    content += `\n\n${template.transition}`;
                    
                    // 详细展开每个用户回答
                    responses.forEach((response, index) => {
                        if (index < 4) { // 使用前4个主要回答
                            const expandedContent = expandUserResponse(response, theme, template);
                            content += expandedContent + '\n\n';
                        }
                    });
                    
                    // 添加情感升华段落
                    content += `${template.emotion}往事，不仅仅是记忆的片段，更是人生经历的宝贵财富。每一个细节，每一份感动，都深深地印在我的心里。`;
                    
                    // 添加反思段落
                    content += `\n\n现在回想起来，${theme}给我带来的不仅仅是回忆，更是成长和感悟。那些经历让我明白了人生的真谛，懂得了珍惜当下的美好。`;
                    
                    // 添加传承意义
                    content += `\n\n这些经历塑造了今天的我，也让我对未来充满期待。我希望能将这些珍贵的经验和感悟传递给年轻的一代，让他们也能从中获得启发和力量。`;
                }
                
                content += `\n\n${template.ending}`;
                
                return content;
            };
            
            // 展开用户回答的辅助函数
            const expandUserResponse = (response, theme, template) => {
                // 简单的内容扩展逻辑
                const keywords = response.match(/[\u4e00-\u9fa5]{2,}/g) || [];
                let expanded = response;
                
                // 根据关键词添加情境描述
                if (keywords.length > 0) {
                    expanded += `。那种感觉至今还能清晰地回想起来，`;
                    if (theme.includes('童年') || theme.includes('求学')) {
                        expanded += `充满了纯真和美好`;
                    } else if (theme.includes('职场') || theme.includes('工作')) {
                        expanded += `满怀着拼搏的激情和成长的喜悦`;
                    } else {
                        expanded += `承载着深深的眷恋和无限的温暖`;
                    }
                    expanded += `。`;
                }
                
                return expanded;
            };
            
            const content = generateDetailedMemoir(theme, userResponses, style);
            const title = generateTitle(theme, userResponses);
            
            console.log(`📝 生成回忆录 - 主题: ${theme}, 字数: ${content.length}, 风格: ${style}`);
            console.log(`📝 生成的内容预览: ${content.substring(0, 100)}...`);
            
            return {
                title: title,
                content: content
            };
        };
        
        // 生成回忆录标题
        const generateTitle = (theme, responses) => {
            const titleTemplates = {
                '童年时光': ['我的童年岁月', '纯真年代', '童年往事', '天真岁月'],
                '求学之路': ['我的求学时光', '书香年华', '学习之路', '青春求学路'],
                '职场岁月': ['我的职场经历', '奋斗年华', '职场征程', '工作生涯回忆'],
                '时代记忆': ['我见证的时代', '时代足迹', '历史见证', '时光印记']
            };
            
            const templates = titleTemplates[theme] || titleTemplates['童年时光'];
            
            // 根据内容关键词选择更合适的标题
            if (responses.length > 0) {
                const content = responses.join('');
                if (content.includes('项目') || content.includes('工作')) {
                    return '携手并进的职场岁月';
                } else if (content.includes('学校') || content.includes('老师')) {
                    return '书香满园的求学路';
                } else if (content.includes('朋友') || content.includes('玩')) {
                    return '纯真美好的童年时光';
                }
            }
            
            return templates[Math.floor(Math.random() * templates.length)];
        };
        
        if (type === 'question') {
            const smartQuestion = generateSmartQuestion(messages, theme || '童年时光');
            return res.json({ next_question: smartQuestion });
        } else if (type === 'memoir') {
            console.log('🔥 后端收到memoir请求:', {
                type,
                theme,
                style,
                messagesCount: messages.length,
                firstMessage: messages[0],
                lastMessage: messages[messages.length - 1]
            });
            const memoir = generateSmartMemoir(messages, theme || '童年时光', style || 'warm');
            console.log('🔥 后端生成memoir结果:', {
                title: memoir.title,
                contentLength: memoir.content.length,
                contentPreview: memoir.content.substring(0, 100)
            });
            return res.json(memoir);
        }
        
        // 默认返回智能问题
        const defaultQuestion = generateSmartQuestion(messages, '童年时光');
        return res.json({ next_question: defaultQuestion });
    }

    try {
        const response = await axios.post('https://api.moonshot.cn/v1/chat/completions', {
            model: 'moonshot-v1-8k',
            messages: messages,
            temperature: 0.7,
            max_tokens: 2000
        }, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${MOONSHOT_API_KEY}`
            }
        });

        const data = response.data;
        
        if (data.choices && data.choices[0] && data.choices[0].message) {
            const content = data.choices[0].message.content;
            
            // 根据请求类型返回不同格式
            if (type === 'question') {
                res.json({ next_question: content });
            } else if (type === 'memoir') {
                // 尝试解析标题和内容
                const lines = content.split('\n').filter(line => line.trim());
                const title = lines[0] || 'AI生成的回忆录';
                const contentText = lines.slice(1).join('\n') || content;
                
                res.json({ 
                    title: title.replace(/^#+\s*/, ''),
                    content: contentText 
                });
            } else {
                res.json({ content });
            }
        } else {
            res.status(500).json({ error: 'Invalid response from LLM service' });
        }
    } catch (error) {
        console.error('LLM API error:', error);
        res.status(500).json({ error: 'LLM service error' });
    }
});

// 错误处理中间件
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

// 启动服务器 - 绑定到所有网络接口
app.listen(PORT, '0.0.0.0', () => {
    console.log(`时光留声后端服务运行在端口 ${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/`);
    console.log(`Network access: http://192.168.3.115:${PORT}/`);
}); // 强制重新部署 Sun Jul 20 11:38:57 CST 2025
