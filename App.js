

import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import HomeBottomTabNavigator from './src/navigators/HomeBottomTabNavigator';
import InfoScreen from './src/screens/InfoScreen';
import LMScreen from './src/screens/LMScreen';

const Stack = createNativeStackNavigator();

function MainApp() {


  return (
    <NavigationContainer>
      <StatusBar translucent style='auto' />
      <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName='HomeBottomTabNavigator'>
        <Stack.Screen name="HomeBottomTabNavigator" component={HomeBottomTabNavigator} />
        <Stack.Screen name="InfoScreen" component={InfoScreen} />
        <Stack.Screen name="LMScreen" component={LMScreen} />
        {/* <Stack.Screen name="LMScreen" component={LMScreen} />
        <Stack.Screen name="GiaoHatScreen" component={GiaoHatScreen} />
        <Stack.Screen name="GiaoXuScreen" component={GiaoXuScreen} />
        <Stack.Screen name="GXDetailScreen" component={GXDetailScreen} />
        <Stack.Screen name="SettingScreen" component={SettingScreen} />
        <Stack.Screen name="InfoScreen" component={InfoScreen} /> */}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <MainApp />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
