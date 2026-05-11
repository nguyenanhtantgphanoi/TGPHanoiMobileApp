import axios from "axios";
import React, { use, useEffect, useRef, useState } from "react";
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    ScrollView,
    Platform,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const ANDROID_TOP_TAB_HEIGHT = 65;
const KINH_NGUYEN_API_URL = 'https://mapp.tgphanoi.org/get-kinh-nguyen-grouped';
// Optional endpoint: if unavailable, cache still works with TTL only.
const KINH_NGUYEN_UPDATED_AT_API_URL = 'https://mapp.tgphanoi.org/get-kinh-nguyen-updated-at';
const KINH_NGUYEN_CACHE_KEY = '@kinh_nguyen_grouped_cache';
const KINH_NGUYEN_CACHE_TTL_MS = 24 * 60 * 60 * 1000;

export default function KinhNguyenScreen({ navigation }) {
    const [listKinhNguyen, setListKinhNguyen] = useState([])
    const [expandedId, setExpandedId] = useState(null)
    const updatedAtCheckedRef = useRef(false);
    const insets = useSafeAreaInsets();
    const androidTopSpacing = Platform.OS === 'android' ? ANDROID_TOP_TAB_HEIGHT + insets.top + 15 : 60;

    const extractUpdatedAtValue = (payload) => {
        if (!payload) return '';

        const direct = payload.updatedAt ?? payload.updated_at;
        if (direct !== undefined && direct !== null && String(direct).trim()) {
            return String(direct).trim();
        }

        const nested = payload.data?.updatedAt ?? payload.data?.updated_at;
        if (nested !== undefined && nested !== null && String(nested).trim()) {
            return String(nested).trim();
        }

        if (typeof payload === 'string' && payload.trim()) {
            return payload.trim();
        }

        return '';
    };

    const readGroupedCache = async () => {
        try {
            const raw = await AsyncStorage.getItem(KINH_NGUYEN_CACHE_KEY);
            if (!raw) return null;

            const parsed = JSON.parse(raw);
            if (!parsed || !parsed.cachedAt || parsed.data === undefined) {
                return null;
            }

            const ageMs = Date.now() - Number(parsed.cachedAt);
            return {
                data: parsed.data,
                updatedAt: parsed.updatedAt ? String(parsed.updatedAt) : '',
                isExpired: Number.isNaN(ageMs) || ageMs >= KINH_NGUYEN_CACHE_TTL_MS,
            };
        } catch {
            return null;
        }
    };

    const writeGroupedCache = async (data, updatedAt = '') => {
        try {
            await AsyncStorage.setItem(
                KINH_NGUYEN_CACHE_KEY,
                JSON.stringify({
                    cachedAt: Date.now(),
                    updatedAt: updatedAt ? String(updatedAt) : '',
                    data,
                })
            );
        } catch { }
    };

    const fetchGroupedDataFromApi = async () => {
        const response = await axios.get(KINH_NGUYEN_API_URL);
        const data = response.data;
        const updatedAt = extractUpdatedAtValue(response.data);
        await writeGroupedCache(data, updatedAt);
        return data;
    };

    const refreshCacheIfStale = async (cachedUpdatedAt = '', applyData) => {
        if (!KINH_NGUYEN_UPDATED_AT_API_URL || updatedAtCheckedRef.current) return;
        updatedAtCheckedRef.current = true;

        try {
            const res = await axios.get(KINH_NGUYEN_UPDATED_AT_API_URL);
            const remoteUpdatedAt = extractUpdatedAtValue(res.data);
            const localUpdatedAt = String(cachedUpdatedAt || '').trim();

            if (!remoteUpdatedAt || remoteUpdatedAt === localUpdatedAt) {
                return;
            }

            const freshData = await fetchGroupedDataFromApi();
            applyData(freshData);
        } catch { }
    };

    useEffect(() => {
        let mounted = true;

        const getListKinhnguyen = async () => {
            try {
                const cache = await readGroupedCache();

                if (cache?.data !== undefined && !cache.isExpired) {
                    if (mounted) setListKinhNguyen(cache.data);
                    refreshCacheIfStale(cache.updatedAt, (freshData) => {
                        if (mounted) setListKinhNguyen(freshData);
                    }).catch(() => { });
                    return;
                }

                if (cache?.isExpired) {
                    await AsyncStorage.removeItem(KINH_NGUYEN_CACHE_KEY);
                }

                const data = await fetchGroupedDataFromApi();
                if (mounted) {
                    setListKinhNguyen(data)
                }
                console.log("List kinh nguyện: ", data)
            } catch (error) {
                console.log("Có lỗi khi get list kinh nguyện: ", error)
            }
        }
        getListKinhnguyen()

        return () => {
            mounted = false;
        };
    }, []);

    const toggleExpanded = (id) => {
        setExpandedId(expandedId === id ? null : id)
    };
    return (
        <View style={[styles.container, { paddingTop: androidTopSpacing }]}>
            <View style={styles.headerContainer}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <MaterialIcons name="arrow-back" size={24} color="#000" />
                </TouchableOpacity>
                <Text style={styles.header}>Kinh nguyện</Text>
            </View>
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={[styles.list, { paddingBottom: Math.max(insets.bottom + 24, 32) }]}
                showsVerticalScrollIndicator={false}
            >
                {
                    Object.values(listKinhNguyen).map((kinhnguyen) => {
                        const isMultiLevel = kinhnguyen.data && Object.keys(kinhnguyen.data).length > 1;

                        return (
                            <View key={kinhnguyen._id}>
                                <TouchableOpacity
                                    style={styles.card}
                                    onPress={() => {
                                        if (isMultiLevel) {
                                            toggleExpanded(kinhnguyen._id);
                                        } else {
                                            navigation.navigate("ChiTietKinh", {
                                                title: kinhnguyen.data[0].title,
                                                type: null,
                                                html: kinhnguyen.data[0].html
                                            });
                                        }
                                    }}
                                >
                                    <View style={styles.cardContent}>
                                        <Text style={styles.cardTitle}>
                                            {isMultiLevel ? kinhnguyen.title : kinhnguyen.data[0].title}
                                        </Text>
                                        {isMultiLevel && (
                                            <Text style={[styles.arrow, expandedId === kinhnguyen._id && styles.arrowExpanded]}>
                                                {expandedId === kinhnguyen._id ? '‹' : '›'}
                                            </Text>
                                        )}
                                    </View>
                                </TouchableOpacity>
                                {isMultiLevel && expandedId === kinhnguyen._id && (
                                    Object.values(kinhnguyen.data).map((item) => (
                                        <View style={styles.expandedContent} key={item._id}>
                                            <TouchableOpacity
                                                style={styles.viewDetailsBtn}
                                                onPress={() =>
                                                    navigation.navigate("ChiTietKinh", {
                                                        title: item.title,
                                                        type: null,
                                                        html: item.html
                                                    })
                                                }
                                            >
                                                <Text style={styles.viewDetailsBtnText}>{item.title}</Text>
                                            </TouchableOpacity>
                                        </View>
                                    ))
                                )}
                            </View>
                        );
                    })
                }


            </ScrollView>
        </View>
    );
}
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#c2850bde",
    },

    headerContainer: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 20,
        marginBottom: 16,
    },

    backButton: {
        padding: 8,
        marginRight: 10,
    },

    header: {
        fontSize: 28,
        fontWeight: "bold",
        color: "#000000ce",
        flex: 1,
    },

    list: {
        flexGrow: 1,
        paddingBottom: 32,
    },

    scrollView: {
        flex: 1,
    },

    card: {
        marginHorizontal: 20,
        marginBottom: 12,
        backgroundColor: "#f7f7f7e1",
        borderRadius: 14,
        paddingVertical: 16,
        paddingHorizontal: 16,
    },

    cardContent: {
        flexDirection: "row",
        alignItems: "center",
    },

    cardTitle: {
        flex: 1,
        fontSize: 16,
        fontWeight: "600",
        color: "#222",
        lineHeight: 22,
    },

    arrow: {
        fontSize: 22,
        color: "#999",
        marginLeft: 12,
    },

    arrowExpanded: {
        transform: [{ rotate: '180deg' }],
    },

    expandedContent: {
        marginHorizontal: 20,
        marginBottom: 12,
        backgroundColor: "#ffffffa8",
        borderRadius: 14,
        paddingVertical: 5,
        paddingHorizontal: 10,
        borderLeftWidth: 4,
        borderLeftColor: "#E68619",
    },

    contentText: {
        fontSize: 20,
        color: "#555",
        lineHeight: 40,
        marginBottom: 5,
    },

    viewDetailsBtn: {
        marginTop: 5,
        paddingVertical: 5,
        paddingHorizontal: 16,
        backgroundColor: "#c56901",
        borderRadius: 8,
        alignItems: "left",
    },

    viewDetailsBtnText: {
        fontSize: 20,
        paddingVertical: 3,
        textAlign: "left",
        fontWeight: "600",
        color: "#fff",
    },
});
