# 🎵 讯飞语音API接入指南

## 步骤1: 获取讯飞API密钥

### 1.1 注册讯飞开放平台
1. 访问 [讯飞开放平台](https://www.xfyun.cn/)
2. 注册账号（支持手机号注册）
3. 完成实名认证

### 1.2 创建语音合成应用
1. 登录后点击"控制台"
2. 选择"语音合成" -> "在线语音合成"
3. 点击"创建新应用"
4. 填写应用信息：
   - 应用名称：时光留声AI助手
   - 应用描述：智能回忆录语音助手
   - 应用领域：选择"教育"或"生活服务"
5. 创建成功后获取三个关键信息：
   - **APPID**: 应用ID
   - **APIKey**: API密钥
   - **APISecret**: API密钥

### 1.3 记录API信息
```
APPID: xxxxxxxx
APIKey: xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
APISecret: xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

## 步骤2: 在Railway配置环境变量

### 2.1 访问Railway项目设置
1. 登录 [Railway](https://railway.app/)
2. 找到项目 "wonderful-mindfulness"
3. 点击项目进入控制台
4. 选择 "memoir-backend" 服务
5. 点击 "Variables" 标签页

### 2.2 添加环境变量
在Variables页面添加以下三个环境变量：

```
名称: IFLYTEK_APPID
值: [您的APPID]

名称: IFLYTEK_API_KEY  
值: [您的APIKey]

名称: IFLYTEK_API_SECRET
值: [您的APISecret]
```

### 2.3 保存并重新部署
1. 点击"Save"保存环境变量
2. Railway会自动重新部署服务
3. 等待部署完成（约1-2分钟）

## 步骤3: 验证TTS服务

### 3.1 测试API连接
部署完成后，测试TTS服务：

```bash
curl -X POST https://memoir-backend-production-b9b6.up.railway.app/api/tts \
  -H "Content-Type: application/json" \
  -d '{"text": "您好，这是讯飞语音测试"}'
```

### 3.2 成功响应
如果配置正确，会返回音频数据（二进制流）

### 3.3 失败响应
如果返回以下错误：
```json
{"error": "TTS service not configured"}
```
说明环境变量未正确配置。

## 步骤4: 前端集成测试

### 4.1 应用重新启动
环境变量配置完成后：
1. 重新启动您的React Native应用
2. 测试语音播放功能

### 4.2 期待效果
- 控制台显示："🎵 使用AI语音服务播放"
- 听到更自然、拟人化的中文语音
- 不再显示"TTS服务不可用"

## 步骤5: 高级配置（可选）

### 5.1 语音参数调整
如需调整语音效果，可在后端修改以下参数：
- `vcn`: 语音人选择（xiaoyan, aisjiuxu等）
- `speed`: 语速 (0-100)
- `volume`: 音量 (0-100) 
- `pitch`: 音调 (0-100)

### 5.2 当前配置
```javascript
// memoir-backend/memoir-backend/index.js
business: { 
    aue: 'raw', 
    vcn: 'xiaoyan',     // 晓燕语音（温和女声）
    tte: 'UTF8',
    speed: 40,          // 语速适中
    volume: 80,         // 音量80%
    pitch: 50           // 标准音调
}
```

## 常见问题

### Q1: 环境变量不生效
**A**: 确保在Railway控制台保存后等待重新部署完成

### Q2: API调用失败
**A**: 检查API密钥是否正确，确保讯飞账户余额充足

### Q3: 语音播放异常
**A**: 检查网络连接，确保设备音量开启

### Q4: 语音质量不满意
**A**: 可调整后端语音参数或更换语音人

## 联系支持
如遇到问题，可以：
1. 查看Railway部署日志
2. 检查讯飞开放平台控制台
3. 测试本地API调用

---

💡 **提示**: 讯飞语音合成服务按调用次数计费，建议在正式使用前测试语音效果是否满意。 