import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, FlatList } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { getAllMemoirs } from '../services/storageService';

const MemoirListScreen = ({ navigation }) => {
  const [memoirs, setMemoirs] = useState([]);
  const isFocused = useIsFocused(); // Hook to check if the screen is focused

  useEffect(() => {
    // 当页面获得焦点时，加载数据
    if (isFocused) {
      loadMemoirs();
    }
  }, [isFocused]);

  const loadMemoirs = async () => {
    const data = await getAllMemoirs();
    setMemoirs(data);
  };

  const handleSelectMemoir = (memoir) => {
    navigation.navigate('StoryPreview', { memoir: memoir });
  };

  const renderMemoirItem = ({ item }) => (
    <TouchableOpacity style={styles.itemContainer} onPress={() => handleSelectMemoir(item)}>
      <View>
        <Text style={styles.itemTitle}>{item.title}</Text>
        <Text style={styles.itemDate}>{item.createdAt}</Text>
      </View>
      <Text style={styles.itemArrow}>›</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backButtonText}>‹ 返回</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>我的回忆录</Text>
        
        {memoirs.length > 0 ? (
          <FlatList
            data={memoirs}
            renderItem={renderMemoirItem}
            keyExtractor={item => item.id}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>您还没有记录任何回忆。</Text>
            <Text style={styles.emptyHint}>点击“开始记录”来创建您的第一篇故事吧！</Text>
          </View>
        )}
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
  },
  backButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
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
    paddingHorizontal: 20,
  },
  itemContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 25,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#444',
  },
  itemDate: {
    fontSize: 16,
    color: '#999',
    marginTop: 5,
  },
  itemArrow: {
    fontSize: 28,
    color: '#D0D0D0',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  emptyText: {
    fontSize: 22,
    color: '#666',
    textAlign: 'center',
  },
  emptyHint: {
    fontSize: 18,
    color: '#999',
    textAlign: 'center',
    marginTop: 15,
  },
});

export default MemoirListScreen; 