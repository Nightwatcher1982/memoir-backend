# ☁️ 云函数部署指南

## 概述

本指南将帮助您将时光留声后端服务部署到Railway等云函数平台，实现自动扩容、高可用性和简化运维的生产环境。

## 当前配置状态

✅ **Railway配置文件** - 已配置 `railway.json`
✅ **启动脚本** - 已配置 `npm start`
✅ **健康检查** - 已配置 `/` 端点健康检查
✅ **重启策略** - 已配置失败重启机制

## 支持的云平台

### 1. Railway 【推荐】

**为什么选择Railway？**
- 🚀 **简单易用**：直接从GitHub仓库部署
- 💰 **成本友好**：Pay-as-you-scale定价模式
- 🔄 **自动部署**：Git推送自动触发部署
- 🌐 **全球CDN**：自动提供HTTPS和全球访问
- 📊 **实时监控**：内置日志和监控仪表板

**部署步骤：**

#### 第一步：准备GitHub仓库
```bash
# 确保您的代码已推送到GitHub
cd memoir-backend/memoir-backend
git add .
git commit -m "Ready for Railway deployment"
git push origin main
```

#### 第二步：Railway部署
1. **访问Railway控制台**：https://railway.app/
2. **连接GitHub**：授权Railway访问您的仓库
3. **选择项目**：选择您的memoir项目仓库
4. **选择服务目录**：指定 `memoir-backend/memoir-backend/` 作为根目录
5. **环境变量配置**：在Railway控制台设置以下变量

#### 第三步：环境变量配置

在Railway控制台的"Variables"标签页添加：

```bash
# 必选：Moonshot AI配置
MOONSHOT_API_KEY=sk-your-moonshot-api-key-here

# 可选：讯飞语音合成配置
IFLYTEK_APPID=your-iflytek-appid
IFLYTEK_API_KEY=your-iflytek-api-key
IFLYTEK_API_SECRET=your-iflytek-api-secret

# 系统配置
NODE_ENV=production
PORT=3000
```

#### 第四步：域名配置
Railway会自动为您分配一个域名，格式类似：
`https://memoir-backend-production-xxxx.up.railway.app`

您也可以配置自定义域名。

### 2. 其他云平台选项

#### Vercel（适合Serverless）
```json
// vercel.json
{
  "version": 2,
  "builds": [
    {
      "src": "index.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/index.js"
    }
  ]
}
```

#### Heroku
```json
// Procfile
web: node index.js
```

#### 腾讯云函数
需要适配云函数入口格式，将Express应用包装为云函数。

## 前端配置更新

部署完成后，您需要更新前端的API端点配置：

<function_calls>
<invoke name="read_file">
<parameter name="target_file">memoir-backend/src/services/aiService.js
</code_block_to_apply_changes_from> 