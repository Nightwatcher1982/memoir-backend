import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView } from 'react-native';

const HomeScreen = ({ navigation }) => {
  // 这里的 navigation 是由导航器自动注入的属性，用于页面跳转
  // 我们暂时先定义好函数，后续接入导航器时它就能正常工作
  const handleStartRecording = () => {
    navigation.navigate('SceneSelection');
  };

  const handleViewMemoirs = () => {
    navigation.navigate('MemoirList');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>时光留声</Text>
          <Text style={styles.subtitle}>用声音记录您的珍贵回忆</Text>
        </View>
        
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.primaryButton} onPress={handleStartRecording}>
            <Text style={styles.primaryButtonText}>开始记录我的故事</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryButton} onPress={handleViewMemoirs}>
            <Text style={styles.secondaryButtonText}>查看我的回忆录</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>AI 守护您的记忆</Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

// StyleSheet 用于创建样式，这有助于性能优化和代码组织
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FCF8F3', // 一个温暖、柔和的背景色
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: 'space-between', // 主要内容区域在垂直方向上均匀分布
  },
  titleContainer: {
    alignItems: 'center',
    paddingTop: '20%', // 标题区域距离顶部有一定空间
  },
  title: {
    fontSize: 48, // 巨大、醒目的主标题
    fontWeight: 'bold',
    color: '#3A3A3A', // 深色文字，保证对比度
  },
  subtitle: {
    fontSize: 20,
    color: '#5B5B5B',
    marginTop: 10,
  },
  buttonContainer: {
    marginBottom: '10%', // 按钮组距离底部有一定空间
  },
  primaryButton: {
    backgroundColor: '#4A90E2', // 明亮、积极的主色调
    paddingVertical: 25, // 巨大的垂直内边距，让按钮变得很高
    borderRadius: 15, // 圆角，显得更柔和
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000', // 添加一些阴影增加立体感
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
  primaryButtonText: {
    fontSize: 24, // 巨大的按钮文字
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  secondaryButton: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 20,
    color: '#4A90E2', // 与主按钮颜色一致，但无背景
    textDecorationLine: 'underline',
  },
  footer: {
    alignItems: 'center',
    paddingBottom: 20,
  },
  footerText: {
    fontSize: 14,
    color: '#B0A89F',
  },
});

export default HomeScreen; 