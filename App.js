import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { View, Text } from 'react-native';
import LichCongGiaoScreen from './src/screens/LichCongGiaoScreen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import NewsScreen from './src/screens/NewsScreen';

function TinTucScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-white">
      <Text className="text-lg">Tin Tức</Text>
    </View>
  );
}

function KinhNguyenScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-white">
      <Text className="text-lg">Kinh Nguyện</Text>
    </View>
  );
}

function DanhMucScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-white">
      <Text className="text-lg">Danh Mục</Text>
    </View>
  );
}

const Tab = createBottomTabNavigator();

function MainApp() {
  const insets = useSafeAreaInsets();

  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarActiveTintColor: '#007AFF',
          tabBarInactiveTintColor: '#8e8e93',
          tabBarStyle: {
            backgroundColor: '#f9f9f9',
            height: 50 + insets.bottom,
            paddingBottom: 6 + insets.bottom,
            paddingTop: 8,
          },
          tabBarIcon: ({ color }) => {
            let iconName;
            if (route.name === 'Lịch') iconName = 'calendar-outline';
            else if (route.name === 'Tin tức') iconName = 'newspaper-outline';
            else if (route.name === 'Kinh nguyện') iconName = 'book-outline';
            else if (route.name === 'Danh mục') iconName = 'menu-outline';
            return <Ionicons name={iconName} size={24} color={color} />;
          },
        })}
      >
        <Tab.Screen name="Lịch" options={{
          title: "Lịch Công giáo"
        }} component={LichCongGiaoScreen} />
        <Tab.Screen name="Tin tức" component={NewsScreen} />
        <Tab.Screen name="Kinh nguyện" component={KinhNguyenScreen} />
        <Tab.Screen name="Danh mục" component={DanhMucScreen} />
      </Tab.Navigator>
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
