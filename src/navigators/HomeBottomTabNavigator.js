import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import NewsScreen from '../screens/NewsScreen';
import KinhNguyenScreen from '../screens/KinhNguyenScreen';
import ExtendScreen from '../screens/ExtendScreen';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import HomeScreen from '../screens/HomeScreen';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import LichCongGiaoScreen from '../screens/LichCongGiaoScreen';

const Tab = createBottomTabNavigator();

export default function HomeBottomTabNavigator() {
    const insets = useSafeAreaInsets();
    return (
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
            <Tab.Screen name="Danh mục" component={ExtendScreen} />
        </Tab.Navigator>
    )
}

const styles = StyleSheet.create({})