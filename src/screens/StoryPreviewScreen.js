import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native';
import * as Speech from 'expo-speech';
import { getTTSAudio } from '../services/ttsService';

const StoryPreviewScreen = ({ route, navigation }) => {
  // route.params 用于接收导航时传递过来的参数
  const { memoir } = route.params;
  const [isSpeaking, setIsSpeaking] = useState(false);

  // 确保当用户离开页面时，停止朗读
  useEffect(() => {
    return () => {
      Speech.stop();
      setIsSpeaking(false);
    };
  }, []);

  const handleSpeak = async () => {
    if (isSpeaking) {
      Speech.stop();
      setIsSpeaking(false);
      return;
    }

    setIsSpeaking(true);
    const fullText = memoir.title + "。" + memoir.content;
    
    try {
      // 优先使用AI TTS (小露语音)
      console.log('🎵 开始朗读回忆录，使用AI TTS');
      await getTTSAudio(fullText);
      setIsSpeaking(false);
      console.log('✅ AI TTS朗读完成');
    } catch (error) {
      console.log('⚠️ AI TTS失败，降级到系统TTS:', error);
      // 降级到系统TTS
      Speech.speak(fullText, {
        language: 'zh-CN',
        onDone: () => setIsSpeaking(false),
        onStopped: () => setIsSpeaking(false),
        onError: () => setIsSpeaking(false),
      });
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                <Text style={styles.backButtonText}>‹ 返回</Text>
            </TouchableOpacity>
        </View>
        <ScrollView style={styles.scrollView}>
            <Text style={styles.title}>{memoir.title}</Text>
            <Text style={styles.date}>{memoir.createdAt}</Text>
            <Text style={styles.content}>{memoir.content}</Text>
        </ScrollView>
        <View style={styles.footer}>
            <TouchableOpacity style={styles.actionButton} onPress={handleSpeak}>
                <Text style={styles.actionButtonText}>
                    {isSpeaking ? '停止朗读' : '朗读全文'}
                </Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionButton, styles.shareButton]}>
                <Text style={[styles.actionButtonText, styles.shareButtonText]}>分享到微信</Text>
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
  header: {
    paddingHorizontal: 10,
  },
  backButton: {
    padding: 10,
  },
  backButtonText: {
    fontSize: 20,
    color: '#4A90E2',
    fontWeight: 'bold',
  },
  scrollView: {
      flex: 1,
      paddingHorizontal: 25,
  },
  title: {
    fontSize: 34,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  date: {
    fontSize: 16,
    color: '#999',
    marginBottom: 30,
  },
  content: {
    fontSize: 22, // 保证正文内容清晰易读
    lineHeight: 40, // 充足的行间距
    color: '#3A3A3A',
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#EAEAEA',
  },
  actionButton: {
    flex: 1,
    paddingVertical: 18,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#4A90E2',
  },
  actionButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4A90E2',
  },
  shareButton: {
      backgroundColor: '#4A90E2',
      marginLeft: 15,
  },
  shareButtonText: {
      color: '#FFFFFF',
  },
});

export default StoryPreviewScreen; 