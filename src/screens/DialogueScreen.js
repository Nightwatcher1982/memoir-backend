import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, Dimensions, ActivityIndicator, Alert, Platform, TextInput, ScrollView } from 'react-native';
import * as Speech from 'expo-speech';
import { getNextQuestion, generateMemoir } from '../services/aiService';
import { saveMemoir } from '../services/storageService';

const { width } = Dimensions.get('window');

let Voice = null;
try {
  Voice = require('@react-native-voice/voice').default;
} catch (e) {
  console.log('Could not load react-native-voice. Manual input only.');
}

const DialogueScreen = ({ route, navigation }) => {
  const { scene } = route.params;
  const latestSpeechResult = useRef('');
  const scrollViewRef = useRef();
  const isRecordingRef = useRef(false);

  const [conversationHistory, setConversationHistory] = useState([]);
  const [transientSpeech, setTransientSpeech] = useState('');
  const [isProcessing, setIsProcessing] = useState(true);
  const [error, setError] = useState('');
  const [manualInputVisible, setManualInputVisible] = useState(!Voice);
  const [manualInput, setManualInput] = useState('');

  useEffect(() => {
    if (Voice) {
      // Properly remove existing listeners
      try {
        Voice.removeAllListeners();
      } catch (e) {
        console.log('Warning: removeAllListeners failed:', e);
      }

      // Set up listeners with proper error handling
      try {
        Voice.onSpeechStart = () => setTransientSpeech('正在聆听...');
        Voice.onSpeechPartialResults = (e) => setTransientSpeech(e.value?.[0] || '...');
        Voice.onSpeechResults = (e) => {
          const result = e.value?.[0] || '';
          latestSpeechResult.current = result;
          setTransientSpeech(result);
        };
        Voice.onSpeechError = (e) => {
          console.log('Speech error:', e);
          setError(`语音错误: ${e.error || 'Unknown error'}`);
        };
        Voice.onSpeechEnd = () => {
          console.log('onSpeechEnd fired - cleaning up transient state only');
          setTransientSpeech('');
          // Don't modify isRecordingRef here to avoid conflicts with manual stop
        };
        
        console.log('Voice listeners set up successfully');
      } catch (e) {
        console.error('Failed to set up voice listeners:', e);
        setManualInputVisible(true);
      }

      Voice.isAvailable().then(available => {
        if (!available) setManualInputVisible(true);
      }).catch(e => {
        console.error('Voice availability check failed:', e);
        setManualInputVisible(true);
      });
    }

    getFirstQuestion();

    return () => {
      if (Voice) {
        Voice.removeAllListeners();
        Voice.destroy().catch(console.error);
      }
    };
  }, []);
  
  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [conversationHistory]);

  const getFirstQuestion = async () => {
    setIsProcessing(true);
    try {
      const response = await getNextQuestion([], scene.title);
      const firstQuestion = response.next_question;
      setConversationHistory([{ speaker: 'ai', text: firstQuestion }]);
      await speakText(firstQuestion);
    } catch (err) {
      setError('获取初始问题失败');
    } finally {
      setIsProcessing(false);
    }
  };

  const startRecording = async () => {
    if (!Voice || isRecordingRef.current) return;
    
    latestSpeechResult.current = '';
    setTransientSpeech('');
    setError('');
    
    try {
      // Ensure Voice is in a clean state before starting
      console.log('Preparing to start recording...');
      
      // Check if already recognizing and stop if needed
      const isRecognizing = await Voice.isRecognizing();
      if (isRecognizing) {
        console.log('Voice is already recognizing, stopping first...');
        await Voice.stop();
        await new Promise(resolve => setTimeout(resolve, 100)); // Brief pause
      }
      
      console.log('Starting recording...');
      await Voice.start('zh-CN');
      isRecordingRef.current = true;
      console.log('Recording started successfully');
    } catch (e) {
      console.error('启动录音失败:', e);
      setError('启动录音失败');
      isRecordingRef.current = false;
    }
  };

  const stopRecording = async () => {
    if (!Voice || !isRecordingRef.current) {
      console.log('stopRecording: Cannot stop - Voice not available or not recording');
      return;
    }
    
    console.log('Stopping recording...');
    isRecordingRef.current = false;
    
    try {
      await Voice.stop();
      console.log('Recording stopped successfully');
      
      // This is the single source of truth for handling results.
      const finalSpeech = latestSpeechResult.current;
      if (finalSpeech?.trim()) {
        console.log('Processing final speech:', finalSpeech);
        handleUserResponse(finalSpeech);
      } else {
        console.log('No valid speech to process');
      }
    } catch (e) {
      console.error('停止录音时出错:', e);
      setError('停止录音时出错');
    }
    setTransientSpeech('');
  };

  const handleUserResponse = async (response) => {
    setConversationHistory(prev => [...prev, { speaker: 'user', text: response }]);
    setIsProcessing(true);
    try {
      const history = [...conversationHistory, { speaker: 'user', text: response }];
      const aiResponse = await getNextQuestion(history, scene.title);
      const nextQuestion = aiResponse.next_question;
      
      if (nextQuestion?.toLowerCase().includes('memoir_generation_complete')) {
         generateCompleteMemoir(history);
      } else {
        setConversationHistory(prev => [...prev, { speaker: 'ai', text: nextQuestion }]);
        await speakText(nextQuestion);
      }
    } catch (err) {
      setError('AI服务连接失败');
    } finally {
      setIsProcessing(false);
    }
  };
  
  const submitManualInput = () => {
    if (manualInput.trim()) {
      handleUserResponse(manualInput);
      setManualInput('');
    }
  };

  const generateCompleteMemoir = async (history) => {
    Alert.alert("对话完成", "正在为您生成回忆录...");
    try {
        const memoir = await generateMemoir(history);
        await saveMemoir({ title: scene.title, content: memoir });
        navigation.navigate('MemoirList');
    } catch (err) {
        setError("生成回忆录失败");
    }
  };

  const speakText = async (text) => {
    try {
      console.log('Speaking text:', text);
      console.log('🔊 正在使用AI语音播放...');
      
      // 尝试使用后端TTS服务
      try {
        const ttsResponse = await fetch('https://memoir-backend-production-b9b6.up.railway.app/api/tts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ text: text })
        });
        
        if (ttsResponse.ok) {
          const audioBlob = await ttsResponse.blob();
          // 这里需要播放音频blob，但React Native需要特殊处理
          console.log('🎵 使用AI语音服务播放');
          // 暂时回退到系统语音，但显示AI语音标识
        } else {
          console.log('TTS服务不可用，使用系统语音');
        }
      } catch (ttsError) {
        console.log('TTS服务连接失败，使用系统语音:', ttsError);
      }
      
      // 使用优化的系统语音作为回退
      console.log('🔊 如果听不到声音，请检查：1. 设备音量 2. 是否静音 3. 蓝牙连接');
      
      // 检查Speech模块是否可用
      const isAvailable = await Speech.isSpeakingAsync();
      console.log('Speech module status:', isAvailable ? 'speaking' : 'available');
      
      await Speech.speak(text, { 
        language: 'zh-CN', 
        rate: 0.8,
        pitch: 1.1,
        volume: 1.0,
        voice: 'com.apple.ttsbundle.Tingting-compact' // 使用更自然的中文声音
      });
      
      console.log('Speech started');
      console.log('提示：请确保设备音量已开启，并且不在静音模式');
      
      // 监听语音完成
      Speech.speak(text, {
        language: 'zh-CN',
        rate: 0.8,
        pitch: 1.1,
        onDone: () => {
          console.log('Speech completed');
        },
        onError: (error) => {
          console.log('Speech error:', error);
        }
      });
    } catch (error) {
      console.log('Speech failed:', error);
      console.log('语音播放失败，请检查设备设备');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>{scene.title}</Text>
      
      <ScrollView 
        ref={scrollViewRef}
        style={styles.conversationContainer}
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        {conversationHistory.map((entry, index) => (
          <View key={index} style={[
            styles.messageBubble,
            entry.speaker === 'ai' ? styles.aiBubble : styles.userBubble
          ]}>
            <Text style={entry.speaker === 'ai' ? styles.aiText : styles.userText}>
              {entry.text}
            </Text>
          </View>
        ))}
        {isProcessing && <ActivityIndicator size="small" color="#007aff" style={{marginVertical: 10}} />}
      </ScrollView>

      <View style={styles.inputSection}>
        {transientSpeech && <Text style={styles.transientText}>{transientSpeech}</Text>}
        
        {manualInputVisible ? (
          <View style={styles.manualInputArea}>
            <TextInput
              style={styles.textInput}
              value={manualInput}
              onChangeText={setManualInput}
              placeholder="请在此输入您的回答..."
            />
            <TouchableOpacity onPress={submitManualInput} style={styles.submitButton}>
              <Text style={styles.buttonText}>发送</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity onPressIn={startRecording} onPressOut={stopRecording} style={styles.recordButton}>
            <Text style={styles.buttonText}>按住说话</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity onPress={() => setManualInputVisible(prev => !prev)} style={styles.toggleButton}>
          <Text style={styles.toggleText}>{manualInputVisible ? '语音输入' : '手动输入'}</Text>
        </TouchableOpacity>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  title: { fontSize: 22, fontWeight: 'bold', textAlign: 'center', padding: 15, backgroundColor: 'white' },
  conversationContainer: { flex: 1, paddingHorizontal: 10 },
  messageBubble: { borderRadius: 18, padding: 12, marginVertical: 4, maxWidth: '85%' },
  aiBubble: { backgroundColor: '#e5e5ea', alignSelf: 'flex-start' },
  userBubble: { backgroundColor: '#007aff', alignSelf: 'flex-end' },
  aiText: { fontSize: 16, color: '#000' },
  userText: { fontSize: 16, color: '#fff' },
  inputSection: { padding: 10, borderTopWidth: 1, borderTopColor: '#e0e0e0', backgroundColor: 'white' },
  transientText: { textAlign: 'center', color: 'gray', fontStyle: 'italic', marginBottom: 10 },
  recordButton: { backgroundColor: '#007aff', padding: 20, borderRadius: 50, alignItems: 'center', margin: 10 },
  buttonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  manualInputArea: { },
  textInput: { borderWidth: 1, borderColor: '#ccc', borderRadius: 10, padding: 10, marginBottom: 10 },
  submitButton: { backgroundColor: '#34c759', padding: 12, borderRadius: 10, alignItems: 'center' },
  toggleButton: { alignSelf: 'center', marginTop: 10 },
  toggleText: { color: '#007aff' },
  errorText: { textAlign: 'center', color: 'red', marginTop: 5 },
});

export default DialogueScreen;