# 时光留声后端服务

## 功能特性

- **TTS服务**: 基于讯飞语音合成的文本转语音API
- **LLM服务**: 基于月之暗面Kimi的智能对话API
- **CORS支持**: 跨域资源共享配置
- **健康检查**: 服务状态监控端点

## API接口

### 1. 健康检查
```
GET /
```

### 2. 文本转语音
```
POST /api/tts
Content-Type: application/json

{
  "text": "要合成的文本内容"
}
```

### 3. AI对话
```
POST /api/chat
Content-Type: application/json

{
  "messages": [
    {"role": "user", "content": "用户消息"},
    {"role": "assistant", "content": "AI回复"}
  ],
  "type": "question" | "memoir"
}
```

## 环境变量

部署时需要设置以下环境变量：

```
# 讯飞语音合成
IFLYTEK_APPID=your_iflytek_appid
IFLYTEK_API_KEY=your_iflytek_api_key
IFLYTEK_API_SECRET=your_iflytek_api_secret

# 月之暗面Kimi
MOONSHOT_API_KEY=your_moonshot_api_key

# 服务端口（可选，默认3000）
PORT=3000
```

## 本地开发

1. 安装依赖：
```bash
npm install
```

2. 设置环境变量：
```bash
export IFLYTEK_APPID=your_appid
export IFLYTEK_API_KEY=your_api_key
export IFLYTEK_API_SECRET=your_api_secret
export MOONSHOT_API_KEY=your_moonshot_key
```

3. 启动服务：
```bash
npm start
```

## Railway部署

1. 将代码推送到GitHub仓库
2. 在Railway中连接GitHub仓库
3. 配置环境变量
4. 部署服务

服务将自动部署并提供公网访问地址。 