# 🚨 Railway根目录配置修复指南

## 问题诊断
Railway错误显示它在尝试运行React Native前端代码而不是后端代码：
```
import 'react-native-gesture-handler'; // 必须放在第一行
```

这表明Railway的**根目录设置错误**，它在部署整个项目而不是后端子目录。

## 解决方案

### 方法1: 在Railway控制台中设置根目录 (推荐)

1. **登录Railway控制台**
   - 访问 https://railway.app/
   - 进入 "wonderful-mindfulness" 项目

2. **修改服务设置**
   - 点击您的服务
   - 进入 "Settings" 标签页
   - 找到 "Source" 或 "Build" 部分

3. **设置根目录**
   - 在 "Root Directory" 字段中输入: `memoir-backend/memoir-backend`
   - 或者在 "Watch Paths" 中设置: `memoir-backend/memoir-backend/**`

4. **确认其他设置**
   - Build Command: `npm install` (应该自动检测)
   - Start Command: `npm start` (应该自动检测)

### 方法2: 使用Nixpacks配置文件

我们已经创建了 `nixpacks.toml` 文件来指定构建配置。这个文件应该能帮助Railway正确识别构建环境。

### 方法3: 重新配置GitHub集成

如果上述方法不起作用：

1. **断开GitHub连接**
   - 在Railway项目设置中断开GitHub集成

2. **重新连接并配置**
   - 重新连接GitHub仓库
   - 选择仓库: `Nightwatcher1982/memoir-backend`
   - **关键**: 设置部署目录为 `memoir-backend/memoir-backend`

3. **验证配置**
   - 确认Branch为 `main`
   - 确认监视路径正确

## 验证修复

修复后，Railway构建日志应该显示：
```bash
# 正确的构建输出应该是这样的：
> memoir-backend@1.0.0 start
> node index.js

时光留声后端服务运行在端口 3000
Health check: http://localhost:3000/
```

而不是React Native的错误。

## 环境变量设置

确保在Railway Variables中设置：
```
MOONSHOT_API_KEY=sk-your-key-here
NODE_ENV=production
PORT=3000
```

## 如果问题仍然存在

1. **检查Railway日志**
   - 查看详细的构建和部署日志
   - 确认它是否在正确的目录中运行

2. **手动重新部署**
   - 在Railway控制台中点击 "Deploy" 
   - 选择 "Redeploy"

3. **联系支持**
   - 如果配置正确但仍有问题，可能需要联系Railway支持

---

💡 **关键点**: Railway必须知道要部署 `memoir-backend/memoir-backend/` 目录而不是项目根目录，因为根目录包含React Native前端代码。 