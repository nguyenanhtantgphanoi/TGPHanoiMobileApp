import React, { useEffect, useState } from 'react';
import {
    StyleSheet, Text, View, FlatList,
    ActivityIndicator, TouchableOpacity
} from 'react-native';
import axios from 'axios';

export default function GiaoHatScreen({ navigation }) {
    const [giaoHatList, setGiaoHatList] = useState([]);
    const [allGiaoXu, setAllGiaoXu] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchGiaoXu = async () => {
            try {
                const res = await axios.get('https://news-tgphn.lamgs.io.vn/giaoXu/');
                if (res.data.success && Array.isArray(res.data.data)) {
                    const all = res.data.data;
                    setAllGiaoXu(all);

                    const giaoHatMap = {};
                    all.forEach(item => {
                        const giaoHat = item.giaoHat?.trim();
                        if (giaoHat) {
                            if (!giaoHatMap[giaoHat]) {
                                giaoHatMap[giaoHat] = 1;
                            } else {
                                giaoHatMap[giaoHat]++;
                            }
                        }
                    });

                    const giaoHatArray = Object.entries(giaoHatMap)
                        .map(([giaoHat, count]) => ({ giaoHat, count }))
                        .sort((a, b) => a.giaoHat.localeCompare(b.giaoHat));

                    setGiaoHatList(giaoHatArray);
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

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#000" />
            </View>
        );
    }

    const handlePress = (giaoHat) => {
        const filtered = allGiaoXu.filter(item => item.giaoHat?.trim() === giaoHat);
        navigation.navigate('GiaoXuScreen', { giaoHat });
    };

    const renderItem = ({ item }) => (
        <TouchableOpacity style={styles.card} onPress={() => handlePress(item.giaoHat)} activeOpacity={0.7}>
            <Text style={styles.cardText}>{item.giaoHat}</Text>
            <Text style={styles.count}>{item.count} Giáo xứ</Text>
        </TouchableOpacity>
    );

    return (
        <View style={{ flex: 1, backgroundColor: '#fff', paddingTop: 60 }}>
            <Text style={styles.header}>Giáo Hạt</Text>
            <FlatList
                data={giaoHatList}
                keyExtractor={(item, index) => item.giaoHat + index}
                renderItem={renderItem}
                contentContainerStyle={{ paddingVertical: 10 }}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    center: {
        flex: 1, justifyContent: 'center', alignItems: 'center'
    },
    header: {
        fontSize: 22,
        fontWeight: 'bold',
        marginHorizontal: 16,
        marginBottom: 10,
        color: '#222',
    },
    card: {
        marginHorizontal: 16,
        marginVertical: 6,
        backgroundColor: '#f9f9f9',
        padding: 16,
        borderRadius: 10,
        elevation: 2,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    cardText: {
        fontSize: 16,
        color: '#333',
        fontWeight: '500',
    },
    count: {
        fontSize: 14,
        color: '#888',
    },
});
