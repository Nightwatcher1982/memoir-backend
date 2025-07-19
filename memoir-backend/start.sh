#!/bin/bash

echo "🚀 时光留声后端服务启动脚本"
echo "================================"

# 检查是否设置了环境变量
if [ -z "$MOONSHOT_API_KEY" ]; then
    echo "⚠️  注意：未检测到 MOONSHOT_API_KEY 环境变量"
    echo "📝 当前将使用智能模拟模式运行"
    echo ""
    echo "🔧 要启用真实AI，请运行："
    echo "   export MOONSHOT_API_KEY=\"sk-your-api-key-here\""
    echo "   然后重新启动此脚本"
    echo ""
else
    echo "✅ 检测到 Moonshot API 配置，将使用真实AI服务"
    echo "🔑 API Key: ${MOONSHOT_API_KEY:0:20}..."
    echo ""
fi

echo "🌟 启动后端服务..."
echo "📍 服务地址: http://localhost:3000"
echo "🔗 网络访问: http://192.168.3.115:3000"
echo ""
echo "按 Ctrl+C 停止服务"
echo "================================"

# 启动Node.js服务
npm start 