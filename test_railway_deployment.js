/**
 * Railway部署测试脚本
 * 用于验证后端API是否正常运行
 */

const axios = require('axios');

const RAILWAY_URL = 'https://memoir-backend-production-b9b6.up.railway.app';

async function testRailwayDeployment() {
    console.log('🚅 测试Railway部署...');
    console.log(`URL: ${RAILWAY_URL}`);
    console.log('-------------------');

    try {
        // 1. 测试健康检查
        console.log('1. 测试健康检查...');
        const healthResponse = await axios.get(`${RAILWAY_URL}/`);
        console.log('✅ 健康检查通过:', healthResponse.data);
        console.log('');

        // 2. 测试AI聊天接口
        console.log('2. 测试AI聊天接口...');
        const chatResponse = await axios.post(`${RAILWAY_URL}/api/chat`, {
            messages: [
                {
                    role: "user",
                    content: "您好，我想测试一下AI服务"
                }
            ],
            type: "question",
            theme: "童年时光"
        });
        console.log('✅ AI聊天接口正常:', chatResponse.data);
        console.log('');

        console.log('🎉 所有测试通过！Railway部署成功！');
        console.log('-------------------');
        console.log('前端现在可以使用以下URL访问AI服务:');
        console.log(`${RAILWAY_URL}`);

    } catch (error) {
        console.error('❌ 测试失败:', error.message);
        if (error.response) {
            console.error('响应状态:', error.response.status);
            console.error('响应数据:', error.response.data);
        }
        console.log('');
        console.log('请检查:');
        console.log('1. Railway服务是否正常运行');
        console.log('2. 环境变量MOONSHOT_API_KEY是否正确配置');
        console.log('3. 网络连接是否正常');
    }
}

// 运行测试
testRailwayDeployment(); 