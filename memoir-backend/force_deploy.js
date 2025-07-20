/**
 * Railway强制部署检测和指导脚本
 * 检查部署状态，提供手动部署指导
 */

const https = require('https');
const { exec } = require('child_process');

const RAILWAY_SERVICE_URL = 'https://memoir-backend-production-b9b6.up.railway.app';

// 获取当前commit信息
function getCurrentCommit() {
    return new Promise((resolve, reject) => {
        exec('git rev-parse HEAD', (error, stdout, stderr) => {
            if (error) {
                reject(error);
                return;
            }
            resolve(stdout.trim());
        });
    });
}

// 检查服务状态
function checkServiceStatus() {
    return new Promise((resolve, reject) => {
        const req = https.get(`${RAILWAY_SERVICE_URL}/`, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                try {
                    const response = JSON.parse(data);
                    resolve(response);
                } catch (e) {
                    reject(e);
                }
            });
        });
        
        req.on('error', (error) => {
            reject(error);
        });
        
        req.setTimeout(10000, () => {
            req.destroy();
            reject(new Error('请求超时'));
        });
    });
}

// 测试特定功能
async function testMemoirGeneration() {
    const testData = {
        messages: [
            { role: 'user', content: '测试回忆录生成功能' }
        ],
        type: 'memoir',
        theme: '童年时光',
        style: 'warm'
    };
    
    return new Promise((resolve, reject) => {
        const postData = JSON.stringify(testData);
        const options = {
            hostname: 'memoir-backend-production-b9b6.up.railway.app',
            port: 443,
            path: '/api/chat',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        };
        
        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                try {
                    const response = JSON.parse(data);
                    resolve(response);
                } catch (e) {
                    reject(e);
                }
            });
        });
        
        req.on('error', (error) => {
            reject(error);
        });
        
        req.setTimeout(10000, () => {
            req.destroy();
            reject(new Error('测试请求超时'));
        });
        
        req.write(postData);
        req.end();
    });
}

// 主检测函数
async function checkDeploymentStatus() {
    console.log('🔍 检查Railway部署状态...\n');
    
    try {
        // 1. 获取当前commit
        const currentCommit = await getCurrentCommit();
        console.log('📋 当前Git Commit:', currentCommit.substring(0, 8));
        
        // 2. 检查服务状态
        console.log('\n🌐 检查服务状态...');
        const serviceStatus = await checkServiceStatus();
        console.log('✅ 服务状态:', serviceStatus.status);
        console.log('🕐 服务时间:', serviceStatus.timestamp);
        
        // 3. 测试回忆录生成功能
        console.log('\n🧪 测试回忆录生成功能...');
        const testResult = await testMemoirGeneration();
        
        // 分析测试结果
        const isNewLogic = testResult.content && testResult.content.length > 300;
        const hasCorrectFormat = testResult.title && !testResult.title.startsWith('标题：');
        
        console.log('📝 测试结果:');
        console.log('- 标题:', testResult.title ? testResult.title.substring(0, 50) + '...' : '无');
        console.log('- 内容长度:', testResult.content ? testResult.content.length : 0, '字');
        console.log('- 格式正确:', hasCorrectFormat ? '✅' : '❌');
        console.log('- 使用新逻辑:', isNewLogic ? '✅' : '❌');
        
        // 4. 部署状态判断
        console.log('\n🎯 部署状态分析:');
        
        if (isNewLogic && hasCorrectFormat) {
            console.log('🎉 部署成功！新的增强回忆录生成功能已生效。');
            return { status: 'success', deployed: true };
        } else {
            console.log('⚠️ 部署可能未生效，检测到以下问题:');
            if (!hasCorrectFormat) console.log('  - 格式仍有前缀问题');
            if (!isNewLogic) console.log('  - 内容长度不足，可能未使用新逻辑');
            
            console.log('\n🔧 可能的解决方案:');
            console.log('1. Railway部署被跳过 - 需要手动触发部署');
            console.log('2. Railway使用了缓存 - 等待自动部署完成');
            console.log('3. 代码未正确推送 - 检查git状态');
            
            return { status: 'failed', deployed: false, issues: ['format', 'logic'] };
        }
        
    } catch (error) {
        console.error('❌ 检测过程出错:', error.message);
        return { status: 'error', error: error.message };
    }
}

// 提供手动部署指导
function showManualDeploymentGuide() {
    console.log('\n📖 Railway手动部署指导:');
    console.log('');
    console.log('方法1: 使用Railway Dashboard');
    console.log('1. 访问: https://railway.app/dashboard');
    console.log('2. 找到您的memoir-backend项目');
    console.log('3. 点击服务名称进入详情页');
    console.log('4. 点击右上角的"Deploy"按钮');
    console.log('5. 选择"Deploy Latest Commit"');
    console.log('');
    console.log('方法2: 使用命令面板 (推荐)');
    console.log('1. 在Railway Dashboard中按 Cmd+K (Mac) 或 Ctrl+K (Windows)');
    console.log('2. 输入"Deploy Latest Commit"');
    console.log('3. 按回车执行');
    console.log('');
    console.log('方法3: 检查CI设置');
    console.log('1. 在服务设置中检查是否启用了"Wait for CI"');
    console.log('2. 如果启用了，检查GitHub Actions是否通过');
    console.log('3. 考虑临时禁用"Wait for CI"以允许立即部署');
    console.log('');
    console.log('⏰ 预计部署时间: 2-3分钟');
    console.log('🔄 部署完成后，请重新运行此脚本验证结果');
}

// 自动重试检测
async function autoRetryCheck(maxRetries = 5, delayMs = 30000) {
    console.log(`🔄 自动检测部署状态，最多检测 ${maxRetries} 次...\n`);
    
    for (let i = 0; i < maxRetries; i++) {
        const result = await checkDeploymentStatus();
        
        if (result.status === 'success') {
            console.log('\n🎊 部署验证成功！新功能已正常工作。');
            return result;
        }
        
        if (i < maxRetries - 1) {
            console.log(`\n⏰ 第 ${i + 1} 次检测未通过，${delayMs/1000} 秒后重试...`);
            console.log('💡 如果持续未通过，可能需要手动触发部署');
            await new Promise(resolve => setTimeout(resolve, delayMs));
        }
    }
    
    console.log('\n❌ 多次检测均未通过');
    showManualDeploymentGuide();
    return { status: 'manual_required' };
}

// 运行检测
if (require.main === module) {
    autoRetryCheck(5, 30000); // 5次检测，每次间隔30秒
}

module.exports = { checkDeploymentStatus, autoRetryCheck }; 