# 🚅 Railway重新部署步骤指南

## 项目信息
- **Railway项目名**: wonderful-mindfulness
- **GitHub仓库**: https://github.com/Nightwatcher1982/memoir-backend.git
- **部署目录**: memoir-backend/memoir-backend/

## 重新部署步骤

### 1. 访问Railway控制台
- 登录 https://railway.app/
- 找到并点击"wonderful-mindfulness"项目

### 2. 检查GitHub连接
- 确认项目已连接到正确的GitHub仓库
- 验证部署分支设置为 `main`
- 确认根目录设置为 `memoir-backend/memoir-backend/`

### 3. 配置环境变量（重要！）
在"Variables"标签页添加以下环境变量：

#### 必需变量：
```
MOONSHOT_API_KEY=sk-your-moonshot-api-key-here
NODE_ENV=production
```

#### 可选变量（语音合成功能）：
```
IFLYTEK_APPID=your-iflytek-appid
IFLYTEK_API_KEY=your-iflytek-api-key
IFLYTEK_API_SECRET=your-iflytek-api-secret
```

### 4. 检查构建配置
确认 `railway.json` 配置：
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "npm start",
    "healthcheckPath": "/",
    "healthcheckTimeout": 300,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

### 5. 触发重新部署
有几种方式触发重新部署：

#### 方式A：手动重新部署
1. 在Railway控制台中点击"Deploy"按钮
2. 选择"Redeploy"
3. 等待构建完成

#### 方式B：自动部署（推荐）
- 如果GitHub集成正确配置，推送代码会自动触发部署
- 我们刚才的代码推送应该已经触发了自动部署

### 6. 监控部署状态
在Railway控制台观察：
- **构建日志**: 查看npm install和构建过程
- **部署日志**: 查看应用启动日志
- **状态指示器**: 确认服务运行状态

### 7. 验证部署
#### 健康检查
部署成功后，访问：
```
https://wonderful-mindfulness-production-xxxx.up.railway.app/
```

应该返回：
```json
{
  "message": "时光留声 AI回忆录助手 - 后端服务",
  "status": "running",
  "timestamp": "2024-..."
}
```

#### API测试
测试AI接口：
```bash
curl -X POST https://your-railway-url.up.railway.app/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [{"role": "user", "content": "测试"}],
    "type": "question",
    "theme": "童年时光"
  }'
```

### 8. 更新前端配置
确认前端 `src/services/aiService.js` 中的URL配置：
```javascript
const API_BASE_URL = __DEV__ 
  ? 'http://192.168.3.115:3000'  // 本地开发
  : 'https://wonderful-mindfulness-production-xxxx.up.railway.app';  // 生产环境
```

## 常见问题解决

### 构建失败
- 检查 `package.json` 中的依赖项
- 确认Node.js版本兼容性
- 查看构建日志中的错误信息

### 应用启动失败
- 确认 `npm start` 脚本正确
- 检查环境变量是否设置
- 验证 `index.js` 文件路径

### API调用失败
- 确认健康检查端点正常
- 检查CORS配置
- 验证HTTPS证书

## 预期结果

部署成功后，您将拥有：
- ✅ 全球可访问的HTTPS API服务
- ✅ 自动扩容和高可用性
- ✅ 实时监控和日志记录
- ✅ 与GitHub的自动CI/CD集成

---

💡 **提示**: 如果部署仍然失败，请检查Railway控制台的详细错误日志，可能需要调整配置或修复代码问题。 