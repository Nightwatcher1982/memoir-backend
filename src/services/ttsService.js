/**
 * TTS语音服务
 * 处理AI语音合成和系统语音播放
 */

import * as Speech from 'expo-speech';
import { Platform } from 'react-native';

// API基础URL
const API_BASE_URL = 'https://memoir-backend-production-b9b6.up.railway.app';

/**
 * 播放文本语音
 * @param {string} text - 要播放的文本
 * @returns {Promise<boolean>} 是否成功播放
 */
export const speakText = async (text) => {
  try {
    console.log('🎵 TTS Service: 准备播放文本:', text);
    
    // 首先尝试使用AI语音服务
    const aiSuccess = await tryAITTS(text);
    if (aiSuccess) {
      console.log('✅ 使用AI语音服务播放成功');
      return true;
    }
    
    // AI语音失败，使用优化的系统语音
    console.log('🔄 AI语音不可用，使用优化系统语音');
    await playSystemTTS(text);
    return true;
    
  } catch (error) {
    console.error('❌ TTS服务完全失败:', error);
    return false;
  }
};

/**
 * 尝试使用AI语音服务
 * @param {string} text - 要播放的文本
 * @returns {Promise<boolean>} 是否成功
 */
const tryAITTS = async (text) => {
  try {
    console.log('🤖 尝试连接AI TTS服务...');
    
    const response = await fetch(`${API_BASE_URL}/api/tts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'audio/wav, application/json'
      },
      body: JSON.stringify({ text }),
      timeout: 10000 // 10秒超时
    });
    
    if (!response.ok) {
      console.log(`🚫 AI TTS服务返回状态: ${response.status}`);
      return false;
    }
    
    const contentType = response.headers.get('content-type');
    
    if (contentType && contentType.includes('application/json')) {
      // 返回的是错误信息
      const errorData = await response.json();
      console.log('🚫 AI TTS服务错误:', errorData.error);
      return false;
    }
    
    if (contentType && contentType.includes('audio')) {
      // 返回的是音频数据
      console.log('🎵 收到AI语音数据，准备播放...');
      
      // TODO: 这里需要处理音频blob播放
      // 由于React Native的限制，暂时记录成功但使用系统语音
      console.log('📝 AI语音数据已接收，但需要expo-av库来播放');
      return false; // 暂时返回false，等待expo-av集成
    }
    
    return false;
    
  } catch (error) {
    console.log('🔌 AI TTS连接失败:', error.message);
    return false;
  }
};

/**
 * 使用优化的系统TTS播放
 * @param {string} text - 要播放的文本
 */
const playSystemTTS = async (text) => {
  console.log('🔊 使用系统TTS播放...');
  
  // 创建优化的语音配置
  const voiceOptions = {
    language: 'zh-CN',
    rate: 0.75,  // 适中语速
    pitch: 1.0,  // 标准音调
    volume: 1.0,
    quality: 'enhanced'
  };
  
  // iOS优化：尝试使用更自然的中文声音
  if (Platform.OS === 'ios') {
    try {
      // 尝试使用Tingting语音（如果可用）
      voiceOptions.voice = 'com.apple.voice.compact.zh-CN.Tingting';
    } catch (e) {
      console.log('📱 使用默认iOS中文语音');
    }
  }
  
  // 播放语音
  await Speech.speak(text, {
    ...voiceOptions,
    onStart: () => {
      console.log('▶️ 系统语音开始播放');
    },
    onDone: () => {
      console.log('✅ 系统语音播放完成');
    },
    onError: (error) => {
      console.error('❌ 系统语音播放错误:', error);
    }
  });
  
  console.log('💡 提示：如需更自然语音，请配置讯飞API密钥');
};

/**
 * 停止当前语音播放
 */
export const stopSpeech = async () => {
  try {
    await Speech.stop();
    console.log('⏹️ 语音播放已停止');
  } catch (error) {
    console.error('❌ 停止语音播放失败:', error);
  }
};

/**
 * 检查语音服务状态
 * @returns {Promise<object>} 服务状态信息
 */
export const getTTSStatus = async () => {
  const status = {
    systemTTS: true,
    aiTTS: false,
    apiUrl: API_BASE_URL
  };
  
  try {
    // 检查AI TTS服务可用性
    const response = await fetch(`${API_BASE_URL}/`, { timeout: 5000 });
    if (response.ok) {
      // 进一步检查TTS端点
      const ttsResponse = await fetch(`${API_BASE_URL}/api/tts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: 'test' }),
        timeout: 3000
      });
      status.aiTTS = ttsResponse.ok && !ttsResponse.headers.get('content-type')?.includes('json');
    }
  } catch (error) {
    console.log('🔍 TTS状态检查:', error.message);
  }
  
  console.log('📊 TTS服务状态:', status);
  return status;
};

export default {
  speakText,
  stopSpeech,
  getTTSStatus
}; 