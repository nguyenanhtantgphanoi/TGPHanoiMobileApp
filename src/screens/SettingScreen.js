import React, { useMemo, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Platform,
    Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const ANDROID_TOP_TAB_HEIGHT = 65;
const DAYCARD_CACHE_KEY_PREFIX = '@lich_cong_giao_daycard_cache:';
const CALENDAR_YEAR_CACHE_KEY = '@lich_cong_giao_calendar_year_cache';
const KINH_NGUYEN_CACHE_KEY = '@kinh_nguyen_grouped_cache';
const NGHI_THUC_CACHE_KEY = '@nghi_thuc_grouped_cache';

export default function SettingScreen({ navigation }) {
    const insets = useSafeAreaInsets();
    const [isClearingDaycards, setIsClearingDaycards] = useState(false);
    const [isClearingKinhNguyen, setIsClearingKinhNguyen] = useState(false);
    const [isClearingNghiThuc, setIsClearingNghiThuc] = useState(false);
    const [isClearingAllCache, setIsClearingAllCache] = useState(false);
    const isBusy = isClearingDaycards || isClearingKinhNguyen || isClearingNghiThuc || isClearingAllCache;

    const androidTopSpacing = useMemo(() => {
        return Platform.OS === 'android' ? ANDROID_TOP_TAB_HEIGHT + insets.top + 15 : insets.top + 20;
    }, [insets.top]);

    const getDayCardCacheKeys = async () => {
        const allKeys = await AsyncStorage.getAllKeys();
        return allKeys.filter((key) => key.startsWith(DAYCARD_CACHE_KEY_PREFIX));
    };

    const clearDaycardCache = async () => {
        if (isBusy) return;
        setIsClearingDaycards(true);

        try {
            const daycardKeys = await getDayCardCacheKeys();
            const keysToRemove = [
                ...daycardKeys,
                CALENDAR_YEAR_CACHE_KEY,
            ];

            if (keysToRemove.length > 0) {
                await AsyncStorage.multiRemove(keysToRemove);
            }

            Alert.alert('Thành công', 'Đã xóa cache daycards.');
        } catch {
            Alert.alert('Lỗi', 'Không thể xóa cache daycards. Vui lòng thử lại.');
        } finally {
            setIsClearingDaycards(false);
        }
    };

    const clearKinhNguyenCache = async () => {
        if (isBusy) return;
        setIsClearingKinhNguyen(true);

        try {
            await AsyncStorage.removeItem(KINH_NGUYEN_CACHE_KEY);
            Alert.alert('Thành công', 'Đã xóa cache Kinh nguyện.');
        } catch {
            Alert.alert('Lỗi', 'Không thể xóa cache Kinh nguyện. Vui lòng thử lại.');
        } finally {
            setIsClearingKinhNguyen(false);
        }
    };

    const clearNghiThucCache = async () => {
        if (isBusy) return;
        setIsClearingNghiThuc(true);

        try {
            await AsyncStorage.removeItem(NGHI_THUC_CACHE_KEY);
            Alert.alert('Thành công', 'Đã xóa cache Nghi thức.');
        } catch {
            Alert.alert('Lỗi', 'Không thể xóa cache Nghi thức. Vui lòng thử lại.');
        } finally {
            setIsClearingNghiThuc(false);
        }
    };

    const clearAllCache = async () => {
        if (isBusy) return;
        setIsClearingAllCache(true);

        try {
            const allKeys = await AsyncStorage.getAllKeys();
            const cacheKeys = allKeys.filter((key) =>
                key.startsWith(DAYCARD_CACHE_KEY_PREFIX) ||
                key === CALENDAR_YEAR_CACHE_KEY ||
                key === KINH_NGUYEN_CACHE_KEY ||
                key === NGHI_THUC_CACHE_KEY ||
                key.includes('_cache')
            );

            if (cacheKeys.length > 0) {
                await AsyncStorage.multiRemove(cacheKeys);
            }

            Alert.alert('Thành công', 'Đã xóa toàn bộ cache.');
        } catch {
            Alert.alert('Lỗi', 'Không thể xóa toàn bộ cache. Vui lòng thử lại.');
        } finally {
            setIsClearingAllCache(false);
        }
    };

    return (
        <View style={[styles.container, { paddingTop: androidTopSpacing }]}> 
            <View style={styles.headerRow}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={22} color="#111" />
                </TouchableOpacity>
                <Text style={styles.header}>Cài đặt</Text>
            </View>

            <TouchableOpacity
                style={[styles.actionItem, isBusy && styles.actionItemDisabled]}
                activeOpacity={0.8}
                onPress={clearDaycardCache}
                disabled={isBusy}
            >
                <View>
                    <Text style={styles.actionTitle}>Xóa cache daycards</Text>
                    <Text style={styles.actionDescription}>Xóa dữ liệu cache của lịch theo ngày và cache năm.</Text>
                </View>
                <Ionicons name="trash-outline" size={20} color="#b42318" />
            </TouchableOpacity>

            <TouchableOpacity
                style={[styles.actionItem, isBusy && styles.actionItemDisabled]}
                activeOpacity={0.8}
                onPress={clearKinhNguyenCache}
                disabled={isBusy}
            >
                <View>
                    <Text style={styles.actionTitle}>Xóa cache Kinh nguyện</Text>
                    <Text style={styles.actionDescription}>Chỉ xóa dữ liệu cache của mục Kinh nguyện.</Text>
                </View>
                <Ionicons name="book-outline" size={20} color="#b42318" />
            </TouchableOpacity>

            <TouchableOpacity
                style={[styles.actionItem, isBusy && styles.actionItemDisabled]}
                activeOpacity={0.8}
                onPress={clearNghiThucCache}
                disabled={isBusy}
            >
                <View>
                    <Text style={styles.actionTitle}>Xóa cache Nghi thức</Text>
                    <Text style={styles.actionDescription}>Chỉ xóa dữ liệu cache của mục Nghi thức.</Text>
                </View>
                <Ionicons name="library-outline" size={20} color="#b42318" />
            </TouchableOpacity>

            <TouchableOpacity
                style={[styles.actionItem, isBusy && styles.actionItemDisabled]}
                activeOpacity={0.8}
                onPress={clearAllCache}
                disabled={isBusy}
            >
                <View>
                    <Text style={styles.actionTitle}>Xóa toàn bộ cache</Text>
                    <Text style={styles.actionDescription}>Xóa tất cả AsyncStorage key có chứa cache.</Text>
                </View>
                <Ionicons name="warning-outline" size={20} color="#b42318" />
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f4f5f7',
        paddingHorizontal: 16,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    backBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fff',
        marginRight: 10,
    },
    header: {
        fontSize: 24,
        fontWeight: '700',
        color: '#111',
    },
    actionItem: {
        backgroundColor: '#fff',
        borderRadius: 14,
        paddingHorizontal: 14,
        paddingVertical: 14,
        marginBottom: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    actionItemDisabled: {
        opacity: 0.6,
    },
    actionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1f2937',
    },
    actionDescription: {
        marginTop: 4,
        fontSize: 13,
        color: '#6b7280',
        maxWidth: 260,
    },
});
