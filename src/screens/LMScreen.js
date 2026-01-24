import React, { useCallback, useEffect, useState } from 'react';
import {
    View,
    Text,
    TextInput,
    FlatList,
    ActivityIndicator,
    StyleSheet,
    Image,
    TouchableOpacity
} from 'react-native';
import axios from 'axios';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { useFocusEffect } from '@react-navigation/native';
import * as Animatable from 'react-native-animatable';
import { FontAwesome5 } from '@expo/vector-icons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { SafeAreaView } from 'react-native-safe-area-context';

const Tab = createMaterialTopTabNavigator();

const ContentLines = React.memo(({ lines }) => {
    return lines.map((line, idx) => (
        <Text key={idx} style={styles.content}>{line}</Text>
    ));
});

const LinhMucItem = React.memo(({ item }) => (
    <Animatable.View animation="fadeInUp" duration={400} style={styles.card}>
        <View style={styles.itemRow}>
            {item.image ? (
                <Image source={{ uri: item.image }} style={styles.avatar} resizeMode='contain' />
            ) : (
                <View style={[styles.avatar, { backgroundColor: '#ccc' }]} />
            )}
            <View style={{ flex: 1 }}>
                <Text style={styles.title}>{item.title}</Text>
                <ContentLines lines={item.content} />
            </View>
        </View>
    </Animatable.View>
));

const LinhMucList = ({ data }) => {
    if (!data.length) {
        return (
            <View style={styles.center}>
                <Text style={{ fontSize: 16, color: '#666' }}>Không tìm thấy kết quả</Text>
            </View>
        );
    }

    return (
        <FlatList
            data={data}
            keyExtractor={(item, idx) => item.title + idx}
            renderItem={({ item }) => <LinhMucItem item={item} />}
            contentContainerStyle={{ paddingBottom: 80 }}
            initialNumToRender={10}
            maxToRenderPerBatch={10}
            windowSize={5}
            removeClippedSubviews={true}
        />
    );
};

const LinhMucGiaoPhanScreen = ({ data }) => {
    const list = data.filter(item => item.type !== 'Linh mục dòng');
    return <LinhMucList data={list} />;
};

const LinhMucDongScreen = ({ data }) => {
    const list = data.filter(item => item.type === 'Linh mục dòng');
    return <LinhMucList data={list} />;
};

export default function LMScreen({ navigation }) {
    const [data, setData] = useState([]);
    const [searchText, setSearchText] = useState('');
    const [filteredData, setFilteredData] = useState([]);
    const [loading, setLoading] = useState(true);

    useFocusEffect(
        useCallback(() => {
            const fetchData = async () => {
                try {
                    const res = await axios.get('https://news-tgphn.lamgs.io.vn/linhMuc/');
                    if (res.data.success) {
                        setData(res.data.data);
                        setFilteredData(res.data.data);
                    }
                } catch (e) {
                    console.error('Lỗi fetch linh mục:', e);
                } finally {
                    setLoading(false);
                }
            };
            fetchData();
        }, [])
    );

    useEffect(() => {
        const keyword = searchText.trim().toLowerCase();
        if (keyword === '') {
            setFilteredData(data);
        } else {
            const result = data.filter(item =>
                item.title.toLowerCase().includes(keyword)
            );
            setFilteredData(result);
        }
    }, [searchText, data]);

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#000" />
            </View>
        );
    }

    return (
        <View style={{ flex: 1, paddingTop: 60, backgroundColor: '#c2850bde' }}>
            {/* 🔍 Search with Clear Button */}
            <View style={styles.topContainer}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <MaterialIcons name="arrow-back" size={24} color="#000" />
                </TouchableOpacity>
                <View style={styles.searchContainer}>
                    <TextInput
                        style={styles.searchInput}
                        placeholder="🔍 Tìm kiếm tên linh mục..."
                        value={searchText}
                        onChangeText={setSearchText}
                    />
                    {searchText.length > 0 && (
                        <FontAwesome5
                            name="times-circle"
                            size={18}
                            color="#999"
                            onPress={() => setSearchText('')}
                            style={styles.clearButton}
                        />
                    )}
                </View>
            </View>

            <Tab.Navigator
                screenOptions={{
                    tabBarIndicatorStyle: { backgroundColor: '#e53935' },
                    tabBarLabelStyle: { fontSize: 14, fontWeight: 'bold' },
                }}
            >
                <Tab.Screen name="Linh mục triều">
                    {() => <LinhMucGiaoPhanScreen data={filteredData} />}
                </Tab.Screen>
                <Tab.Screen name="Linh mục dòng">
                    {() => <LinhMucDongScreen data={filteredData} />}
                </Tab.Screen>
            </Tab.Navigator>
        </View>
    );
}

const styles = StyleSheet.create({
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    topContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        marginBottom: 8,
        gap: 8,
    },
    backButton: {
        padding: 8,
    },
    searchContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f0f0f0',
        borderRadius: 10,
        paddingHorizontal: 12,
    },
    searchInput: {
        flex: 1,
        paddingVertical: 10,
        fontSize: 16,
    },
    clearButton: {
        paddingHorizontal: 6,
    },
    card: {
        backgroundColor: '#fff',
        marginHorizontal: 16,
        marginVertical: 8,
        padding: 12,
        borderRadius: 10,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    itemRow: {
        flexDirection: 'row',
        gap: 12,
    },
    avatar: {
        width: 60,
        height: 90,
        marginRight: 10,
        borderRadius: 0,
    },
    title: {
        fontWeight: 'bold',
        fontSize: 16,
        marginBottom: 6,
    },
    content: {
        fontSize: 14,
        color: '#444',
        lineHeight: 20,
    },
});
