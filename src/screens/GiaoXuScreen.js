import React, { useEffect, useState } from 'react';
import {
    StyleSheet,
    Text,
    View,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    TextInput,
    Keyboard,
    TouchableWithoutFeedback,
} from 'react-native';
import axios from 'axios';
import { FontAwesome5 } from '@expo/vector-icons';

export default function GiaoXuScreen({ route, navigation }) {
    const [allGiaoXu, setAllGiaoXu] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchText, setSearchText] = useState('');

    const giaoHatFromParams = route.params?.giaoHat || null;

    useEffect(() => {
        const fetchGiaoXu = async () => {
            try {
                const res = await axios.get('https://news-tgphn.lamgs.io.vn/giaoXu/');
                if (res.data.success && Array.isArray(res.data.data)) {
                    setAllGiaoXu(res.data.data);
                } else {
                    console.warn('Không lấy được danh sách giáo xứ:', res.data);
                }
            } catch (err) {
                console.error('Lỗi khi fetch giáo xứ:', err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchGiaoXu();
    }, []);

    const filteredGiaoXu = allGiaoXu.filter(item => {
        const matchGiaoHat = giaoHatFromParams
            ? item.giaoHat?.trim() === giaoHatFromParams
            : true;

        const keyword = searchText.toLowerCase();
        const tenGX = item.tenGX?.toLowerCase() || '';
        const tenKhac = item.tenKhac?.toLowerCase() || '';
        const matchSearch = tenGX.includes(keyword) || tenKhac.includes(keyword);

        return matchGiaoHat && matchSearch;
    });

    const renderItem = ({ item }) => (
        <TouchableOpacity
            style={styles.card}
            onPress={() =>
                item.link ? navigation.navigate('GXDetailScreen', { link: item.link }) : null
            }
            activeOpacity={0.7}
        >
            <Text style={styles.name}>Giáo xứ {item.tenGX}</Text>
            <Text style={styles.sub}>Tên khác: {item.tenKhac || ''}</Text>
            {item.giaoHat ? <Text style={styles.sub}>Giáo hạt: {item.giaoHat}</Text> : null}
            {item.diaChi ? <Text style={styles.sub}>Địa chỉ: {item.diaChi}</Text> : null}
        </TouchableOpacity>
    );

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#000" />
            </View>
        );
    }

    return (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
            <View style={{ flex: 1, paddingTop: 60, backgroundColor: '#fff' }}>
                <Text style={styles.header}>
                    {giaoHatFromParams
                        ? `Giáo xứ thuộc giáo hạt: ${giaoHatFromParams}`
                        : 'Danh sách Giáo xứ'}
                </Text>

                {/* 🔍 Search input with clear button */}
                <View style={styles.searchContainer}>
                    <TextInput
                        style={styles.searchInput}
                        placeholder="🔍 Tìm kiếm tên giáo xứ hoặc tên khác..."
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

                {filteredGiaoXu.length === 0 ? (
                    <Text style={styles.noResult}>Không tìm thấy kết quả</Text>
                ) : (
                    <FlatList
                        data={filteredGiaoXu}
                        keyExtractor={(item, index) => item.tenGX + index}
                        renderItem={renderItem}
                        contentContainerStyle={{ paddingVertical: 12 }}
                        keyboardShouldPersistTaps="handled"
                    />
                )}
            </View>
        </TouchableWithoutFeedback>
    );
}

const styles = StyleSheet.create({
    center: {
        flex: 1, justifyContent: 'center', alignItems: 'center'
    },
    header: {
        fontSize: 20,
        fontWeight: 'bold',
        marginHorizontal: 16,
        marginBottom: 10,
        color: '#222',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 16,
        marginBottom: 10,
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
    noResult: {
        textAlign: 'center',
        color: '#888',
        marginTop: 20,
        fontSize: 16,
    },
    card: {
        marginHorizontal: 16,
        marginVertical: 6,
        backgroundColor: '#f8f8f8',
        padding: 12,
        borderRadius: 8,
        elevation: 1,
    },
    name: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    sub: {
        fontSize: 14,
        color: '#555',
        marginTop: 4,
    },
});
