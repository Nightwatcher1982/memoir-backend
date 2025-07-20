/**
 * aiService.js
 * 
 * AI服务 - 连接到后端LLM API
 * 提供智能对话和回忆录生成功能
 */

// 后端API基础URL - 强制使用Railway云端部署
// const API_BASE_URL = __DEV__ ? 'http://192.168.3.115:3000' : 'https://memoir-backend-production-b9b6.up.railway.app';
const API_BASE_URL = 'https://memoir-backend-production-b9b6.up.railway.app'; // 强制使用云端API
console.log('🌍 API Base URL:', API_BASE_URL);

/**
 * 构建系统提示词
 * @param {string} theme - 对话主题
 * @returns {string} 系统提示词
 */
function buildSystemPrompt(theme) {
    return `你是一个专业的回忆录访谈官，正在帮助一位长者记录关于"${theme}"的珍贵回忆。

你的任务是：
1. 用温暖、亲切的语调与用户对话
2. 提出开放式的、富有启发性的问题
3. 根据用户的回答进行智能追问，挖掘更多细节
4. 关注人物、地点、情感、事件等关键信息
5. 让对话自然流畅，就像和老朋友聊天一样

请用中文回复，语言要简洁明了，适合老年人理解。每次只问一个问题，不要太长。`;
}

/**
 * 构建回忆录生成提示词
 * @param {string} theme - 对话主题
 * @param {Array} conversationHistory - 对话历史
 * @returns {string} 生成提示词
 */
function buildMemoirPrompt(theme, conversationHistory) {
    // 转换前端格式到标准格式，兼容两种格式
    const convertedHistory = conversationHistory.map(entry => ({
        role: entry.role || (entry.speaker === 'ai' ? 'assistant' : 'user'),
        content: entry.content || entry.text
    }));
    
    const userMessages = convertedHistory
        .filter(msg => msg.role === 'user')
        .map(msg => msg.content)
        .join('\n');

    return `请根据以下对话内容，为长者生成一篇温暖、生动的回忆录文章。

主题：${theme}
对话内容：
${userMessages}

要求：
1. 用第一人称"我"来写，就像长者在亲自讲述
2. 语言要温暖、生动，富有情感
3. 保持真实性，不要添加对话中没有的内容
4. 结构清晰，有开头、发展和结尾
5. 字数控制在300-500字之间
6. 第一行是标题，后面是正文内容

格式：
标题：一个简洁有力的标题
正文：完整的回忆录内容`;
}

/**
 * 获取AI的下一个引导性问题
 * @param {Array<object>} conversationHistory - 对话历史记录
 * @param {string} theme - 对话主题
 * @returns {Promise<object>} 返回包含下一个问题的对象 { next_question: string }
 */
export const getNextQuestion = async (conversationHistory, theme = '生活回忆') => {
    try {
        console.log("AI Service: Requesting next question for theme:", theme);
        
        // 构建消息历史 - 转换前端格式到AI API格式
        const convertedHistory = conversationHistory.map(entry => ({
            role: entry.speaker === 'ai' ? 'assistant' : 'user',
            content: entry.text
        }));
        
        const messages = [
            {
                role: 'system',
                content: buildSystemPrompt(theme)
            },
            ...convertedHistory
        ];
        
        console.log("AI Service: Converted conversation history:", convertedHistory);

        const response = await fetch(`${API_BASE_URL}/api/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                messages: messages,
                type: 'question',
                theme: theme
            }),
            timeout: 30000 // 30秒超时
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log("AI Service: Received response data:", data);
        
        // 增强的数据验证
        if (!data || typeof data !== 'object') {
            throw new Error('Invalid response data format');
        }
        
        const nextQuestion = data.next_question || data.question || data.content || '';
        console.log("AI Service: Received next question:", nextQuestion);
        
        return { next_question: nextQuestion };
    } catch (error) {
        console.error('AI Service Error:', error);
        
        // 网络诊断
        if (error.message === 'Network request failed') {
            console.log('🔧 网络连接失败，请检查：');
            console.log('1. WiFi或移动网络连接');
            console.log('2. 服务器是否正常运行');
            console.log('3. 防火墙或代理设置');
            console.log(`4. API URL: ${API_BASE_URL}`);
        }
        
        // 降级到本地备用问题
        const fallbackQuestions = [
            "能再详细说说这件事的经过吗？",
            "当时您的心情是怎样的？",
            "这件事对您后来有什么影响呢？",
            "还有其他人参与其中吗？",
            "您觉得这段经历最珍贵的是什么？"
        ];
        
        const randomQuestion = fallbackQuestions[Math.floor(Math.random() * fallbackQuestions.length)];
        return { next_question: randomQuestion };
    }
};

/**
 * 根据对话历史生成最终的回忆录故事
 * @param {Array<object>} conversationHistory - 对话历史
 * @param {string} theme - 对话主题
 * @returns {Promise<object>} 返回包含标题和内容的故事对象 { title: string, content: string }
 */
export const generateMemoir = async (conversationHistory, theme = '生活回忆', style = 'warm') => {
    try {
        console.log("AI Service: Generating memoir for theme:", theme);
        
        // 直接发送对话历史，让后端的增强AI处理
        const response = await fetch(`${API_BASE_URL}/api/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                messages: conversationHistory,  // 直接发送对话历史
                type: 'memoir',
                theme: theme,
                style: style
            }),
            timeout: 30000 // 30秒超时
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log("AI Service: Generated memoir data:", data);
        
        // 增强的数据验证
        if (!data || typeof data !== 'object') {
            throw new Error('Invalid memoir data format');
        }
        
        return {
            title: data.title || data.Title || '我的珍贵回忆',
            theme: theme,
            content: data.content || data.Content || '这是一段珍贵的回忆，记录了您分享的美好时光。'
        };
    } catch (error) {
        console.error('AI Service Error:', error);
        
        // 降级到本地生成
        const fallbackContent = `关于${theme}的回忆，您分享了许多珍贵的片段。虽然网络连接出现了问题，但这些美好的记忆已经深深印在心中。每一个细节都是生活的珍贵财富，值得永远珍藏。`;
        
        return {
            title: `关于${theme}的回忆`,
            theme: theme,
            content: fallbackContent
        };
    }
}; 

/**
 * 获取问答进度
 * @param {Array} conversationHistory - 对话历史
 * @param {string} theme - 对话主题
 * @returns {Promise<Object>} 进度信息
 */
export async function getQuestionProgress(conversationHistory, theme) {
    // 转换前端格式到后端格式
    const backendFormat = convertToBackendFormat(conversationHistory);
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/question-progress`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                messages: backendFormat,
                theme: theme
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('📊 问答进度:', data);
        return data;
    } catch (error) {
        console.warn('获取问答进度失败:', error);
        // 降级方案：使用本地计算
        console.log('🔄 使用本地问答进度计算');
        return getLocalQuestionProgress(conversationHistory, theme);
    }
}

/**
 * 转换前端对话格式到后端格式
 * 前端: {speaker: 'user'/'ai', text: '...'}
 * 后端: {role: 'user'/'assistant', content: '...'}
 */
function convertToBackendFormat(conversationHistory) {
    return conversationHistory.map(msg => {
        if (msg.role && msg.content) {
            // 已经是后端格式
            return msg;
        } else if (msg.speaker && msg.text) {
            // 前端格式，需要转换
            return {
                role: msg.speaker === 'ai' ? 'assistant' : msg.speaker,
                content: msg.text
            };
        }
        return msg; // 未知格式，保持原样
    });
}

/**
 * 本地问答进度计算（降级方案）
 */
function getLocalQuestionProgress(conversationHistory, theme) {
    // 统一使用前端格式进行计算
    const userResponses = conversationHistory.filter(msg => 
        (msg.speaker === 'user') || (msg.role === 'user')
    );
    const maxQuestions = getMaxQuestions(theme);
    const currentCount = userResponses.length;
    
    console.log('🔍 计算问答进度:', {
        总对话数: conversationHistory.length,
        用户回答数: currentCount,
        最大问题数: maxQuestions,
        对话格式: conversationHistory[0] ? Object.keys(conversationHistory[0]) : '空',
        前5条消息: conversationHistory.slice(0, 5).map(msg => ({
            speaker: msg.speaker || msg.role,
            length: (msg.text || msg.content || '').length
        }))
    });
    
    return {
        currentCount,
        maxQuestions,
        progress: Math.min((currentCount / maxQuestions) * 100, 100),
        canGenerateMemoir: currentCount >= Math.ceil(maxQuestions * 0.6), // 60%完成度即可生成
        isComplete: currentCount >= maxQuestions,
        usingLocal: true // 标识使用本地计算
    };
}

function getMaxQuestions(theme) {
    const limits = {
        '童年时光': 8,
        '求学之路': 8,
        '工作经历': 10,
        '情感生活': 8,
        '家庭回忆': 8,
        '人生感悟': 6
    };
    return limits[theme] || 8;
}

/**
 * 获取写作风格列表
 * @returns {Promise<Object>} 写作风格配置
 */
export async function getWritingStyles() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/writing-styles`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('✨ 写作风格:', data);
        return data;
    } catch (error) {
        console.warn('获取写作风格失败:', error);
        // 降级方案：使用本地配置
        console.log('🔄 使用本地写作风格配置');
        return getLocalWritingStyles();
    }
}

/**
 * 本地写作风格配置（降级方案）
 */
function getLocalWritingStyles() {
    return {
        warm: {
            name: '温馨怀旧',
            description: '温暖亲切的叙述，充满怀念之情',
            icon: '🌟',
            prompt: '以温暖怀旧的语调'
        },
        vivid: {
            name: '生动叙述',
            description: '详细生动的描述，如临其境',
            icon: '🎨',
            prompt: '以生动详细的描述'
        },
        poetic: {
            name: '诗意抒情',
            description: '富有诗意的表达，情感丰富',
            icon: '🌸',
            prompt: '以诗意抒情的笔调'
        },
        simple: {
            name: '朴实真挚',
            description: '朴素真实的表达，平实感人',
            icon: '💝',
            prompt: '以朴实真挚的语言'
        }
    };
}

/**
 * 保存回忆录
 * @param {Object} memoir - 回忆录数据
 * @param {Array} conversationHistory - 对话历史
 * @param {string} theme - 主题
 * @param {string} style - 写作风格
 * @returns {Promise<Object>} 保存结果
 */
export async function saveMemoirToBackend(memoir, conversationHistory, theme, style) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/memoirs`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                title: memoir.title,
                content: memoir.content,
                theme: theme,
                style: style,
                conversationData: conversationHistory,
                userId: 'anonymous' // 可以后续添加用户系统
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('💾 回忆录保存成功:', data);
        return data;
    } catch (error) {
        console.error('保存回忆录失败:', error);
        throw error;
    }
}

/**
 * 获取用户的回忆录列表
 * @param {string} userId - 用户ID（可选）
 * @returns {Promise<Array>} 回忆录列表
 */
export async function getUserMemoirs(userId = 'anonymous') {
    try {
        const response = await fetch(`${API_BASE_URL}/api/memoirs?userId=${userId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('📚 用户回忆录列表:', data.length, '篇');
        return data;
    } catch (error) {
        console.error('获取回忆录列表失败:', error);
        return [];
    }
} 