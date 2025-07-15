/**
 * aiService.js
 * 
 * [重要] TODO: 当前为模拟AI服务 (Task ID: replace-mock-ai)
 * 这里的实现需要被替换为与真实后端大语言模型(LLM)的API交互逻辑。
 * 模拟的目的是为了在没有后端的情况下，能够独立开发和测试前端的完整对话流程。
 */

// 模拟网络延迟的辅助函数
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// 模拟的追问问题库
const MOCK_QUESTIONS = [
    "这个听起来很有趣，能再多讲一点细节吗？",
    "当时您的心情怎么样？",
    "那件事对您后来有什么影响呢？",
    "除了您之外，还有谁参与其中？他/她扮演了什么角色？"
];

let questionIndex = 0;

/**
 * [模拟] 获取AI的下一个引导性问题
 * @param {Array<object>} conversationHistory - 对话历史记录
 * @returns {Promise<object>} 返回包含下一个问题的对象 { next_question: string }
 */
export const getNextQuestion = async (conversationHistory) => {
    console.log("AI Service: Received conversation history: ", conversationHistory);
    await sleep(800); // 模拟网络延迟

    const nextQuestion = MOCK_QUESTIONS[questionIndex % MOCK_QUESTIONS.length];
    questionIndex++;
    
    console.log("AI Service: Sending next question: ", nextQuestion);
    return { next_question: nextQuestion };
};

/**
 * [模拟] 根据对话历史生成最终的回忆录故事
 * @param {Array<object>} conversationHistory - 对ahistor
 * @returns {Promise<object>} 返回包含标题和内容的故事对象 { title: string, content: string }
 */
export const generateMemoir = async (conversationHistory) => {
    console.log("AI Service: Received history to generate memoir: ", conversationHistory);
    await sleep(1500); // 模拟生成过程的网络延迟

    const finalStory = {
        title: "AI生成的美好回忆",
        theme: conversationHistory.length > 0 ? conversationHistory[0].theme : '自定义主题',
        content: "根据您刚才的讲述，AI将那些珍贵的片段编织成了一个动人的故事。这里是故事的正文内容，它详细记录了您分享的每一个细节和情感，成为了一段可以永久珍藏的文字记忆。"
    };

    console.log("AI Service: Generated final story: ", finalStory);
    return finalStory;
}; 