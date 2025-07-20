import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, FlatList, Dimensions, Platform } from 'react-native';

// 预设的回忆主题
const PRESET_SCENES = [
  { id: '1', title: '童年时光', description: '聊聊您童年最有趣的事' },
  { id: '2', title: '求学之路', description: '您的老师、同学和校园故事' },
  { id: '3', title: '职场岁月', description: '关于第一份工作或难忘的项目' },
  { id: '4', title: '家庭生活', description: '爱情、婚姻和养育子女的经历' },
  { id: '5', title: '时代记忆', description: '您亲身经历的那些时代变迁' },
];

const SceneSelectionScreen = ({ navigation }) => {
  
  const handleSelectScene = (scene) => {
    navigation.navigate('Dialogue', { scene: scene });
  };
  
  const renderSceneCard = ({ item }) => (
    <TouchableOpacity style={styles.card} onPress={() => handleSelectScene(item)}>
      <Text style={styles.cardTitle}>{item.title}</Text>
      <Text style={styles.cardDescription}>{item.description}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backButtonText}>‹ 返回</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>想聊点什么？</Text>
        <FlatList
          data={PRESET_SCENES}
          renderItem={renderSceneCard}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContainer}
        />
        <TouchableOpacity style={styles.customTopicButton}>
            <Text style={styles.customTopicButtonText}>聊点别的 (语音输入)</Text>
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
    paddingHorizontal: 20,
  },
  backButton: {
    paddingVertical: 10,
  },
  backButtonText: {
    fontSize: 20,
    color: '#4A90E2',
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#3A3A3A',
    textAlign: 'center',
    marginBottom: 30,
    marginTop: 10,
  },
  listContainer: {
    paddingBottom: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 25,
    marginBottom: 20,
    // 兼容Web和移动端的阴影效果
    ...Platform.select({
      web: {
        boxShadow: '0px 2px 5px rgba(0, 0, 0, 0.1)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 3,
      },
    }),
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  cardDescription: {
    fontSize: 18,
    color: '#666',
    marginTop: 8,
  },
  customTopicButton: {
    borderWidth: 2,
    borderColor: '#4A90E2',
    borderStyle: 'dashed',
    borderRadius: 15,
    paddingVertical: 20,
    alignItems: 'center',
    marginBottom: 20,
  },
  customTopicButtonText: {
    fontSize: 20,
    color: '#4A90E2',
    fontWeight: 'bold',
  }
});

export default SceneSelectionScreen; 