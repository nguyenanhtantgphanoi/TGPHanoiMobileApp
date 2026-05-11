import './src/utils/notificationConfig';

import { useEffect, useRef } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer, useNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import axios from 'axios';
import * as Notifications from 'expo-notifications';

import { setupNotificationChannel } from './src/utils/notificationChannel';
import { registerForPushNotifications } from './src/utils/pushToken';

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
import GKPVScreen from './src/screens/GKPVScreen';
import NotificationScreen from './src/screens/NotificationScreen';
import SettingScreen from './src/screens/SettingScreen';
import { useUpdateVersion } from './src/hooks/useUpdateVersion';
import { UpdateOverlay } from './src/components/UpdateOverlay';

const Stack = createNativeStackNavigator();
const VALID_STACK_SCREENS = new Set([
  'HomeBottomTabNavigator',
  'InfoScreen',
  'LMScreen',
  'GiaoXuScreen',
  'GiaoHatScreen',
  'GXDetailScreen',
  'LichLeNoiThanhScreen',
  'VPCacUyBanScreen',
  'NewsDetailScreen',
  'KinhCacThanhTuDao',
  'ChiTietKinh',
  'VanKienCongNghiScreen',
  'GKPVScreen',
  'NotificationScreen',
  'SettingScreen',
]);

function MainApp() {
  const navigationRef = useNavigationContainerRef();
  const handledResponseIdsRef = useRef(new Set());

  const navigateFromNotificationData = (data = {}) => {
    const fallbackScreen = 'NotificationScreen';
    const targetScreen = typeof data.screen === 'string' ? data.screen : null;
    const params = data?.params && typeof data.params === 'object' ? data.params : {};

    if (!navigationRef.isReady()) return;

    if (data?.type === 'daily_reminder') {
      navigationRef.navigate('HomeBottomTabNavigator', {
        screen: 'Lịch',
        params: {
          notification: {
            type: data.type,
            date: data?.date,
            dateKey: data?.dateKey,
            count: data?.count,
          },
        },
      });
      return;
    }

    if (
      data?.type === 'mass-readings' &&
      (targetScreen === 'HomeBottomTabNavigator' || targetScreen === 'Home')
    ) {
      navigationRef.navigate('HomeBottomTabNavigator', {
        screen: 'Lịch',
        params: {
          notification: {
            type: data.type,
            date: data?.date,
            dateKey: data?.dateKey,
            count: data?.count,
          },
        },
      });
      return;
    }

    if (targetScreen === 'NewsDetailScreen' && data?.link) {
      navigationRef.navigate('NewsDetailScreen', {
        link: data.link,
        postId: data?.postId,
      });
      return;
    }

    if (targetScreen && VALID_STACK_SCREENS.has(targetScreen)) {
      navigationRef.navigate(targetScreen, params);
      return;
    }

    navigationRef.navigate(fallbackScreen, {
      notification: {
        title: data?._title,
        body: data?._body,
        data,
      },
    });
  };

  const handleNotificationResponse = (response) => {
    const request = response?.notification?.request;
    const requestId = request?.identifier;
    const content = request?.content || {};
    const data = {
      ...(content?.data || {}),
      _title: content?.title,
      _body: content?.body,
    };

    if (requestId && handledResponseIdsRef.current.has(requestId)) return;
    if (requestId) handledResponseIdsRef.current.add(requestId);

    const tryNavigate = () => {
      if (navigationRef.isReady()) {
        navigateFromNotificationData(data);
      } else {
        setTimeout(tryNavigate, 200);
      }
    };

    tryNavigate();
  };

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

  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener(
      handleNotificationResponse,
    );

    Notifications.getLastNotificationResponseAsync()
      .then((response) => {
        if (response) handleNotificationResponse(response);
      })
      .catch((error) => {
        console.log('Get last notification response failed:', error);
      });

    return () => {
      subscription.remove();
    };
  }, []);

  return (
    <NavigationContainer ref={navigationRef}>
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
        <Stack.Screen name="NotificationScreen" component={NotificationScreen} />
        <Stack.Screen name="SettingScreen" component={SettingScreen} />


      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  const { data } = useUpdateVersion();
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <MainApp />
        <UpdateOverlay
          isUpdating={data.state.isUpdating}
          progress={data.state.progress} />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
