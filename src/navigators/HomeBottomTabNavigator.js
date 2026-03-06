import { Platform, StyleSheet } from 'react-native'
import React, { useRef } from 'react'
import NewsScreen from '../screens/NewsScreen';
import KinhNguyenScreen from '../screens/KinhNguyenScreen';
import ExtendScreen from '../screens/ExtendScreen';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import LichCongGiaoScreen from '../screens/LichCongGiaoScreen';
import CacNghiThucScreen from '../screens/CacNghiThucScreen';

const Tab = createBottomTabNavigator();

export default function HomeBottomTabNavigator() {
    const insets = useSafeAreaInsets();
    const lichScreenRef = useRef(null);
    const androidTopTabBarHeight = 65 + insets.top;

    return (
        <Tab.Navigator
            sceneContainerStyle={Platform.OS === 'android' ? { paddingTop: androidTopTabBarHeight } : undefined}
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarActiveTintColor: '#d59d2c',
                tabBarInactiveTintColor: '#6d6d6f',
                // 1. Xử lý font chữ nhỏ hơn một chút để đủ diện tích chiều ngang
                tabBarLabelStyle: {
                    fontSize: 9.5, // Giảm nhẹ từ 10 xuống 9.5
                    fontWeight: '600',
                    marginBottom: Platform.OS === 'ios' ? 4 : 4,
                },
                tabBarStyle: {
                    backgroundColor: '#ffffff',
                    height: Platform.OS === 'ios' ? 75 : androidTopTabBarHeight,
                    paddingBottom: Platform.OS === 'ios' ? Math.max(insets.bottom - 12, 0) : 8,
                    paddingTop: Platform.OS === 'ios' ? 10 : Math.max(insets.top, 10),
                    // 2. Thêm Padding chiều ngang cho toàn thanh Tab
                    paddingHorizontal: 10,
                    borderTopWidth: Platform.OS === 'ios' ? 0.5 : 0,
                    borderTopColor: '#e0e0e0',
                    borderBottomWidth: Platform.OS === 'android' ? 0.5 : 0,
                    borderBottomColor: '#e0e0e0',
                    position: Platform.OS === 'android' ? 'absolute' : 'relative',
                    top: Platform.OS === 'android' ? 0 : undefined,
                    left: Platform.OS === 'android' ? 0 : undefined,
                    right: Platform.OS === 'android' ? 0 : undefined,
                },
                // 3. Quan trọng: Tinh chỉnh Style cho từng Item để không bị lấn sân nhau
                tabBarItemStyle: {
                    paddingHorizontal: 2,
                },
                tabBarIcon: ({ color, focused }) => {
                    let iconName;
                    if (route.name === 'Lịch') iconName = focused ? 'calendar' : 'calendar-outline';
                    else if (route.name === 'Tin tức') iconName = focused ? 'newspaper' : 'newspaper-outline';
                    else if (route.name === 'Kinh nguyện') iconName = focused ? 'book' : 'book-outline';
                    else if (route.name === 'Danh mục') iconName = focused ? 'menu' : 'menu-outline';
                    else if (route.name === 'Các nghi thức') iconName = focused ? 'library' : 'library-outline';
                    return <Ionicons name={iconName} size={22} color={color} />;
                },
            })}
        >
            <Tab.Screen
                name="Lịch"
                options={{
                    title: "Lịch Công giáo",
                    // Bạn có thể rút gọn title nếu vẫn bị cắt quá nhiều
                    tabBarLabel: "Trang chủ"
                }}
                listeners={({ navigation }) => ({
                    tabPress: (e) => {
                        if (navigation.isFocused()) {
                            lichScreenRef.current?.goToToday();
                        }
                    },
                })}
            >
                {() => <LichCongGiaoScreen ref={lichScreenRef} />}
            </Tab.Screen>
            <Tab.Screen name="Tin tức" component={NewsScreen} />
            <Tab.Screen
                name="Các nghi thức"
                options={{ tabBarLabel: "Nghi thức" }} // Rút gọn để hiển thị đủ đẹp
                component={CacNghiThucScreen}
            />
            <Tab.Screen name="Kinh nguyện" component={KinhNguyenScreen} />
            <Tab.Screen name="Danh mục" component={ExtendScreen} />
        </Tab.Navigator>
    )
}

const styles = StyleSheet.create({})