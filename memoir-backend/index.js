const express = require('express');
const crypto = require('crypto');
const WebSocket = require('ws');

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(express.json());
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    if (req.method === 'OPTIONS') {
        res.sendStatus(200);
    } else {
        next();
    }
});

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
                aue: 'raw', 
                vcn: 'xiaoyan', 
                tte: 'UTF8',
                speed: 40,
                volume: 80,
                pitch: 50
            },
            data: { 
                status: 2, 
                text: Buffer.from(text).toString('base64') 
            }
        };
        ws.send(JSON.stringify(frame));
    });

    ws.on('message', (data) => {
        const response = JSON.parse(data);
        if (response.code !== 0) {
            console.error(`TTS Error: ${response.code} ${response.message}`);
            ws.close();
            return res.status(500).json({ error: 'TTS service error' });
        }
        
        if (response.data && response.data.audio) {
            const audioChunk = Buffer.from(response.data.audio, 'base64');
            audioBuffer = Buffer.concat([audioBuffer, audioChunk]);
        }

        if (response.data && response.data.status === 2) {
            ws.close();
            res.set({
                'Content-Type': 'audio/wav',
                'Content-Length': audioBuffer.length
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
        return res.status(500).json({ error: 'LLM service not configured' });
    }

    try {
        const response = await fetch('https://api.moonshot.cn/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${MOONSHOT_API_KEY}`
            },
            body: JSON.stringify({
                model: 'moonshot-v1-8k',
                messages: messages,
                temperature: 0.7,
                max_tokens: 2000
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
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

// 启动服务器
app.listen(PORT, () => {
    console.log(`时光留声后端服务运行在端口 ${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/`);
}); 