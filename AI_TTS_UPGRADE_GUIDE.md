# 🎵 AI语音合成升级指南

## 当前状态
- ✅ 强制使用Railway云端API，确保AI服务正常接入
- ✅ 优化系统TTS语音参数，使用更自然的中文声音
- 🔄 后端已配置讯飞AI语音合成服务

## TTS升级方案

### 方案1: 使用React Native音频播放库
为了播放后端生成的AI语音，需要集成音频播放库：

```bash
# 安装音频播放库
npm install react-native-sound
npm install @react-native-async-storage/async-storage

# iOS需要额外配置
cd ios && pod install
```

### 方案2: 使用Expo AV (推荐)
```bash
# Expo项目推荐使用
expo install expo-av
```

### 方案3: Web Audio API (混合方案)
```javascript
// 在React Native Web中使用
const playAudioFromBlob = (audioBlob) => {
  const audioUrl = URL.createObjectURL(audioBlob);
  const audio = new Audio(audioUrl);
  audio.play();
};
```

## 后端TTS配置

### 讯飞语音API配置
确保Railway环境变量设置：
```
IFLYTEK_APPID=your-app-id
IFLYTEK_API_KEY=your-api-key  
IFLYTEK_API_SECRET=your-api-secret
```

### 测试TTS服务
```bash
curl -X POST https://memoir-backend-production-b9b6.up.railway.app/api/tts \
  -H "Content-Type: application/json" \
  -d '{"text": "这是一个语音测试"}'
```

## 前端实现步骤

### 1. 安装依赖
```bash
expo install expo-av
```

### 2. 更新TTS函数
```javascript
import { Audio } from 'expo-av';

const speakText = async (text) => {
  try {
    // 请求后端TTS
    const response = await fetch(`${API_BASE_URL}/api/tts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    });
    
    if (response.ok) {
      const audioBlob = await response.blob();
      const audioUri = URL.createObjectURL(audioBlob);
      
      // 播放AI语音
      const { sound } = await Audio.Sound.createAsync(
        { uri: audioUri },
        { shouldPlay: true }
      );
      
      return sound;
    }
  } catch (error) {
    console.log('AI TTS failed, using system voice');
    // 回退到系统语音
    await Speech.speak(text, {
      language: 'zh-CN',
      rate: 0.8,
      pitch: 1.1
    });
  }
};
```

### 3. 权限配置
确保`app.json`包含音频权限：
```json
{
  "expo": {
    "plugins": [
      [
        "expo-av",
        {
          "microphonePermission": "Allow $(PRODUCT_NAME) to access your microphone."
        }
      ]
    ]
  }
}
```

## 当前临时解决方案

由于完整的AI TTS集成需要额外的库安装和配置，目前采用了优化的系统语音：

- ✅ 使用更自然的中文语音引擎
- ✅ 优化语速和音调参数  
- ✅ 添加AI TTS服务探测
- ✅ 提供降级回退机制

## 完整升级步骤

1. **安装expo-av库**
2. **配置音频权限**
3. **实现音频播放逻辑** 
4. **测试AI TTS服务**
5. **配置讯飞语音环境变量**

## 预期效果

升级后将实现：
- 🎵 更自然、拟人化的AI语音
- 🔄 智能降级机制
- 📱 跨平台音频支持
- ⚡ 流畅的语音播放体验

---

💡 **提示**: 目前的语音已经优化，可以先测试当前效果，后续可以进一步升级为完整的AI语音服务。 