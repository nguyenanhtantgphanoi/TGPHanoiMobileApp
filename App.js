import './src/utils/notificationConfig';

import { useEffect, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import axios from 'axios';

import { setupNotificationChannel } from './src/utils/notificationChannel';
import { registerForPushNotifications } from './src/utils/pushToken';

import HomeBottomTabNavigator from './src/navigators/HomeBottomTabNavigator';
import InfoScreen from './src/screens/InfoScreen';
import LMScreen from './src/screens/LMScreen';
import GiaoXuScreen from './src/screens/GiaoXuScreen';
import GiaoHatScreen from './src/screens/GiaoHatScreen';
import GXDetailScreen from './src/screens/GXDetailScreen';
import NewsDetailScreen from './src/screens/NewsDetailScreen';
import GKPVScreen from './src/screens/GKPVScreen';

const Stack = createNativeStackNavigator();

function MainApp() {
  useEffect(() => {
    (async () => {
      // 1️⃣ Tạo notification channel (Android)
      await setupNotificationChannel();

      // 2️⃣ Lấy push token
      const deviceInfo = await registerForPushNotifications();
      if (!deviceInfo) return;

      // 3️⃣ Gửi token lên backend
      try {
        await axios.post(
          'https://mapp.tgphanoi.org/api/notification/register-push-device',
          deviceInfo,
          {
            headers: { 'Content-Type': 'application/json' },
            timeout: 15000,
          }
        );
      } catch (error) {
        console.log(
          'Register push device failed:',
          error?.response || error
        );
      }
    })();
  }, []);

  return (
    <NavigationContainer>
      <StatusBar style="auto" />
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen
          name="HomeBottomTabNavigator"
          component={HomeBottomTabNavigator}
        />
        <Stack.Screen name="InfoScreen" component={InfoScreen} />
        <Stack.Screen name="LMScreen" component={LMScreen} />
        <Stack.Screen name="GiaoXuScreen" component={GiaoXuScreen} />
        <Stack.Screen name="GiaoHatScreen" component={GiaoHatScreen} />
        <Stack.Screen name="GXDetailScreen" component={GXDetailScreen} />
        <Stack.Screen name="NewsDetailScreen" component={NewsDetailScreen} />
        <Stack.Screen name="GKPVScreen" component={GKPVScreen} />
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
