import './src/utils/notificationConfig'
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet } from 'react-native';
import { useEffect, useState } from 'react';

import HomeBottomTabNavigator from './src/navigators/HomeBottomTabNavigator';
import InfoScreen from './src/screens/InfoScreen';
import LMScreen from './src/screens/LMScreen';
import GiaoXuScreen from './src/screens/GiaoXuScreen';
import GiaoHatScreen from './src/screens/GiaoHatScreen';
import KinhCacThanhTuDaoScreen from './src/screens/KinhCacThanhTuDaoScreen';
import ChiTietKinhScreen from './src/screens/ChiTietKinhScreen';
import GXDetailScreen from './src/screens/GXDetailScreen';
import VanKienCongNghiScreen from './src/screens/VanKienCongNghiScreen';
import LichLeNoiThanhScreen from './src/screens/LichLeNoiThanhScreen';
import VPCacUyBanScreen from './src/screens/VPCacUyBanScreen';
import NewsDetailScreen from './src/screens/NewsDetailScreen';
import { registerForPushNotifications } from './src/utils/pushToken';

import DraggableAIButton from './src/components/DraggableAIButton';
import AIChatModal from './src/components/AIChatModal';
import { checkOTAUpdate } from './src/ota/otaUpdate';

import * as Updates from 'expo-updates';
import GKPVScreen from './src/screens/GKPVScreen';
import axios from 'axios';

const Stack = createNativeStackNavigator();

function MainApp() {
  useEffect(() => {
    registerForPushNotifications().then(async (deviceInfo) => {
      if (!deviceInfo) return;

      try {
        await axios.post(
          'https://mapp.tgphanoi.org/api/notification/register-push-device',
          {
            ...deviceInfo,
          },
          {
            headers: {
              'Content-Type': 'application/json',
            },
            timeout: 15000, // optional: tránh treo request trên Android release
          }
        );
      } catch (error) {
        console.log('Register push device failed:', error?.response || error);
      }
    });
  }, []);
  // 🔁 Check OTA khi mở app
  useEffect(() => {
    checkOTAUpdate();
  }, []);

  // 🧾 Log OTA (debug production)
  useEffect(() => {
    if (!__DEV__) {
      console.log('[OTA] UpdateId:', Updates.updateId);
      console.log('[OTA] RuntimeVersion:', Updates.runtimeVersion);
    }
  }, []);
  useEffect(() => {
    console.log('runtimeVersion:', Updates.runtimeVersion);
    console.log('channel:', Updates.channel);
    console.log('updateId:', Updates.updateId);
  }, []);

  return (
    <NavigationContainer>
      <StatusBar translucent style='auto' />
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="HomeBottomTabNavigator" component={HomeBottomTabNavigator} />
        <Stack.Screen name="InfoScreen" component={InfoScreen} />
        <Stack.Screen name="LMScreen" component={LMScreen} />
        <Stack.Screen name="GiaoXuScreen" component={GiaoXuScreen} />
        <Stack.Screen name="GiaoHatScreen" component={GiaoHatScreen} />
        <Stack.Screen name="GXDetailScreen" component={GXDetailScreen} />
        <Stack.Screen name="LichLeNoiThanhScreen" component={LichLeNoiThanhScreen} />
        <Stack.Screen name="VPCacUyBanScreen" component={VPCacUyBanScreen} />
        <Stack.Screen name="NewsDetailScreen" component={NewsDetailScreen} />
        <Stack.Screen name="KinhCacThanhTuDao" component={KinhCacThanhTuDaoScreen} />
        <Stack.Screen name="ChiTietKinh" component={ChiTietKinhScreen} />
        <Stack.Screen name="VanKienCongNghiScreen" component={VanKienCongNghiScreen} />
        <Stack.Screen name="GKPVScreen" component={GKPVScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  const [isAIChatVisible, setAIChatVisible] = useState(false);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <MainApp />

        {/* Đưa nút ra ngoài hẳn, không bọc lót phức tạp */}
        {/* <DraggableAIButton onPress={() => setAIChatVisible(true)} />

        <AIChatModal
          visible={isAIChatVisible}
          onClose={() => setAIChatVisible(false)}
        /> */}
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}