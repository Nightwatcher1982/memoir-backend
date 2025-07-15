# 时光留声 - 部署指南

## 项目概述

时光留声是一款专为银发族设计的AI回忆录助手，通过语音交互帮助老年用户记录珍贵的人生故事。

## 技术架构

- **前端**: React Native + Expo
- **后端**: Node.js + Express
- **AI服务**: 
  - 语音合成：讯飞TTS
  - 智能对话：月之暗面Kimi
- **部署平台**: Railway

## 部署步骤

### 1. 申请API密钥

#### 讯飞语音合成服务
1. 访问 [讯飞开放平台](https://console.xfyun.cn/)
2. 注册账号并实名认证
3. 创建新应用，选择"语音合成"服务
4. 获取 `APPID`、`API Key` 和 `API Secret`

#### 月之暗面Kimi API
1. 访问 [月之暗面开放平台](https://platform.moonshot.cn/)
2. 注册账号并完成认证
3. 创建API密钥
4. 获取 `API Key`

### 2. 部署后端服务到Railway

#### 方法一：GitHub集成（推荐）
1. 将代码推送到GitHub仓库
2. 访问 [Railway](https://railway.app/)
3. 使用GitHub账号登录
4. 点击"New Project" → "Deploy from GitHub repo"
5. 选择你的仓库和`memoir-backend`目录
6. 配置环境变量：
   ```
   IFLYTEK_APPID=你的讯飞APPID
   IFLYTEK_API_KEY=你的讯飞API_KEY
   IFLYTEK_API_SECRET=你的讯飞API_SECRET
   MOONSHOT_API_KEY=你的月之暗面API_KEY
   ```
7. 部署完成后获取服务URL

#### 方法二：本地上传
1. 在Railway中创建新项目
2. 选择"Deploy from local directory"
3. 上传`memoir-backend`文件夹
4. 配置环境变量（同上）
5. 部署并获取服务URL

### 3. 更新前端配置

1. 打开 `src/services/aiService.js`
2. 将 `API_BASE_URL` 中的Railway域名替换为你的实际域名：
   ```javascript
   const API_BASE_URL = __DEV__ ? 'http://localhost:3000' : 'https://your-actual-domain.up.railway.app';
   ```

### 4. 测试部署

1. 启动前端应用：
   ```bash
   npx expo start
   ```

2. 测试后端API：
   ```bash
   curl https://your-domain.up.railway.app/
   ```

3. 在移动设备上测试完整对话流程

## 本地开发

### 后端开发
```bash
cd memoir-backend
npm install
# 设置环境变量
export IFLYTEK_APPID=your_appid
export IFLYTEK_API_KEY=your_api_key
export IFLYTEK_API_SECRET=your_api_secret
export MOONSHOT_API_KEY=your_moonshot_key
npm start
```

### 前端开发
```bash
npm install
npx expo start
```

## 常见问题

### 1. 语音合成不工作
- 检查讯飞API密钥是否正确配置
- 确认讯飞账号余额充足
- 查看后端日志中的错误信息

### 2. AI对话无响应
- 检查月之暗面API密钥是否有效
- 确认API配额是否充足
- 检查网络连接是否正常

### 3. 前端无法连接后端
- 确认后端服务正在运行
- 检查API_BASE_URL配置是否正确
- 确认CORS配置允许前端域名

## 监控和维护

1. 定期检查API配额使用情况
2. 监控服务器性能和错误日志
3. 定期备份用户数据
4. 更新依赖包和安全补丁

## 成本估算

- Railway托管：$5-20/月（根据使用量）
- 讯飞TTS：约0.002元/千字符
- 月之暗面API：约0.012元/千tokens

## 技术支持

如有问题，请查看：
1. 项目README文件
2. 各服务商的官方文档
3. GitHub Issues页面 