
import './src/utils/notificationConfig'
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
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
import { registerForPushNotifications } from './src/utils/pushToken';
import { useEffect } from 'react';
import NewsDetailScreen from './src/screens/NewsDetailScreen';

const Stack = createNativeStackNavigator();

function MainApp() {
  useEffect(() => {
    registerForPushNotifications().then(deviceInfo => {
      if (!deviceInfo) return;
      fetch('https://news-tgphn.lamgs.io.vn/notification/register-push-device', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...deviceInfo,
        }),
      });
    });
  }, []);

  return (
    <NavigationContainer>
      <StatusBar translucent style='auto' />
      <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName='HomeBottomTabNavigator'>
        <Stack.Screen name="HomeBottomTabNavigator" component={HomeBottomTabNavigator} />
        <Stack.Screen name="InfoScreen" component={InfoScreen} />
        <Stack.Screen name="LMScreen" component={LMScreen} />
        <Stack.Screen name="GiaoXuScreen" component={GiaoXuScreen} />
        <Stack.Screen name="GiaoHatScreen" component={GiaoHatScreen} />
        <Stack.Screen name="GXDetailScreen" component={GXDetailScreen} />

        <Stack.Screen name="LichLeNoiThanhScreen" component={LichLeNoiThanhScreen} />
        <Stack.Screen name="VPCacUyBanScreen" component={VPCacUyBanScreen} />

        <Stack.Screen name="NewsDetailScreen" component={NewsDetailScreen} />

        <Stack.Screen
          name="KinhCacThanhTuDao"
          component={KinhCacThanhTuDaoScreen}
        />
        <Stack.Screen
          name="ChiTietKinh"
          component={ChiTietKinhScreen}
        />
        <Stack.Screen
          name="VanKienCongNghiScreen"
          component={VanKienCongNghiScreen}
        />
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
