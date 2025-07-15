# 时光留声 (Time's Echo) - 完整部署指南

## 📱 项目简介
**时光留声**是一个专为老年用户设计的AI驱动回忆录创作应用，通过语音对话的方式帮助用户记录和分享人生故事。

## 🏗️ 技术架构
- **前端**: React Native + Expo (跨平台移动应用)
- **后端**: Node.js + Express (部署在Railway)
- **AI服务**: 
  - 月之暗面Kimi LLM (智能对话)
  - 讯飞语音 TTS API (语音合成)
- **数据存储**: AsyncStorage (本地存储)

## 🚀 在新电脑上快速部署

### 1. 环境准备
```bash
# 安装Node.js (推荐版本 18+)
# 从 https://nodejs.org/ 下载安装

# 安装Expo CLI
npm install -g @expo/cli

# 安装EAS CLI (用于构建)
npm install -g eas-cli
```

### 2. 克隆项目
```bash
git clone https://github.com/YOUR_USERNAME/time-echo-memoir.git
cd time-echo-memoir
```

### 3. 安装依赖
```bash
# 安装前端依赖
npm install

# 安装后端依赖
cd memoir-backend
npm install
cd ..
```

### 4. 环境配置

#### 后端环境变量
在 `memoir-backend/` 目录下创建 `.env` 文件：
```env
# 月之暗面API配置
MOONSHOT_API_KEY=your_moonshot_api_key_here

# 讯飞语音API配置
IFLYTEK_APP_ID=your_iflytek_app_id
IFLYTEK_API_SECRET=your_iflytek_api_secret
IFLYTEK_API_KEY=your_iflytek_api_key

# 服务端口
PORT=3000
```

### 5. 启动开发环境

#### 方法1: 使用本地后端
```bash
# 终端1: 启动后端服务
cd memoir-backend
node index.js

# 终端2: 启动前端
cd ..
npx expo start
```

#### 方法2: 使用生产后端
前端会自动连接到生产环境后端: `https://memoir-backend-production.up.railway.app`

### 6. 手机测试
1. 下载 **Expo Go** 应用
2. 扫描终端显示的二维码
3. 在应用中测试所有功能

### 7. 生产构建
```bash
# 登录Expo账户
eas login

# 配置构建
eas build:configure

# 构建iOS版本
eas build --platform ios

# 构建Android版本  
eas build --platform android
```

## 📂 项目结构
```
time-echo-memoir/
├── App.js                 # 应用入口
├── src/
│   ├── screens/           # 页面组件
│   ├── components/        # UI组件
│   ├── services/          # API服务
│   └── utils/            # 工具函数
├── memoir-backend/        # 后端服务
│   ├── index.js          # 服务入口
│   ├── routes/           # API路由
│   └── services/         # AI服务集成
├── app.json              # Expo配置
├── eas.json              # EAS构建配置
└── package.json          # 依赖管理
```

## 🔑 必需的API密钥

### 1. 月之暗面Kimi API
- 访问: https://platform.moonshot.cn/
- 注册账户并获取API密钥
- 用于AI对话功能

### 2. 讯飞语音API
- 访问: https://www.xfyun.cn/
- 注册开发者账户
- 创建语音合成应用获取密钥
- 用于语音播放功能

## 🌐 网络配置

### 本地开发网络问题解决
如果遇到手机无法连接的情况：

1. **检查网络**:
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
```

2. **使用不同启动模式**:
```bash
# LAN模式
npx expo start --host=lan

# localhost模式 (仅模拟器)
npx expo start --localhost

# 清除缓存重启
npx expo start --clear
```

3. **防火墙设置**: 确保8081端口未被阻止

## 🚨 常见问题解决

### 1. 依赖版本冲突
```bash
# 重新安装依赖
rm -rf node_modules package-lock.json
npm install
```

### 2. Metro缓存问题
```bash
npx expo start --clear
```

### 3. iOS构建失败
```bash
# 清理iOS构建缓存
cd ios && rm -rf Pods && pod install
```

### 4. Android构建失败
```bash
# 清理Android构建
cd android && ./gradlew clean
```

## 📱 部署到应用商店

### TestFlight (iOS)
1. 确保有Apple Developer账户
2. 运行 `eas build --platform ios`
3. 构建完成后自动上传到TestFlight

### Google Play (Android)
1. 运行 `eas build --platform android`
2. 下载生成的APK/AAB文件
3. 手动上传到Google Play Console

## 🔧 生产环境维护

### 后端部署 (Railway)
- 仓库: `memoir-backend-production`
- 域名: `memoir-backend-production.up.railway.app`
- 自动部署: Git推送触发

### 监控和日志
- Railway控制台查看服务状态
- 应用内错误日志自动上报

## 💡 开发建议

1. **代码规范**: 使用ESLint和Prettier
2. **版本控制**: 及时提交代码更改
3. **测试**: 在多种设备上测试
4. **性能**: 监控应用启动时间和内存使用
5. **用户体验**: 针对老年用户优化界面

## 📞 技术支持
如有问题，请联系开发团队或查看项目文档。 