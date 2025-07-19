# Railway 环境变量配置

## 在Railway控制台的"Variables"标签页添加以下变量：

### 必需的环境变量
```
MOONSHOT_API_KEY=sk-your-moonshot-api-key-here
NODE_ENV=production
```

### 可选的环境变量（语音合成功能）
```
IFLYTEK_APPID=your-iflytek-appid
IFLYTEK_API_KEY=your-iflytek-api-key
IFLYTEK_API_SECRET=your-iflytek-api-secret
```

### 系统默认变量（Railway自动设置）
```
PORT=3000  # Railway会自动设置，无需手动配置
```

## 配置步骤
1. 登录Railway控制台
2. 选择您的memoir-backend项目
3. 点击"Variables"标签页
4. 逐一添加上述环境变量
5. 保存后Railway会自动重新部署

## 安全提示
⚠️ 不要将真实的API密钥提交到Git仓库
✅ 仅在Railway控制台中配置敏感信息 