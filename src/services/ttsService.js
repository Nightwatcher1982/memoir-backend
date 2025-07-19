/**
 * TTS语音服务
 * 处理AI语音合成和系统语音播放
 */

import * as Speech from 'expo-speech';
import { Audio } from 'expo-av';
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
       
                try {
         // 获取音频数据
         const audioBlob = await response.blob();
         console.log(`📊 AI音频数据大小: ${audioBlob.size} bytes, 类型: ${audioBlob.type}`);
         
         // 将blob转换为可播放的URI
         const reader = new FileReader();
         return new Promise((resolve) => {
           reader.onload = async () => {
             try {
               const base64Audio = reader.result.split(',')[1];
               
               // 智能检测音频格式
               let contentType = audioBlob.type || 'audio/mpeg';
               // 如果后端还在返回WAV，我们兼容处理
               if (contentType.includes('wav') || contentType === 'audio/wav') {
                 console.log('🔧 检测到WAV格式，尝试作为音频播放');
                 contentType = 'audio/wav';
               } else {
                 contentType = 'audio/mpeg';
               }
               
               const audioUri = `data:${contentType};base64,${base64Audio}`;
               console.log(`🎵 音频格式: ${contentType}, 数据大小: ${audioBlob.size} bytes, URI长度: ${audioUri.length} 字符`);
               
               // 配置音频模式
               await Audio.setAudioModeAsync({
                 allowsRecordingIOS: false,
                 staysActiveInBackground: false,
                 playsInSilentModeIOS: true,
                 shouldDuckAndroid: true,
                 playThroughEarpieceAndroid: false,
               });
               
               // 创建并播放音频
               const { sound } = await Audio.Sound.createAsync(
                 { uri: audioUri },
                 { 
                   shouldPlay: true, 
                   volume: 1.0,
                   rate: 1.0,
                   shouldCorrectPitch: true,
                   progressUpdateIntervalMillis: 100,
                   positionMillis: 0
                 }
               );
               
               console.log('🎵 小露AI语音播放成功！');
               
               // 等待播放完成
               sound.setOnPlaybackStatusUpdate((status) => {
                 if (status.didJustFinish) {
                   console.log('✅ 小露AI语音播放完成');
                   sound.unloadAsync();
                 }
                 if (status.error) {
                   console.log('🚫 音频播放状态错误:', status.error);
                   sound.unloadAsync();
                 }
               });
               
               resolve(true);
             } catch (playError) {
               console.log('🚫 AI音频播放失败:', playError);
               console.log('🔄 尝试使用替代音频格式...');
               
                                // 尝试使用不同音频格式
                 try {
                   console.log('🔄 尝试简化音频播放...');
                   // 检测音频格式并使用正确的MIME类型
                   const detectedType = audioBlob.type.includes('mpeg') ? 'audio/mpeg' : 'audio/wav';
                   const simpleUri = `data:${detectedType};base64,${base64Audio}`;
                   
                   console.log(`🎵 使用格式: ${detectedType}`);
                   
                   const { sound: simpleSound } = await Audio.Sound.createAsync(
                     { uri: simpleUri },
                     { 
                       shouldPlay: false,  // 先不自动播放
                       volume: 1.0,
                       isLooping: false
                     }
                   );
                   
                   // 手动播放
                   await simpleSound.playAsync();
                   console.log('🎵 使用简化方式播放成功！');
                   
                   simpleSound.setOnPlaybackStatusUpdate((status) => {
                     if (status.didJustFinish) {
                       console.log('✅ 简化音频播放完成');
                       simpleSound.unloadAsync();
                     }
                   });
                   resolve(true);
                 } catch (simpleError) {
                   console.log('🚫 简化格式也失败:', simpleError);
                   resolve(false);
                 }
             }
           };
           reader.readAsDataURL(audioBlob);
         });
       } catch (audioError) {
         console.log('🚫 处理AI音频数据失败:', audioError);
         return false;
       }
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