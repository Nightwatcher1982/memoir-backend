import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, FlatList, Alert, Share, Linking, Dimensions, ActivityIndicator, RefreshControl } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { getAllMemoirs } from '../services/storageService';
import { getUserMemoirs } from '../services/aiService';

const { width } = Dimensions.get('window');

const MemoirListScreen = ({ navigation }) => {
  const [memoirs, setMemoirs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const isFocused = useIsFocused();

  useEffect(() => {
    if (isFocused) {
      loadMemoirs();
    }
  }, [isFocused]);

  const loadMemoirs = async () => {
    try {
      setLoading(true);
      // 尝试从后端加载，如果失败则使用本地存储
      let data = [];
      try {
        data = await getUserMemoirs();
      } catch (error) {
        console.log('从后端加载失败，使用本地存储:', error);
        data = await getAllMemoirs();
      }
      setMemoirs(data);
    } catch (error) {
      console.error('加载回忆录失败:', error);
      Alert.alert('错误', '加载回忆录失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadMemoirs();
    setRefreshing(false);
  };

  const handleSelectMemoir = (memoir) => {
    navigation.navigate('StoryPreview', { memoir: memoir });
  };

  const handleShareMemoir = async (memoir) => {
    try {
      if (memoir.shareUrl) {
        // 使用后端分享链接
        const shareOptions = {
          title: memoir.title,
          message: `我刚刚完成了一篇回忆录《${memoir.title}》，想与您分享这段珍贵的记忆。\n\n点击链接查看：${memoir.shareUrl}`,
          url: memoir.shareUrl
        };
        
        await Share.share(shareOptions);
      } else {
        // 本地分享文本内容
        const shareOptions = {
          title: memoir.title,
          message: `《${memoir.title}》\n\n${memoir.content || memoir.story}`
        };
        
        await Share.share(shareOptions);
      }
    } catch (error) {
      console.error('分享失败:', error);
      Alert.alert('提示', '分享功能暂时不可用');
    }
  };

  const openMemoirInBrowser = async (memoir) => {
    if (memoir.shareUrl) {
      try {
        const supported = await Linking.canOpenURL(memoir.shareUrl);
        if (supported) {
          await Linking.openURL(memoir.shareUrl);
        } else {
          Alert.alert('错误', '无法打开链接');
        }
      } catch (error) {
        console.error('打开链接失败:', error);
        Alert.alert('错误', '无法打开链接');
      }
    }
  };

  const showMemoirActions = (memoir) => {
    const actions = [
      { text: '📖 查看详情', onPress: () => handleSelectMemoir(memoir) },
      { text: '📤 分享给朋友', onPress: () => handleShareMemoir(memoir) }
    ];

    if (memoir.shareUrl) {
      actions.push({ text: '🌐 在浏览器中打开', onPress: () => openMemoirInBrowser(memoir) });
    }

    actions.push({ text: '取消', style: 'cancel' });

    Alert.alert('选择操作', `《${memoir.title}》`, actions);
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return dateString;
    }
  };

  const getWritingStyleDisplay = (style) => {
    const styleMap = {
      'warm': '🌟 温馨怀旧',
      'vivid': '🎨 生动叙述',
      'poetic': '🌸 诗意抒情',
      'simple': '💝 朴实真挚'
    };
    return styleMap[style] || '📝 经典';
  };

  const renderMemoirItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.itemContainer} 
      onPress={() => handleSelectMemoir(item)}
      onLongPress={() => showMemoirActions(item)}
    >
      <View style={styles.itemContent}>
        <View style={styles.itemHeader}>
          <Text style={styles.itemTitle} numberOfLines={2}>{item.title}</Text>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => showMemoirActions(item)}
          >
            <Text style={styles.actionButtonText}>⋯</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.itemMeta}>
          <Text style={styles.itemTheme}>📖 {item.theme || '生活回忆'}</Text>
          <Text style={styles.itemStyle}>{getWritingStyleDisplay(item.style)}</Text>
        </View>
        
        <View style={styles.itemStats}>
          <Text style={styles.itemWordCount}>📝 {item.wordCount || 0} 字</Text>
          {item.views !== undefined && (
            <Text style={styles.itemViews}>👁️ {item.views} 次阅读</Text>
          )}
        </View>
        
        <Text style={styles.itemDate}>{formatDate(item.createdAt)}</Text>
        
        {item.shareUrl && (
          <View style={styles.shareIndicator}>
            <Text style={styles.shareText}>🔗 可分享</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>📚</Text>
      <Text style={styles.emptyTitle}>还没有回忆录</Text>
      <Text style={styles.emptyText}>开始您的第一次对话，创建珍贵的回忆录吧！</Text>
      <TouchableOpacity 
        style={styles.createButton}
        onPress={() => navigation.navigate('SceneSelection')}
      >
        <Text style={styles.createButtonText}>🎤 开始创建</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3498db" />
          <Text style={styles.loadingText}>正在加载您的回忆录...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* 头部 */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backButtonText}>‹ 返回</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>我的回忆录</Text>
          <TouchableOpacity 
            style={styles.refreshButton}
            onPress={onRefresh}
            disabled={refreshing}
          >
            <Text style={styles.refreshButtonText}>{refreshing ? '⟳' : '↻'}</Text>
          </TouchableOpacity>
        </View>

        {/* 统计信息 */}
        <View style={styles.statsContainer}>
          <Text style={styles.statsText}>共 {memoirs.length} 篇回忆录</Text>
          {memoirs.length > 0 && (
            <Text style={styles.statsSubText}>
              总字数：{memoirs.reduce((sum, item) => sum + (item.wordCount || 0), 0)} 字
            </Text>
          )}
        </View>
        
        {/* 回忆录列表 */}
        {memoirs.length > 0 ? (
          <FlatList
            data={memoirs}
            renderItem={renderMemoirItem}
            keyExtractor={item => item.id}
            style={styles.list}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={['#3498db']}
                tintColor="#3498db"
              />
            }
            showsVerticalScrollIndicator={false}
          />
        ) : (
          renderEmptyState()
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
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
  refreshButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  refreshButtonText: {
    fontSize: 24,
    color: '#4A90E2',
  },
  statsContainer: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  statsText: {
    fontSize: 18,
    color: '#666',
    fontWeight: 'bold',
  },
  statsSubText: {
    fontSize: 16,
    color: '#999',
    marginTop: 5,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  itemContainer: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  itemContent: {
    flex: 1,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: 'bold',
    color: '#444',
    marginRight: 10,
  },
  actionButton: {
    padding: 5,
  },
  actionButtonText: {
    fontSize: 24,
    color: '#D0D0D0',
  },
  itemMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  itemTheme: {
    fontSize: 16,
    color: '#555',
  },
  itemStyle: {
    fontSize: 16,
    color: '#555',
  },
  itemStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  itemWordCount: {
    fontSize: 16,
    color: '#555',
  },
  itemViews: {
    fontSize: 16,
    color: '#555',
  },
  itemDate: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
  },
  shareIndicator: {
    backgroundColor: '#E0F7FA',
    borderRadius: 5,
    paddingVertical: 5,
    paddingHorizontal: 10,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  shareText: {
    fontSize: 14,
    color: '#007BFF',
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
    paddingVertical: 50,
  },
  emptyIcon: {
    fontSize: 80,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3A3A3A',
    textAlign: 'center',
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  createButton: {
    backgroundColor: '#4A90E2',
    borderRadius: 10,
    paddingVertical: 15,
    paddingHorizontal: 30,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FCF8F3',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 18,
    color: '#666',
  },
});

export default MemoirListScreen; 