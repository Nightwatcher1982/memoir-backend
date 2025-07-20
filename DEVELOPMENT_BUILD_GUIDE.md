# 时光留声 - Development Build 语音功能指南

## 🎯 为什么需要Development Build

**语音识别功能**需要使用原生模块`@react-native-voice/voice`，而Expo Go环境不支持这些原生模块。Development Build是唯一能够完整体验语音功能的方案。

## 📱 当前构建状态

### ✅ 已完成配置
- **权限配置**: 麦克风和语音识别权限已在app.json配置
- **语音模块**: `@react-native-voice/voice`已安装
- **Development Client**: `expo-dev-client`已配置
- **Podfile**: 已修复项目路径配置

### 🔄 正在构建
当前正在运行`npx expo run:ios`构建iOS Development Build

## 🎤 语音功能对比

| 功能 | Expo Go | Development Build |
|------|---------|-------------------|
| **AI语音朗读** | ✅ 完全支持 | ✅ 完全支持 |
| **语音识别输入** | ❌ 不支持 | ✅ 完全支持 |
| **手动文字输入** | ✅ 支持 | ✅ 支持 |
| **完整语音交互** | ❌ 不支持 | ✅ 完全支持 |

## 📋 构建步骤

### 1. 本地构建 (推荐)
```bash
# 修复Podfile配置 (已完成)
echo "project 'app.xcodeproj'" >> ios/Podfile

# 构建iOS Development Build
npx expo run:ios

# 构建Android Development Build  
npx expo run:android
```

### 2. 云端构建 (备选方案)
```bash
# 安装EAS CLI
sudo npm install -g eas-cli

# 登录Expo账户
eas login

# 构建iOS
eas build --platform ios --profile development

# 构建Android
eas build --platform android --profile development
```

## 🚀 使用步骤

### 构建完成后：

1. **启动服务**
   ```bash
   # 启动后端
   cd memoir-backend && npm start
   
   # 启动Metro (如果本地构建)
   npx expo start --dev-client
   ```

2. **安装应用**
   - iOS: 构建完成后会自动安装到模拟器/设备
   - Android: 类似流程

3. **测试语音功能**
   - 打开应用
   - 选择场景 (童年时光/求学之路/时代记忆)
   - 听AI朗读问题
   - **使用语音回答** (新功能!)
   - 体验完整语音交互

## 🎤 语音功能详解

### 新增语音输入能力：
- **语音转文字**: 实时将语音转换为文字
- **多轮对话**: 支持连续语音交互
- **智能识别**: 支持中文语音识别
- **错误处理**: 语音失败时自动降级到文字输入

### 用户体验流程：
1. **AI朗读问题** 🔊
2. **点击录音按钮** 🎤
3. **说话回答** 🗣️
4. **语音转文字** ✍️
5. **AI生成下一个问题** 🤖
6. **循环对话直到完成** 🔄

## 📱 权限说明

### iOS权限
- `NSMicrophoneUsageDescription`: 录制语音回答
- `NSSpeechRecognitionUsageDescription`: 语音转文字

### Android权限  
- `RECORD_AUDIO`: 录音权限
- `INTERNET`: 网络语音识别

## 🔧 故障排除

### 构建问题
- **CocoaPods错误**: 已修复Podfile配置
- **权限拒绝**: 确保麦克风权限已授予
- **网络问题**: 确保后端服务运行在192.168.3.115:3000

### 语音问题  
- **无法录音**: 检查设备麦克风权限
- **识别失败**: 网络连接问题，会自动降级到文字输入
- **听不到朗读**: 检查设备音量和静音设置

## 💡 使用建议

### 最佳体验：
1. **在安静环境使用语音功能**
2. **说话清晰，语速适中**  
3. **确保网络连接稳定**
4. **首次使用时允许所有权限**

### 备选方案：
- 语音不可用时，应用会自动显示文字输入
- 所有功能都有手动输入备选方案
- 确保完整的用户体验

## 🎯 完整功能清单

Development Build将提供：

✅ **AI智能对话** - 上下文理解的问答
✅ **语音朗读** - AI问题自动朗读  
✅ **语音识别** - 用户语音转文字
✅ **手动输入** - 文字输入备选方案
✅ **回忆录生成** - 个性化内容创作
✅ **多主题支持** - 童年、求学、时代记忆
✅ **对话历史** - 完整的交互记录

构建完成后，您将拥有完整的语音交互体验！ 