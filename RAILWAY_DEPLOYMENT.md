# 🚅 Railway 云部署指南

## 当前状态
✅ Railway配置文件已就绪
✅ 后端服务架构完善
✅ API接口测试通过

## 快速部署步骤

### 1. 确保代码已推送到GitHub
```bash
cd memoir-backend/memoir-backend
git add .
git commit -m "Ready for Railway deployment with AI integration"
git push origin main
```

### 2. Railway控制台部署
1. 访问 https://railway.app/ 并登录
2. 点击 "New Project" -> "Deploy from GitHub repo"
3. 选择您的memoir项目仓库
4. 选择 `memoir-backend/memoir-backend` 作为根目录
5. Railway会自动检测到Node.js项目并开始构建

### 3. 环境变量配置
在Railway项目的 "Variables" 标签页添加：
```
MOONSHOT_API_KEY=sk-your-api-key-here
NODE_ENV=production
```

### 4. 获取部署URL
部署完成后，Railway会分配一个URL，类似：
`https://memoir-backend-production-xxxx.up.railway.app`

## 前端配置更新

### 更新API服务地址
编辑 `src/services/aiService.js`，将API_BASE_URL更新为Railway部署的URL：

```javascript
// 生产环境使用Railway URL
const API_BASE_URL = 'https://your-railway-app-url.up.railway.app';

// 或者使用环境检测
const API_BASE_URL = __DEV__ 
  ? 'http://192.168.3.115:3000'  // 本地开发
  : 'https://your-railway-app-url.up.railway.app';  // 生产环境
```

### 重新构建应用
```bash
cd memoir-backend
npx expo start --dev-client
```

## 验证部署

### 1. 健康检查
访问：`https://your-railway-url.up.railway.app/`
应该返回：
```json
{
  "message": "时光留声 AI回忆录助手 - 后端服务",
  "status": "running",
  "timestamp": "2024-..."
}
```

### 2. API测试
```bash
curl -X POST https://your-railway-url.up.railway.app/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [{"role": "user", "content": "测试"}],
    "type": "question",
    "theme": "童年时光"
  }'
```

## 监控和日志

### Railway仪表板
- **实时日志**：在Railway控制台查看应用日志
- **监控指标**：CPU、内存、网络使用情况
- **部署历史**：查看每次部署的状态

### 常用监控命令
```bash
# 查看实时日志
railway logs --follow

# 查看服务状态
railway status
```

## 故障排除

### 常见问题
1. **构建失败**：检查package.json中的依赖项
2. **启动失败**：确认PORT环境变量配置
3. **API调用失败**：检查CORS配置和HTTPS

### 调试步骤
1. 检查Railway控制台的构建日志
2. 验证环境变量是否正确设置
3. 测试健康检查端点
4. 查看运行时日志

## 成本估算

**Railway定价**：
- 免费额度：500小时/月
- Pro计划：$5/月起
- 按用量计费，休眠时不收费

**推荐配置**：
- 开发阶段：使用免费额度
- 生产环境：Pro计划，约$5-20/月

---

🎉 **部署完成后，您的应用将拥有：**
- 24/7高可用服务
- 自动HTTPS和全球访问
- 实时监控和日志
- 自动扩容能力 