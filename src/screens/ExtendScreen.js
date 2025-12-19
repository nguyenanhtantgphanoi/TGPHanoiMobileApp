import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';

const menuItems = [
    {
        icon: 'info-circle',
        label: 'Giới thiệu về TGP Hà Nội',
        screen: 'InfoScreen'
    },
    {
        icon: 'user-friends',
        label: 'Danh sách linh mục',
        screen: 'LMScreen'
    },
    {
        icon: 'church',
        label: 'Danh sách giáo xứ',
        screen: 'GiaoXuScreen'
    },
    {
        icon: 'church',
        label: 'Danh sách giáo hạt',
        screen: 'GiaoHatScreen'
    },
    {
        icon: 'cog',
        label: 'Cài đặt',
        screen: 'SettingScreen'
    },

];

export default function ExtendScreen({ navigation }) {
    const renderItem = ({ item }) => (
        <TouchableOpacity style={styles.item} activeOpacity={0.7} onPress={() => navigation.navigate(item.screen)}>
            <FontAwesome5 name={item.icon} size={20} color="black" style={styles.icon} />
            <Text style={styles.label}>{item.label}</Text>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <Text style={styles.header}>Menu</Text>
            <FlatList
                data={menuItems}
                keyExtractor={(item) => item.label}
                renderItem={renderItem}
                contentContainerStyle={styles.list}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingTop: 60,
        backgroundColor: '#fff',
    },
    header: {
        fontSize: 28,
        fontWeight: 'bold',
        paddingHorizontal: 20,
        marginBottom: 24,
        color: 'black',
    },
    list: {
        paddingHorizontal: 20,
    },
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 18,
        borderBottomColor: '#eee',
        borderBottomWidth: 1,
    },
    icon: {
        marginRight: 16,
    },
    label: {
        fontSize: 16,
        color: '#333',
    },
});
