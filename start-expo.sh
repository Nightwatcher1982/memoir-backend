#!/bin/bash
# Expo 启动脚本 - 确保在正确目录运行

echo "🚀 切换到正确的Expo项目目录..."
cd /Volumes/PSSD/new-memo/memoir-backend

echo "🧹 清理缓存..."
rm -rf .expo .metro node_modules/.cache

echo "🔄 启动Expo开发服务器..."
npx expo start --clear --reset-cache

echo "✅ Expo启动完成！" 