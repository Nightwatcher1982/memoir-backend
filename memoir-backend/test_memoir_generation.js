/**
 * 自动验证回忆录生成功能
 * 测试新的增强AI是否正常工作
 */

const API_BASE_URL = 'https://memoir-backend-production-b9b6.up.railway.app';

// 模拟对话数据
const testConversation = [
    {
        role: 'assistant',
        content: '您好，咱们今天聊聊您的童年时光吧。您小时候住在哪个地方呢？'
    },
    {
        role: 'user', 
        content: '我小时候住在北京，那里有很多胡同和四合院。'
    },
    {
        role: 'assistant',
        content: '北京的胡同确实很有特色。您还记得小时候在胡同里玩耍的情景吗？'
    },
    {
        role: 'user',
        content: '记得！我们经常在胡同里踢毽子、跳皮筋，夏天的时候还会在院子里乘凉听爷爷讲故事。'
    },
    {
        role: 'assistant',
        content: '听起来很温馨！您爷爷都会讲什么样的故事呢？'
    },
    {
        role: 'user',
        content: '爷爷喜欢讲他年轻时候的事情，还有一些民间传说。我最喜欢听他讲抗战时期的故事。'
    }
];

// 验证函数
async function verifyMemoirGeneration() {
    console.log('🧪 开始验证回忆录生成功能...\n');
    
    try {
        // 1. 测试服务是否可用
        console.log('1️⃣ 检查服务状态...');
        const healthResponse = await fetch(`${API_BASE_URL}/`);
        const healthData = await healthResponse.json();
        console.log('✅ 服务状态:', healthData.status);
        
        // 2. 测试回忆录生成
        console.log('\n2️⃣ 测试回忆录生成...');
        const memoirResponse = await fetch(`${API_BASE_URL}/api/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                messages: testConversation,
                type: 'memoir',
                theme: '童年时光',
                style: 'warm'
            })
        });
        
        if (!memoirResponse.ok) {
            throw new Error(`HTTP Error: ${memoirResponse.status}`);
        }
        
        const memoirData = await memoirResponse.json();
        console.log('📝 回忆录生成结果:');
        console.log('标题:', memoirData.title);
        console.log('内容长度:', memoirData.content ? memoirData.content.length : 0, '字');
        console.log('内容预览:', memoirData.content ? memoirData.content.substring(0, 100) + '...' : '无内容');
        
        // 3. 验证结果
        console.log('\n3️⃣ 验证结果...');
        
        const checks = [
            {
                name: '标题存在',
                condition: memoirData.title && memoirData.title.trim() !== '',
                result: memoirData.title ? '✅' : '❌'
            },
            {
                name: '内容存在',
                condition: memoirData.content && memoirData.content.trim() !== '',
                result: memoirData.content ? '✅' : '❌'
            },
            {
                name: '字数达标(≥600字)',
                condition: memoirData.content && memoirData.content.length >= 600,
                result: (memoirData.content && memoirData.content.length >= 600) ? '✅' : '❌'
            },
            {
                name: '无"标题："前缀',
                condition: memoirData.title && !memoirData.title.startsWith('标题：'),
                result: (memoirData.title && !memoirData.title.startsWith('标题：')) ? '✅' : '❌'
            },
            {
                name: '无"正文："前缀',
                condition: memoirData.content && !memoirData.content.startsWith('正文：'),
                result: (memoirData.content && !memoirData.content.startsWith('正文：')) ? '✅' : '❌'
            }
        ];
        
        checks.forEach(check => {
            console.log(`${check.result} ${check.name}`);
        });
        
        const passCount = checks.filter(check => check.condition).length;
        const totalCount = checks.length;
        
        console.log(`\n🎯 验证结果: ${passCount}/${totalCount} 项通过`);
        
        if (passCount === totalCount) {
            console.log('🎉 所有验证项目都通过！回忆录生成功能正常。');
        } else {
            console.log('⚠️ 部分验证项目未通过，需要进一步检查。');
        }
        
        return {
            success: passCount === totalCount,
            passed: passCount,
            total: totalCount,
            data: memoirData
        };
        
    } catch (error) {
        console.error('❌ 验证过程出错:', error.message);
        return {
            success: false,
            error: error.message
        };
    }
}

// 自动重试验证
async function autoRetryVerification(maxRetries = 3, delayMs = 10000) {
    console.log(`🔄 将自动验证回忆录生成功能，最多重试 ${maxRetries} 次...\n`);
    
    for (let i = 0; i < maxRetries; i++) {
        if (i > 0) {
            console.log(`\n⏰ 第 ${i + 1} 次验证 (等待 ${delayMs/1000} 秒后开始)...`);
            await new Promise(resolve => setTimeout(resolve, delayMs));
        }
        
        const result = await verifyMemoirGeneration();
        
        if (result.success) {
            console.log('\n🎊 验证成功！新的回忆录生成功能正常工作。');
            return result;
        } else {
            console.log(`\n⚠️ 第 ${i + 1} 次验证未完全通过。`);
            if (i < maxRetries - 1) {
                console.log('将稍后重试...');
            }
        }
    }
    
    console.log('\n❌ 所有重试都未完全通过，请手动检查。');
}

// 运行验证
if (require.main === module) {
    autoRetryVerification(3, 15000); // 3次重试，每次间隔15秒
}

module.exports = { verifyMemoirGeneration, autoRetryVerification }; 