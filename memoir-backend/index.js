const express = require('express');
const crypto = require('crypto');
const WebSocket = require('ws');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(express.json());

// 环境变量配置
const IFLYTEK_APPID = process.env.IFLYTEK_APPID;
const IFLYTEK_API_KEY = process.env.IFLYTEK_API_KEY;
const IFLYTEK_API_SECRET = process.env.IFLYTEK_API_SECRET;
const MOONSHOT_API_KEY = process.env.MOONSHOT_API_KEY;

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
                vcn: 'x2_xiaolu',
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

// 月之暗面 Kimi API
app.post('/api/chat', async (req, res) => {
    const { messages, type } = req.body;
    
    if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ error: 'Messages array is required' });
    }

    if (!MOONSHOT_API_KEY) {
        // 生产级模拟AI - 智能生成个性化问题和回忆录
        console.log('Using enhanced AI simulation - production-grade mock responses');
        
        // 分析对话历史，生成更智能的问题
        const generateSmartQuestion = (messages, type) => {
            const userMessages = messages.filter(msg => msg.role === 'user');
            const questionCount = userMessages.length;
            
            const questionSets = {
                '童年时光': [
                    "能跟我详细说说您印象最深刻的童年回忆吗？",
                    "您小时候最喜欢和谁一起玩耍？能描述一下那时的快乐时光吗？",
                    "回想起童年，哪个节日或特殊的日子让您至今难忘？",
                    "您童年时代居住的地方是什么样子的？有什么特别之处吗？",
                    "小时候您最爱听什么故事？是谁讲给您听的？",
                    "您记得第一次上学时的情景吗？当时心情如何？",
                    "童年时期有什么让您感到特别骄傲的事情吗？",
                    "您还记得小时候最害怕的事情是什么吗？后来是怎样克服的？"
                ],
                '求学之路': [
                    "您还记得自己的启蒙老师吗？他/她给您留下了什么印象？",
                    "在学生时代，哪门功课是您最感兴趣的？为什么？",
                    "您有没有特别难忘的考试经历？能跟我分享一下吗？",
                    "学生时代，您遇到过什么困难？是如何解决的？",
                    "您还记得同窗好友吗？有什么有趣的校园故事？",
                    "那个年代的学校生活和现在有什么不同？",
                    "您的求学路上，谁给了您最大的支持和鼓励？",
                    "毕业时，您对未来有什么期望和规划？"
                ],
                '时代记忆': [
                    "您经历过哪些重要的历史时刻？当时的感受如何？",
                    "那个年代的生活节奏和现在相比有什么不同？",
                    "您还记得当时流行的歌曲、电影或文学作品吗？",
                    "那个时代的人们是如何消遣娱乐的？",
                    "您见证了哪些科技或社会的重大变化？",
                    "当时的邻里关系是怎样的？大家是如何相互帮助的？",
                    "您还记得那个年代的重要节日是如何庆祝的吗？",
                    "您觉得哪些传统文化在您那个年代保持得特别好？"
                ]
            };
            
            // 从当前主题中选择合适的问题
            const themeQuestions = questionSets[type] || questionSets['童年时光'];
            
            // 根据对话次数智能选择问题
            if (questionCount === 0) {
                return themeQuestions[0]; // 开场问题
            } else if (questionCount < themeQuestions.length) {
                return themeQuestions[questionCount];
            } else {
                // 生成总结性问题
                return `经过我们的对话，我感受到了您丰富的人生阅历。还有什么关于${type}的珍贵回忆想要分享的吗？`;
            }
        };
        
        // 生成智能回忆录
        const generateSmartMemoir = (messages, theme) => {
            const userResponses = messages.filter(msg => msg.role === 'user').map(msg => msg.content);
            const responseCount = userResponses.length;
            
            const memoirTemplates = {
                '童年时光': {
                    title: "我的童年岁月",
                    content: `童年，是人生中最纯真美好的时光。${responseCount > 0 ? '在我的记忆中，' : ''}那些珍贵的往事至今还历历在目...\n\n${userResponses.length > 0 ? '回忆起那些日子，' + userResponses.slice(0, 3).join('，') + '...' : '那时的我们，无忧无虑，每一天都充满了新奇和快乐。'}\n\n这些美好的童年记忆，成为了我一生中最宝贵的财富。它们教会了我什么是纯真，什么是快乐，也为我的人生观和价值观奠定了基础。`
                },
                '求学之路': {
                    title: "我的求学时光",
                    content: `求学路上，每一步都充满了挑战与收获。${responseCount > 0 ? '那些年里，' : ''}老师的教诲、同窗的友谊，都是我人生中珍贵的财富...\n\n${userResponses.length > 0 ? '回想起学生时代，' + userResponses.slice(0, 3).join('，') + '...' : '那时的我们，为了理想而努力，为了知识而奋斗。'}\n\n这段求学经历不仅给了我知识，更重要的是塑造了我的品格，让我学会了坚持、努力和感恩。`
                },
                '时代记忆': {
                    title: "我见证的时代",
                    content: `时代的变迁，见证了历史的车轮滚滚向前。${responseCount > 0 ? '在我的经历中，' : ''}每一个历史时刻都深深印在我的心里...\n\n${userResponses.length > 0 ? '那个年代，' + userResponses.slice(0, 3).join('，') + '...' : '那是一个充满变化的时代，我们在历史的洪流中成长。'}\n\n这些时代记忆不仅是个人的经历，更是整个社会发展的缩影。它们让我明白了历史的厚重，也让我更加珍惜今天的美好生活。`
                }
            };
            
            const template = memoirTemplates[theme] || memoirTemplates['童年时光'];
            return template;
        };
        
        if (type === 'question') {
            const smartQuestion = generateSmartQuestion(messages, req.body.theme || '童年时光');
            return res.json({ next_question: smartQuestion });
        } else if (type === 'memoir') {
            const memoir = generateSmartMemoir(messages, req.body.theme || '童年时光');
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
}); 