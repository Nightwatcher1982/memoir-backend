# 🤖 AI服务接入指南

## 概述

您的时光留声应用现在支持真实的AI服务！本指南将帮助您配置和使用真正的AI来生成个性化的回忆录问题和内容。

## 当前状态

✅ **语音识别功能** - 已完美运行
✅ **Development Build** - 已成功创建和部署  
✅ **后端服务架构** - 已完全准备就绪
🔄 **AI服务** - 准备接入真实AI（当前使用智能模拟）

## 支持的AI服务

### 1. Moonshot AI (Kimi) 【推荐】

**为什么选择 Moonshot AI？**
- 🇨🇳 **中文优化**：专门针对中文场景优化，非常适合回忆录项目
- 💰 **成本友好**：相比其他服务更经济实惠
- 🚀 **快速响应**：API响应速度快，用户体验好
- 🛡️ **数据安全**：符合国内数据安全要求

**配置步骤：**

1. **注册账户**
   - 访问：https://platform.moonshot.cn/
   - 注册并完成实名认证

2. **获取API密钥**
   - 登录控制台
   - 前往"API密钥管理"
   - 创建新密钥（建议命名为"memoir-app"）
   - 复制密钥（格式类似：`sk-xxxxxxxxxxxxxxxx`）

3. **配置环境变量**
   ```bash
   # 在终端中运行（替换为您的真实密钥）：
   export MOONSHOT_API_KEY="sk-your-actual-api-key-here"
   
   # 重启后端服务：
   cd memoir-backend/memoir-backend
   ./start.sh
   ```

4. **验证配置**
   - 启动脚本会显示"✅ 检测到 Moonshot API 配置"
   - 在应用中测试，AI回复应该变得更加智能和个性化

## 预期效果对比

### 🤖 智能模拟模式（当前）
- 使用预设的问题模板
- 回复相对固定和通用
- 适合开发和测试阶段

### 🧠 真实AI模式（配置后）
- **个性化问题**：AI根据您的回答生成个性化的后续问题
- **深度挖掘**：AI会基于您的回忆深入挖掘更多细节
- **情感理解**：AI能理解情感色彩，提出更贴心的问题
- **智能总结**：生成的回忆录内容更加丰富和个性化

### 示例对比

**模拟模式**：
- 用户："我小时候喜欢爬树"
- 回复："能跟我详细说说您印象最深刻的童年回忆吗？"

**真实AI模式**：
- 用户："我小时候喜欢爬树"  
- 回复："爬树一定很有趣！您还记得最高爬到过什么树吗？当时的心情是怎样的？有没有遇到过什么有趣或惊险的经历？"

## 成本估算

**Moonshot AI 定价（参考）**：
- 输入：¥0.12/1k tokens
- 输出：¥0.12/1k tokens
- 一次对话约消耗 100-300 tokens
- **估算成本**：100次对话约 ¥2-6 人民币

**使用建议**：
- 开发阶段：继续使用模拟模式
- 演示阶段：配置真实AI增强效果
- 生产环境：根据用户量配置合适的配额

## 常见问题

### Q: 如果API密钥配置错误会怎样？
A: 系统会自动回退到智能模拟模式，确保应用正常运行。

### Q: 可以同时支持多个AI服务吗？
A: 当前版本专门优化了Moonshot AI，后续可以扩展支持其他服务。

### Q: AI生成的内容质量如何？
A: Moonshot AI在中文理解和生成方面表现优秀，特别适合回忆录这种情感丰富的内容。

### Q: 数据安全如何保障？
A: 所有对话数据都通过HTTPS加密传输，不会在AI服务器端持久存储。

## 技术支持

如果在配置过程中遇到问题：

1. **检查网络连接**：确保可以访问 https://api.moonshot.cn
2. **验证API密钥**：确保密钥格式正确且有效
3. **查看后端日志**：运行 `./start.sh` 查看详细错误信息
4. **回退方案**：删除环境变量，系统会自动使用模拟模式

## 下一步

配置完真实AI后，您可以：

1. **测试对话流程**：体验AI的个性化问题生成
2. **优化提示词**：根据需要调整AI的问题风格
3. **扩展功能**：增加更多主题和对话场景
4. **性能监控**：监控API使用量和响应时间

---

🎉 **恭喜！您的时光留声应用现在具备了完整的语音交互和AI对话能力！** 