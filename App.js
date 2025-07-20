import 'react-native-gesture-handler'; // 必须放在第一行
import React from 'react';
import { AppRegistry } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import AppNavigator from './src/navigation/AppNavigator';

function App() {
  return (
    // NavigationContainer 是一个顶级组件，它管理着我们的导航树并包含导航状态。
    // 所有的导航器（如 Stack.Navigator）都必须被包裹在 NavigationContainer 内部。
    <NavigationContainer>
      <AppNavigator />
    </NavigationContainer>
  );
}

// 为iOS兼容性注册主组件
AppRegistry.registerComponent('main', () => App);

// 为Expo兼容性导出默认组件
export default App; 