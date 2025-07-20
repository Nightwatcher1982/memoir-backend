import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, Dimensions, ActivityIndicator, Alert, Platform, TextInput, ScrollView } from 'react-native';
import * as Speech from 'expo-speech';
import { getNextQuestion, generateMemoir, getQuestionProgress, getWritingStyles, saveMemoirToBackend } from '../services/aiService';
import { saveMemoir } from '../services/storageService';
import { speakText as ttsSpeak, getTTSStatus } from '../services/ttsService';

const { width, height } = Dimensions.get('window');

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
  
  // 新增状态
  const [questionProgress, setQuestionProgress] = useState({ currentCount: 0, maxQuestions: 8, progress: 0, canGenerateMemoir: false });
  const [writingStyles, setWritingStyles] = useState({});
  const [selectedStyle, setSelectedStyle] = useState('warm');
  const [showStyleSelection, setShowStyleSelection] = useState(false);
  const [isGeneratingMemoir, setIsGeneratingMemoir] = useState(false);

  // 加载写作风格
  useEffect(() => {
    const loadWritingStyles = async () => {
      try {
        const styles = await getWritingStyles();
        setWritingStyles(styles);
      } catch (error) {
        console.error('加载写作风格失败:', error);
      }
    };
    
    loadWritingStyles();
  }, []);

  // 更新问答进度
  const updateProgress = async () => {
    try {
      const progress = await getQuestionProgress(conversationHistory, scene.title);
      setQuestionProgress(progress);
      
      // 如果使用本地计算，显示提示
      if (progress.usingLocal) {
        console.log('💡 当前使用本地进度计算，功能完全正常');
      }
      
      console.log('📊 当前问答进度:', {
        currentCount: progress.currentCount,
        maxQuestions: progress.maxQuestions,
        progress: progress.progress,
        canGenerateMemoir: progress.canGenerateMemoir,
        isComplete: progress.isComplete,
        usingLocal: progress.usingLocal
      });
    } catch (error) {
      console.error('获取进度失败:', error);
    }
  };

  useEffect(() => {
    updateProgress();
  }, [conversationHistory]);

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
    checkTTSStatus();

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

  const checkTTSStatus = async () => {
    try {
      const status = await getTTSStatus();
      console.log('🔍 TTS服务状态检查完成:', status);
    } catch (error) {
      console.log('🔍 TTS状态检查失败:', error);
    }
  };

  // 生成回忆录
  const handleGenerateMemoir = async () => {
    if (!questionProgress.canGenerateMemoir) {
      Alert.alert('提示', `还需要回答更多问题才能生成回忆录。当前进度：${questionProgress.currentCount}/${questionProgress.maxQuestions}`);
      return;
    }

    if (showStyleSelection) {
      // 确认生成
      setIsGeneratingMemoir(true);
      setShowStyleSelection(false);
      
      try {
        const memoir = await generateMemoir(conversationHistory, scene.title, selectedStyle);
        
        // 保存到后端
        const savedMemoir = await saveMemoirToBackend(memoir, conversationHistory, scene.title, selectedStyle);
        
        Alert.alert(
          '🎉 回忆录生成成功！',
          `您的回忆录《${memoir.title}》已生成并保存！\n\n字数：${memoir.wordCount || memoir.content.length}字\n风格：${writingStyles[selectedStyle]?.name}\n\n您可以在回忆录列表中查看，也可以分享给家人朋友。`,
          [
            { text: '查看回忆录', onPress: () => navigation.navigate('MemoirList') },
            { text: '继续对话', style: 'cancel' }
          ]
        );
      } catch (error) {
        console.error('生成回忆录失败:', error);
        Alert.alert('错误', '生成回忆录失败，请稍后重试');
      } finally {
        setIsGeneratingMemoir(false);
      }
    } else {
      // 显示风格选择
      setShowStyleSelection(true);
    }
  };

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
      await ttsSpeak(text);
    } catch (error) {
      console.error('语音播放失败:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* 头部区域 - 增大字体，清晰显示 */}
      <View style={styles.header}>
        <Text style={styles.title}>{scene.title}</Text>
        <View style={styles.progressContainer}>
          <Text style={styles.progressText}>
            进度：{questionProgress.currentCount}/{questionProgress.maxQuestions}
          </Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${questionProgress.progress}%` }]} />
          </View>
        </View>
      </View>
      
      {/* 对话区域 */}
      <ScrollView 
        ref={scrollViewRef}
        style={styles.conversationContainer}
        contentContainerStyle={{ paddingBottom: 30 }}
        showsVerticalScrollIndicator={false}
      >
        {conversationHistory.map((entry, index) => (
          <View key={index} style={[
            styles.messageBubble,
            entry.speaker === 'ai' ? styles.aiBubble : styles.userBubble
          ]}>
            <Text style={entry.speaker === 'ai' ? styles.aiText : styles.userText}>
              {entry.text}
            </Text>
            <Text style={styles.timeStamp}>
              {entry.speaker === 'ai' ? '🤖 小助手' : '👤 您说'}
            </Text>
          </View>
        ))}
        {isProcessing && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2196F3" />
            <Text style={styles.loadingText}>小助手正在思考...</Text>
          </View>
        )}
      </ScrollView>

      {/* 写作风格选择弹窗 */}
      {showStyleSelection && (
        <View style={styles.styleModal}>
          <View style={styles.styleContent}>
            <Text style={styles.styleTitle}>选择回忆录风格</Text>
            {Object.entries(writingStyles).map(([key, style]) => (
              <TouchableOpacity
                key={key}
                style={[
                  styles.styleOption,
                  selectedStyle === key && styles.selectedStyle
                ]}
                onPress={() => setSelectedStyle(key)}
              >
                <Text style={styles.styleName}>{style.name}</Text>
                <Text style={styles.styleDesc}>{style.description}</Text>
              </TouchableOpacity>
            ))}
            <View style={styles.styleActions}>
              <TouchableOpacity 
                style={[styles.actionButton, styles.cancelButton]}
                onPress={() => setShowStyleSelection(false)}
              >
                <Text style={styles.cancelButtonText}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.actionButton, styles.confirmButton]}
                onPress={handleGenerateMemoir}
                disabled={isGeneratingMemoir}
              >
                <Text style={styles.confirmButtonText}>
                  {isGeneratingMemoir ? '生成中...' : '确认生成'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* 底部操作区域 */}
      <View style={styles.inputSection}>
        {/* 当前语音显示 */}
        {transientSpeech && (
          <View style={styles.speechContainer}>
            <Text style={styles.speechText}>{transientSpeech}</Text>
          </View>
        )}
        
        {/* 操作按钮区域 */}
        <View style={styles.buttonContainer}>
          {/* 语音/手动输入切换 */}
          <TouchableOpacity 
            style={styles.switchButton}
            onPress={() => setManualInputVisible(!manualInputVisible)}
          >
            <Text style={styles.switchText}>
              {manualInputVisible ? '🎤 语音' : '⌨️ 打字'}
            </Text>
          </TouchableOpacity>

          {/* 回忆录生成按钮 */}
          {questionProgress.canGenerateMemoir && (
            <TouchableOpacity 
              style={styles.memoirButton}
              onPress={handleGenerateMemoir}
              disabled={isGeneratingMemoir}
            >
              <Text style={styles.memoirButtonText}>
                {isGeneratingMemoir ? '生成中...' : '📝 生成回忆录'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
        
        {/* 输入区域 */}
        {manualInputVisible ? (
          <View style={styles.manualInputArea}>
            <TextInput
              style={styles.textInput}
              value={manualInput}
              onChangeText={setManualInput}
              placeholder="请在此输入您的回答..."
              placeholderTextColor="#999"
              multiline
              numberOfLines={3}
            />
            <TouchableOpacity onPress={submitManualInput} style={styles.submitButton}>
              <Text style={styles.submitButtonText}>✅ 发送</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity 
            onPressIn={startRecording} 
            onPressOut={stopRecording} 
            style={[styles.recordButton, isRecordingRef.current && styles.recordingButton]}
          >
            <Text style={styles.recordButtonText}>
              {isRecordingRef.current ? '🔴 正在录音...' : '🎤 按住说话'}
            </Text>
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
  // 主容器 - 更温暖的背景色
  container: { 
    flex: 1, 
    backgroundColor: '#f8f9fb' 
  },
  
  // 头部区域
  header: {
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e6ed',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  
  title: { 
    fontSize: 28,  // 增大字体
    fontWeight: 'bold', 
    textAlign: 'center',
    color: '#2c3e50',
    marginBottom: 12
  },
  
  // 进度条
  progressContainer: {
    alignItems: 'center'
  },
  
  progressText: {
    fontSize: 18,  // 大字体
    color: '#7f8c8d',
    marginBottom: 8,
    fontWeight: '600'
  },
  
  progressBar: {
    width: width * 0.7,
    height: 8,
    backgroundColor: '#ecf0f1',
    borderRadius: 4,
    overflow: 'hidden'
  },
  
  progressFill: {
    height: '100%',
    backgroundColor: '#3498db',
    borderRadius: 4
  },
  
  // 对话区域
  conversationContainer: { 
    flex: 1, 
    paddingHorizontal: 15,
    paddingTop: 15
  },
  
  messageBubble: { 
    borderRadius: 20, 
    padding: 18,  // 增大内边距
    marginVertical: 8,  // 增大间距
    maxWidth: '85%',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  
  aiBubble: { 
    backgroundColor: '#ffffff', 
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#e8f4f8'
  },
  
  userBubble: { 
    backgroundColor: '#3498db', 
    alignSelf: 'flex-end' 
  },
  
  aiText: { 
    fontSize: 20,  // 大字体
    color: '#2c3e50',
    lineHeight: 28,
    fontWeight: '500'
  },
  
  userText: { 
    fontSize: 20,  // 大字体
    color: '#ffffff',
    lineHeight: 28,
    fontWeight: '500'
  },
  
  timeStamp: {
    fontSize: 14,
    marginTop: 8,
    opacity: 0.7,
    fontWeight: '400'
  },
  
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 20
  },
  
  loadingText: {
    fontSize: 18,
    color: '#7f8c8d',
    marginTop: 10,
    fontWeight: '500'
  },
  
  // 底部输入区域
  inputSection: { 
    backgroundColor: 'white',
    paddingHorizontal: 15,
    paddingVertical: 20,
    borderTopWidth: 1, 
    borderTopColor: '#e0e6ed',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  
  speechContainer: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#e9ecef'
  },
  
  speechText: { 
    textAlign: 'center', 
    color: '#495057',
    fontSize: 18,
    fontWeight: '500',
    fontStyle: 'italic'
  },
  
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
    gap: 10
  },
  
  switchButton: {
    backgroundColor: '#6c757d',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    elevation: 2
  },
  
  switchText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600'
  },
  
  memoirButton: {
    backgroundColor: '#28a745',
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 25,
    elevation: 2,
    flex: 1,
    marginLeft: 10
  },
  
  memoirButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center'
  },
  
  // 录音按钮
  recordButton: { 
    backgroundColor: '#3498db', 
    paddingVertical: 25,  // 增大按钮
    paddingHorizontal: 30,
    borderRadius: 30,
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  
  recordingButton: {
    backgroundColor: '#e74c3c',
    transform: [{ scale: 1.05 }]
  },
  
  recordButtonText: { 
    color: 'white', 
    fontSize: 20,  // 大字体
    fontWeight: 'bold' 
  },
  
  // 手动输入
  manualInputArea: {
    gap: 15
  },
  
  textInput: { 
    borderWidth: 2, 
    borderColor: '#bdc3c7', 
    borderRadius: 15, 
    padding: 20,  // 增大内边距
    fontSize: 18,  // 大字体
    backgroundColor: '#ffffff',
    minHeight: 80,  // 多行输入
    textAlignVertical: 'top'
  },
  
  submitButton: { 
    backgroundColor: '#27ae60', 
    paddingVertical: 18,  // 增大按钮
    borderRadius: 15, 
    alignItems: 'center',
    elevation: 3
  },
  
  submitButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold'
  },
  
  // 风格选择弹窗
  styleModal: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000
  },
  
  styleContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 25,
    width: width * 0.9,
    maxHeight: height * 0.7
  },
  
  styleTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#2c3e50'
  },
  
  styleOption: {
    padding: 18,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#ecf0f1'
  },
  
  selectedStyle: {
    borderColor: '#3498db',
    backgroundColor: '#f8f9fb'
  },
  
  styleName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 5
  },
  
  styleDesc: {
    fontSize: 16,
    color: '#7f8c8d',
    lineHeight: 22
  },
  
  styleActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    gap: 15
  },
  
  actionButton: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center'
  },
  
  cancelButton: {
    backgroundColor: '#95a5a6'
  },
  
  confirmButton: {
    backgroundColor: '#27ae60'
  },
  
  cancelButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600'
  },
  
  confirmButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold'
  },
  
  errorText: { 
    textAlign: 'center', 
    color: '#e74c3c', 
    marginTop: 8,
    fontSize: 16,
    fontWeight: '500'
  },
});

export default DialogueScreen;