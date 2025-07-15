import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@MemoirChapters';

// 模拟的回忆录数据，用于首次加载时填充
const MOCK_MEMOIRS = [
  { id: '1', title: '我的童年乐园', createdAt: '2023-10-26', theme: '童年时光', content: '这是童年乐园的故事内容...' },
  { id: '2', title: '改变我一生的恩师', createdAt: '2023-10-24', theme: '求学之路', content: '这是关于恩师的故事内容...' },
  { id: '3', title: '工厂里的光辉岁月', createdAt: '2023-10-20', theme: '职场岁月', content: '这是工厂岁月的故事内容...' },
];

/**
 * 获取所有回忆录
 * @returns {Promise<Array>} 返回一个包含所有回忆录对象的数组
 */
export const getAllMemoirs = async () => {
  try {
    const jsonValue = await AsyncStorage.getItem(STORAGE_KEY);
    if (jsonValue !== null) {
      return JSON.parse(jsonValue);
    } else {
      // 如果是第一次加载，没有任何数据，则写入模拟数据并返回
      await _seedData();
      return MOCK_MEMOIRS;
    }
  } catch (e) {
    console.error("Failed to fetch memoirs.", e);
    return [];
  }
};

/**
 * 保存一篇新的回忆录
 * @param {object} newMemoir 新的回忆录对象 { title, theme, content }
 * @returns {Promise<boolean>} 返回一个布尔值，表示是否保存成功
 */
export const saveMemoir = async (newMemoir) => {
  try {
    const existingMemoirs = await getAllMemoirs();
    const memoirToSave = {
        id: new Date().getTime().toString(), // 使用时间戳作为唯一ID
        createdAt: new Date().toISOString().split('T')[0], // 格式化为 YYYY-MM-DD
        ...newMemoir
    };
    const updatedMemoirs = [memoirToSave, ...existingMemoirs];
    const jsonValue = JSON.stringify(updatedMemoirs);
    await AsyncStorage.setItem(STORAGE_KEY, jsonValue);
    return true;
  } catch (e) {
    console.error("Failed to save memoir.", e);
    return false;
  }
};

/**
 * 内部函数：用于填充初始模拟数据
 */
const _seedData = async () => {
    try {
        const jsonValue = JSON.stringify(MOCK_MEMOIRS);
        await AsyncStorage.setItem(STORAGE_KEY, jsonValue);
    } catch (e) {
        console.error("Failed to seed data.", e);
    }
} 