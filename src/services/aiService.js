/**
 * aiService.js
 * 
 * AI服务 - 连接到后端LLM API
 * 提供智能对话和回忆录生成功能
 */

// 后端API基础URL - 使用Railway云端部署
const API_BASE_URL = __DEV__ ? 'http://192.168.3.115:3000' : 'https://memoir-backend-production-b9b6.up.railway.app';

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
    const userMessages = conversationHistory
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
        
        // 构建消息历史
        const messages = [
            {
                role: 'system',
                content: buildSystemPrompt(theme)
            },
            ...conversationHistory
        ];

        const response = await fetch(`${API_BASE_URL}/api/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                messages: messages,
                type: 'question',
                theme: theme
            })
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
export const generateMemoir = async (conversationHistory, theme = '生活回忆') => {
    try {
        console.log("AI Service: Generating memoir for theme:", theme);
        
        const messages = [
            {
                role: 'user',
                content: buildMemoirPrompt(theme, conversationHistory)
            }
        ];

        const response = await fetch(`${API_BASE_URL}/api/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                messages: messages,
                type: 'memoir',
                theme: theme
            })
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