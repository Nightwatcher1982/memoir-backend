import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import HomeScreen from '../screens/HomeScreen';
import SceneSelectionScreen from '../screens/SceneSelectionScreen';
import MemoirListScreen from '../screens/MemoirListScreen';
import StoryPreviewScreen from '../screens/StoryPreviewScreen';
import DialogueScreen from '../screens/DialogueScreen';

// createStackNavigator 是一个函数，返回一个包含两个组件的对象：Screen 和 Navigator
// 我们用它来创建基于堆栈的导航，新页面会像卡片一样堆叠在旧页面之上
const Stack = createStackNavigator();

const AppNavigator = () => {
  return (
    // Navigator 组件包含了所有的导航逻辑
    <Stack.Navigator
      // screenOptions 可以统一配置该导航器下所有页面的头部样式
      screenOptions={{
        headerShown: false, // 对于我们的极简设计，暂时隐藏默认的页面头部
      }}
    >
      {/* Screen 组件定义了一个独立的页面路由 */}
      {/* homeScreen 会成为这个导航器的初始页面 */}
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="SceneSelection" component={SceneSelectionScreen} />
      <Stack.Screen name="MemoirList" component={MemoirListScreen} />
      <Stack.Screen name="StoryPreview" component={StoryPreviewScreen} />
      <Stack.Screen name="Dialogue" component={DialogueScreen} />
      
      {/* 
        后续的其他页面也会在这里注册，例如：
        <Stack.Screen name="SceneSelection" component={SceneSelectionScreen} />
        <Stack.Screen name="MemoirList" component={MemoirListScreen} />
      */}
    </Stack.Navigator>
  );
};

export default AppNavigator; 