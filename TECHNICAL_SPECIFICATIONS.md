### **“时光留声”AI回忆录助手 - 技术规格说明书**

#### **1. 项目概述**

本文档为“时光留声”App提供技术实现层面的详细规划。旨在定义项目的技术栈、架构、关键模块实现方案、数据结构和API接口，作为后续开发工作的核心指导。

---

#### **2. 技术栈 (Technology Stack)**

- **核心框架:** React Native (with Expo)
  - **理由:** 一次开发，可同时部署于iOS和Android，极大提升开发效率。“小而美”项目的理想选择。Expo进一步简化了开发和部署流程。
- **导航:** React Navigation
  - **理由:** React Native生态中最主流、最成熟的导航解决方案，提供灵活的堆栈式导航（Stack Navigator）能力。
- **编程语言:** JavaScript (ES6+)
- **状态管理:** React Context API
  - **理由:** 对于当前规划的应用规模，Context API足够轻量且高效，可以满足全局状态（如用户回忆录列表）的管理需求，无需引入更重的状态管理库。
- **本地存储:** AsyncStorage
  - **理由:** React Native内置的简单的键值对存储系统，适合持久化存储用户的回忆录数据。

---

#### **3. 应用架构**

**3.1. 目录结构**
采用模块化的目录结构，保证代码的可维护性：
```
/src
├── assets/         # 存放图片、字体等静态资源
├── components/     # 存放可复用的UI组件 (如：自定义按钮, 卡片)
├── navigation/     # 存放导航器配置 (AppNavigator.js)
├── screens/        # 存放各个页面级组件 (HomeScreen.js, etc.)
└── services/       # 存放与外部API、本地存储交互的逻辑
```

**3.2. 导航流程**
- 使用 `@react-navigation/stack` 创建一个主堆栈导航器。
- 初始路由为 `Home` (主屏幕)。
- 页面流转遵循 `PRODUCT_REQUIREMENTS.md` 中定义的用户流程图。
- 所有页面默认禁用原生头部 (`headerShown: false`)，以实现自定义的极简UI。

**3.3. 数据模型**
定义核心数据对象“回忆录章节 (MemoirChapter)”：
```javascript
{
  id: string,       // 唯一标识符 (如：UUID或时间戳)
  title: string,      // AI生成的章节标题
  theme: string,      // 本次回忆的主题 (如："童年时光")
  content: string,    // AI生成的回忆录正文
  createdAt: string,  // 创建日期 (ISO 8601 格式字符串)
  audioPath: string | null // (未来) 本地存储的用户原声音频文件路径
}
```

---

#### **4. 核心功能实现方案**

**4.1. 语音交互模块 (对话访谈页)**
这是应用的核心，技术实现最为复杂，需要整合三个关键技术：

- **语音转文本 (STT - Speech to Text):**
  - **方案:** 引入第三方库，如 `@react-native-voice/voice`。
  - **流程:**
    1. 用户点击“录音”按钮，启动语音识别。
    2. 库将实时或在录音结束后，将用户的语音流转换为文本字符串。
    3. 需要处理权限请求（麦克风访问）。

- **文本到语音 (TTS - Text to Speech):**
  - **方案:** 使用 `expo-speech` 模块。
  - **流程:**
    1. 当需要AI提问或朗读文章时，调用 `Speech.speak()` 方法。
    2. 将AI的文本问题作为参数传入。
    3. 可配置语音的音调、语速和语言，以达到拟人化的效果。

- **AI对话引擎集成:**
  - **方案:** 在 `src/services/aiService.js` 中封装与后端大语言模型(LLM)的交互逻辑。
  - **接口定义 (伪代码):**
    ```javascript
    // 函数1: 获取引导性问题
    async function getNextQuestion(userResponseText, conversationHistory) {
      // POST请求到后端API (e.g., /api/chat)
      // body: {
      //   user_response: userResponseText,
      //   history: conversationHistory
      // }
      // 返回值: { next_question: "AI提出的下一个问题" }
    }

    // 函数2: 生成最终故事
    async function generateMemoir(conversationHistory) {
      // POST请求到后端API (e.g., /api/generate)
      // body: { history: conversationHistory }
      // 返回值: { title: "故事标题", content: "故事正文" }
    }
    ```

**4.2. 本地数据持久化**
- **方案:** 在 `src/services/storageService.js` 中封装 `AsyncStorage` 的操作。
- **接口定义 (伪代码):**
  ```javascript
  // 获取所有回忆录
  async function getAllMemoirs() { /* ... */ }

  // 保存一篇新的回忆录
  async function saveMemoir(memoirChapter) { /* ... */ }

  // 删除一篇回忆录
  async function deleteMemoir(memoirId) { /* ... */ }
  ```
  所有回忆录章节将以一个JSON数组的形式，存储在同一个键（如 `@MemoirChapters`）下。

---

#### **5. 里程碑规划 (Milestones)**

1.  **里程碑 1 (已完成):**
    - [x] 项目初始化和技术栈配置。
    - [x] 主屏幕UI和导航占位。

2.  **里程碑 2:**
    - [ ] 场景选择页面UI。
    - [ ] 回忆录列表页面UI。
    - [ ] 故事预览页面UI。
    - [ ] 完成各页面间的导航连接。

3.  **里程碑 3:**
    - [ ] 实现本地存储 `storageService`，并与回忆录列表页对接。
    - [ ] 集成 `expo-speech` 实现“朗读”功能。

4.  **里程碑 4 (核心攻坚):**
    - [ ] 集成 `@react-native-voice/voice` 实现语音输入。
    - [ ] 开发 `aiService` 并与后端API联调（或使用模拟数据）。
    - [ ] 将STT、TTS和AI服务整合到对话访谈页，完成核心交互闭环。

5.  **里程碑 5:**
    - [ ] 实现分享到微信的功能。
    - [ ] 全面测试和UI细节打磨。

---