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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { useFocusEffect } from '@react-navigation/native';
import * as Animatable from 'react-native-animatable';
import { FontAwesome5 } from '@expo/vector-icons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import ReactNativeBlobUtil from 'react-native-blob-util';

const Tab = createMaterialTopTabNavigator();
const API_URL = 'https://lmwp.tgphanoi.org/api/priests';
const STATE_ACTIVE_DIOCESE = 'active-diocese';
const STATE_ACTIVE_RELIGIOUS = 'active-religious';
const STATE_RETIRED_DIOCESE = 'retired-diocese';
const LM_AVATAR_CACHE_KEY_PREFIX = '@lm_priest_avatar_cache:';
const LM_AVATAR_CACHE_DIR = `${ReactNativeBlobUtil.fs.dirs.CacheDir}/lm-avatar-cache`;
const AVATAR_PRELOAD_BATCH_SIZE = 8;
const AVATAR_PRELOAD_TIMEOUT_MS = 2500;

const toFileUri = (path) => (path.startsWith('file://') ? path : `file://${path}`);

const getFileExtensionFromUrl = (url) => {
    const matched = url.match(/(\.[a-zA-Z0-9]+)(?:\?|$)/);
    return matched ? matched[1] : '.jpg';
};

const hashString = (value) => {
    let hash = 0;
    for (let idx = 0; idx < value.length; idx += 1) {
        hash = ((hash << 5) - hash) + value.charCodeAt(idx);
        hash |= 0;
    }
    return Math.abs(hash).toString(36);
};

const getAvatarCacheKey = (itemId, avatarUrl) => {
    const identity = itemId || `url-${hashString(avatarUrl)}`;
    return `${LM_AVATAR_CACHE_KEY_PREFIX}${identity}`;
};

const getAvatarCachePath = (itemId, avatarUrl) => {
    const extension = getFileExtensionFromUrl(avatarUrl);
    const idPart = itemId || 'unknown';
    return `${LM_AVATAR_CACHE_DIR}/${idPart}_${hashString(avatarUrl)}${extension}`;
};

const getAvatarMapKey = (itemId, avatarUrl) => {
    const identity = itemId || `url-${hashString(avatarUrl)}`;
    return `${identity}:${hashString(avatarUrl)}`;
};

const ensureAvatarCacheDir = async () => {
    const hasCacheDir = await ReactNativeBlobUtil.fs.exists(LM_AVATAR_CACHE_DIR);
    if (!hasCacheDir) {
        await ReactNativeBlobUtil.fs.mkdir(LM_AVATAR_CACHE_DIR);
    }
};

const getOrCreateLocalAvatarUri = async (itemId, avatarUrl) => {
    if (!avatarUrl) {
        return '';
    }

    const cacheKey = getAvatarCacheKey(itemId, avatarUrl);
    const nextPath = getAvatarCachePath(itemId, avatarUrl);
    await ensureAvatarCacheDir();

    const rawCache = await AsyncStorage.getItem(cacheKey);
    if (rawCache) {
        const parsed = JSON.parse(rawCache);
        if (parsed?.url === avatarUrl && parsed?.localPath) {
            const exists = await ReactNativeBlobUtil.fs.exists(parsed.localPath);
            if (exists) {
                return toFileUri(parsed.localPath);
            }
        }

        if (parsed?.localPath && parsed.localPath !== nextPath) {
            const oldExists = await ReactNativeBlobUtil.fs.exists(parsed.localPath);
            if (oldExists) {
                await ReactNativeBlobUtil.fs.unlink(parsed.localPath);
            }
        }
    }

    const response = await ReactNativeBlobUtil
        .config({ path: nextPath, fileCache: true })
        .fetch('GET', avatarUrl);
    const downloadedPath = response.path();

    await AsyncStorage.setItem(
        cacheKey,
        JSON.stringify({
            url: avatarUrl,
            localPath: downloadedPath,
        }),
    );

    return toFileUri(downloadedPath);
};

const preloadAvatarBatch = async (batch) => {
    const loadedMap = {};
    const batchResults = await Promise.all(
        batch.map(async (item) => {
            try {
                const localUri = await getOrCreateLocalAvatarUri(item.id, item.avatarUrl);
                if (!localUri) return null;
                return {
                    key: getAvatarMapKey(item.id, item.avatarUrl),
                    localUri,
                };
            } catch (error) {
                console.error(`Lỗi preload avatar linh mục ${item.id}:`, error);
                return null;
            }
        }),
    );

    batchResults.forEach((result) => {
        if (result?.key && result?.localUri) {
            loadedMap[result.key] = result.localUri;
        }
    });

    return loadedMap;
};

const preloadPriestAvatarsWithinTimeout = async (priests, timeoutMs) => {
    const preloadedMap = {};
    const withAvatar = priests.filter(item => item?.avatarUrl);
    const deadline = Date.now() + timeoutMs;
    let nextIndex = 0;

    while (nextIndex < withAvatar.length) {
        if (Date.now() >= deadline) {
            break;
        }

        const batch = withAvatar.slice(nextIndex, nextIndex + AVATAR_PRELOAD_BATCH_SIZE);
        const batchMap = await preloadAvatarBatch(batch);
        Object.assign(preloadedMap, batchMap);
        nextIndex += AVATAR_PRELOAD_BATCH_SIZE;
    }

    return {
        preloadedMap,
        remainingItems: withAvatar.slice(nextIndex),
    };
};

const preloadRemainingPriestAvatars = async (items) => {
    const remainingMap = {};

    for (let idx = 0; idx < items.length; idx += AVATAR_PRELOAD_BATCH_SIZE) {
        const batch = items.slice(idx, idx + AVATAR_PRELOAD_BATCH_SIZE);
        const batchMap = await preloadAvatarBatch(batch);
        Object.assign(remainingMap, batchMap);
    }

    return remainingMap;
};

const useCachedAvatar = (itemId, avatarUrl, preloadedLocalUri = '') => {
    const [localUri, setLocalUri] = useState(preloadedLocalUri);
    const [isLoading, setIsLoading] = useState(!preloadedLocalUri && Boolean(avatarUrl));

    useEffect(() => {
        let isMounted = true;

        if (preloadedLocalUri) {
            setLocalUri(preloadedLocalUri);
            setIsLoading(false);
            return () => {
                isMounted = false;
            };
        }

        const resolveAvatar = async () => {
            if (!avatarUrl) {
                if (isMounted) {
                    setLocalUri('');
                    setIsLoading(false);
                }
                return;
            }

            setIsLoading(true);

            try {
                const nextLocalUri = await getOrCreateLocalAvatarUri(itemId, avatarUrl);
                if (isMounted) {
                    setLocalUri(nextLocalUri);
                }
            } catch (error) {
                console.error(`Lỗi cache avatar linh mục ${itemId}:`, error);
                if (isMounted) {
                    setLocalUri('');
                }
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        };

        resolveAvatar();

        return () => {
            isMounted = false;
        };
    }, [itemId, avatarUrl, preloadedLocalUri]);

    return { localUri, isLoading };
};

const ContentLines = React.memo(({ lines }) => {
    return lines.map((line, idx) => (
        <Text key={idx} style={styles.content}>{line}</Text>
    ));
});

const LinhMucItem = React.memo(({ item, preloadedLocalUri }) => {
    const { localUri, isLoading: isAvatarLoading } = useCachedAvatar(item.id, item.avatarUrl, preloadedLocalUri);
    const [isImageError, setIsImageError] = useState(false);
    const title = item.nickname
        ? `Lm. ${item.name} (${item.nickname})`
        : `Lm. ${item.name}`;
    const sinhNam = item.sinhNam ?? '';
    const leQuanThay = item.leQuanThay ?? '';
    const thuPhongLinhMuc = item.thuPhongLinhMuc ?? '';
    const queQuan = item.queQuan ?? '';
    const diaChi = item.diaChi ?? '';
    const lines = [
        item.giaoVu,
        `Sinh năm: ${sinhNam}`,
        `Lễ quan thày: ${leQuanThay}`,
        `Thụ phong linh mục: ${thuPhongLinhMuc}`,
        `Quê quán: ${queQuan}`,
        `Đ/c: ${diaChi}`,
    ].filter(Boolean);
    const showImage = Boolean(localUri) && !isImageError;

    useEffect(() => {
        setIsImageError(false);
    }, [localUri, item.avatarUrl]);

    return (
        <Animatable.View animation="fadeInUp" duration={400} style={styles.card}>
            <View style={styles.itemRow}>
                {showImage ? (
                    <Image
                        source={{ uri: localUri }}
                        style={styles.avatar}
                        resizeMode='cover'
                        onError={() => setIsImageError(true)}
                    />
                ) : (
                    <View style={styles.avatarFallback}>
                        <FontAwesome5 name="user-alt" size={24} color="#8a6d3b" />
                        <Text style={styles.avatarFallbackText}>
                            {isAvatarLoading ? 'Đang tải...' : 'Linh mục'}
                        </Text>
                    </View>
                )}
                <View style={{ flex: 1 }}>
                    <Text style={styles.title}>{title}</Text>
                    <ContentLines lines={lines} />
                </View>
            </View>
        </Animatable.View>
    );
});

const LinhMucList = ({ data, avatarCacheMap }) => {
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
            keyExtractor={(item, idx) => item.id ?? String(idx)}
            renderItem={({ item }) => (
                <LinhMucItem
                    item={item}
                    preloadedLocalUri={
                        item.avatarUrl
                            ? avatarCacheMap[getAvatarMapKey(item.id, item.avatarUrl)]
                            : ''
                    }
                />
            )}
            contentContainerStyle={{ paddingBottom: 80 }}
            initialNumToRender={10}
            maxToRenderPerBatch={10}
            windowSize={5}
            removeClippedSubviews={true}
        />
    );
};

const LinhMucTabScreen = ({ data, state, avatarCacheMap }) => {
    const list = data.filter(item => item.state === state);
    return <LinhMucList data={list} avatarCacheMap={avatarCacheMap} />;
};

export default function LMScreen({ navigation }) {
    const [data, setData] = useState([]);
    const [searchText, setSearchText] = useState('');
    const [filteredData, setFilteredData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [avatarCacheMap, setAvatarCacheMap] = useState({});

    useFocusEffect(
        useCallback(() => {
            let isActive = true;

            const fetchData = async () => {
                try {
                    setLoading(true);
                    const res = await axios.get(API_URL);
                    const priests = Array.isArray(res.data)
                        ? res.data
                        : Array.isArray(res.data?.data)
                            ? res.data.data
                            : [];

                    const { preloadedMap, remainingItems } = await preloadPriestAvatarsWithinTimeout(
                        priests,
                        AVATAR_PRELOAD_TIMEOUT_MS,
                    );

                    if (!isActive) return;

                    setData(priests);
                    setFilteredData(priests);
                    setAvatarCacheMap(preloadedMap);

                    if (remainingItems.length > 0) {
                        preloadRemainingPriestAvatars(remainingItems)
                            .then((remainingMap) => {
                                if (!isActive || !Object.keys(remainingMap).length) return;
                                setAvatarCacheMap(prev => ({ ...prev, ...remainingMap }));
                            })
                            .catch((error) => {
                                console.error('Lỗi preload avatar nền:', error);
                            });
                    }
                } catch (e) {
                    console.error('Lỗi fetch linh mục:', e);
                    if (!isActive) return;
                    setData([]);
                    setFilteredData([]);
                    setAvatarCacheMap({});
                } finally {
                    if (isActive) {
                        setLoading(false);
                    }
                }
            };

            fetchData();

            return () => {
                isActive = false;
            };
        }, [])
    );

    useEffect(() => {
        const keyword = searchText.trim().toLowerCase();
        if (keyword === '') {
            setFilteredData(data);
        } else {
            const result = data.filter(item => {
                const displayName = `${item.name ?? ''} ${item.nickname ?? ''}`.toLowerCase();
                return displayName.includes(keyword);
            });
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
                    {() => (
                        <LinhMucTabScreen
                            data={filteredData}
                            state={STATE_ACTIVE_DIOCESE}
                            avatarCacheMap={avatarCacheMap}
                        />
                    )}
                </Tab.Screen>
                <Tab.Screen name="Linh mục dòng">
                    {() => (
                        <LinhMucTabScreen
                            data={filteredData}
                            state={STATE_ACTIVE_RELIGIOUS}
                            avatarCacheMap={avatarCacheMap}
                        />
                    )}
                </Tab.Screen>
                <Tab.Screen name="Linh mục hưu dưỡng">
                    {() => (
                        <LinhMucTabScreen
                            data={filteredData}
                            state={STATE_RETIRED_DIOCESE}
                            avatarCacheMap={avatarCacheMap}
                        />
                    )}
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
        borderRadius: 8,
        backgroundColor: '#f5f5f5',
    },
    avatarFallback: {
        width: 60,
        height: 90,
        marginRight: 10,
        borderRadius: 8,
        backgroundColor: '#f8efdb',
        borderWidth: 1,
        borderColor: '#e4c98f',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 4,
    },
    avatarFallbackText: {
        marginTop: 4,
        fontSize: 10,
        lineHeight: 12,
        color: '#8a6d3b',
        textAlign: 'center',
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
