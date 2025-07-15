import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, Dimensions, ActivityIndicator } from 'react-native';
import Voice from '@react-native-voice/voice';
import * as Speech from 'expo-speech';
import { getNextQuestion, generateMemoir } from '../services/aiService';
import { saveMemoir } from '../services/storageService';

const { width } = Dimensions.get('window');

const DialogueScreen = ({ route, navigation }) => {
  const { scene } = route.params;

  // 状态管理
  const [conversationHistory, setConversationHistory] = useState([]);
  const [currentAIQuestion, setCurrentAIQuestion] = useState('');
  const [userSpeech, setUserSpeech] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(true); // 是否正在等待AI响应
  const [error, setError] = useState('');

  // 初始化
  useEffect(() => {
    // 设置Voice的事件监听器
    Voice.onSpeechStart = onSpeechStart;
    Voice.onSpeechEnd = onSpeechEnd;
    Voice.onSpeechError = onSpeechError;
    Voice.onSpeechResults = onSpeechResults;
    
    // 开始第一轮对话
    const firstQuestion = `好的，让我们来聊聊关于“${scene.title}”的故事吧。请问，关于这个主题，您最先想到的是什么？`;
    setCurrentAIQuestion(firstQuestion);
    speak(firstQuestion, () => setIsProcessing(false)); // 说完后，允许用户开始录音

    return () => {
      Voice.destroy().then(Voice.removeAllListeners);
      Speech.stop();
    };
  }, []);

  // --- 语音识别 (STT) ---
  const onSpeechStart = () => setIsRecording(true);
  const onSpeechEnd = () => setIsRecording(false);
  const onSpeechError = (e) => {
    setError(JSON.stringify(e.error));
    setIsRecording(false);
  }
  const onSpeechResults = (e) => {
    const speechResult = e.value[0];
    setUserSpeech(speechResult);
    // 关键：用户说完后，立即处理
    handleUserSpeech(speechResult);
  };
  
  const startRecognizing = async () => {
    if(isProcessing) return;
    setUserSpeech('');
    setError('');
    try {
      await Voice.start('zh-CN');
    } catch (e) {
      console.error(e);
    }
  };

  const stopRecognizing = async () => {
    try {
      await Voice.stop();
    } catch (e) {
      console.error(e);
    }
  };

  // --- 文本转语音 (TTS) ---
  const speak = (text, onDoneCallback) => {
    Speech.speak(text, { language: 'zh-CN', onDone: onDoneCallback });
  };
  
  // --- 核心对话逻辑 ---
  const handleUserSpeech = async (speechText) => {
    setIsProcessing(true); // 开始处理，禁用麦克风

    // 1. 更新对话历史
    const newHistory = [...conversationHistory, { role: 'user', content: speechText }];
    setConversationHistory(newHistory);
    
    // 2. 获取AI的下一个问题，传递主题参数
    const { next_question } = await getNextQuestion(newHistory, scene.title);
    
    // 3. 更新AI问题并朗读
    setCurrentAIQuestion(next_question);
    speak(next_question, () => {
        setIsProcessing(false); // AI说完后，允许用户再次录音
        setUserSpeech(''); // 清空上一轮的用户回答
    });
  };

  const handleEndDialogue = async () => {
    setIsProcessing(true);
    // 1. 生成最终故事，传递主题参数
    const finalStory = await generateMemoir(conversationHistory, scene.title);
    
    // 2. 保存故事到本地
    await saveMemoir(finalStory);
    
    // 3. 导航到预览页
    stopRecognizing();
    navigation.navigate('StoryPreview', { memoir: finalStory });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.aiQuestionContainer}>
          {isProcessing && !isRecording ? (
            <ActivityIndicator size="large" color="#4A90E2" />
          ) : (
            <Text style={styles.aiQuestionText}>{currentAIQuestion}</Text>
          )}
        </View>

        <View style={styles.userSpeechContainer}>
          <Text style={styles.userSpeechText}>{userSpeech || (isRecording ? '...' : '')}</Text>
        </View>

        <View style={styles.micContainer}>
          <TouchableOpacity 
            style={[styles.micButton, (isRecording || isProcessing) && styles.micButtonDisabled]} 
            onPress={startRecognizing}
            disabled={isProcessing}
          >
            <Text style={styles.micIcon}>🎤</Text>
          </TouchableOpacity>
          <Text style={styles.micLabel}>
            {isProcessing ? 'AI正在思考...' : (isRecording ? '正在聆听...' : '点击开始说话')}
          </Text>
        </View>

        <TouchableOpacity style={styles.endButton} onPress={handleEndDialogue}>
          <Text style={styles.endButtonText}>聊完了，生成我的故事</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};


const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FCF8F3',
  },
  container: {
    flex: 1,
    paddingHorizontal: 25,
    justifyContent: 'space-between',
    paddingBottom: 40,
  },
  aiQuestionContainer: {
    flex: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  aiQuestionText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#3A3A3A',
    textAlign: 'center',
    lineHeight: 45,
  },
  userSpeechContainer: {
    flex: 3,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
  },
  userSpeechText: {
    fontSize: 22,
    color: '#5B5B5B',
    lineHeight: 35,
    textAlign: 'center',
  },
  micContainer: {
    alignItems: 'center',
    marginTop: 40,
  },
  micButton: {
    width: width * 0.3,
    height: width * 0.3,
    borderRadius: (width * 0.3) / 2,
    backgroundColor: '#4A90E2',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  micButtonDisabled: {
    backgroundColor: '#BDBDBD', // 禁用时灰色
  },
  micIcon: {
    fontSize: 50,
  },
  micLabel: {
    fontSize: 20,
    color: '#666',
    marginTop: 15,
  },
  endButton: {
    marginTop: 20,
    alignSelf: 'center',
    padding: 15,
  },
  endButtonText: {
    fontSize: 18,
    color: '#4A90E2',
    fontWeight: 'bold',
  },
});

export default DialogueScreen; 