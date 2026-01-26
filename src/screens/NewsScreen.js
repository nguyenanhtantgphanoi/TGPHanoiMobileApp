import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    StyleSheet,
    Text,
    FlatList,
    Image,
    TouchableOpacity,
    RefreshControl,
    ActivityIndicator,
    Dimensions,
    StatusBar,
    Animated,
    Linking,
    Alert
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 32;
const FEATURED_HEIGHT = 220;
const NORMAL_IMAGE_HEIGHT = 200;
const API_URL = 'https://news-tgphn.lamgs.io.vn/news/';

export default function NewsScreen() {
    const [news, setNews] = useState([]);
    const [featuredNews, setFeaturedNews] = useState([]);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [hasMore, setHasMore] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState(null);
    const [showScrollTop, setShowScrollTop] = useState(false);

    const insets = useSafeAreaInsets();
    const scrollY = useRef(new Animated.Value(0)).current;
    const flatListRef = useRef(null);

    useEffect(() => {
        fetchNews();
    }, []);

    const fetchNews = async (pageNum = 1, isLoadMore = false) => {
        try {
            if (pageNum === 1 && !isLoadMore) {
                setLoading(true);
            } else {
                setLoadingMore(true);
            }
            setError(null);
            const response = await axios.get(API_URL, {
                timeout: 10000,
                headers: {
                    'Cache-Control': 'no-cache'
                }
            });
            if (response.data && response.data.success) {
                const data = response.data.data;
                const posts = data.posts || [];
                if (pageNum === 1) {
                    setNews(posts);
                    setFeaturedNews(posts.slice(0, 3));
                    setTotalPages(data.totalPages || 1);
                    setHasMore(pageNum < (data.totalPages || 1));
                } else {
                    const newPosts = posts.filter(newPost =>
                        !news.some(existingPost => existingPost._id === newPost._id)
                    );
                    if (newPosts.length > 0) {
                        setNews(prev => [...prev, ...newPosts]);
                    }
                }
                setPage(pageNum);
                setHasMore(pageNum < (data.totalPages || 1));
            } else {
                throw new Error('API response không hợp lệ');
            }
        } catch (error) {
            setError(error.message);
            if (!isLoadMore) {
                Alert.alert(
                    'Lỗi',
                    'Không thể tải tin tức. Vui lòng thử lại sau.',
                    [{ text: 'OK' }]
                );
            }
        } finally {
            setLoading(false);
            setLoadingMore(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchNews(1, false);
    };

    const loadMore = () => {
        if (!loadingMore && hasMore && totalPages > 1) {
            fetchNews(page + 1, true);
        }
    };

    const formatDate = (dateString) => {
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return 'Vừa xong';
            const now = new Date();
            const diffMs = now - date;
            const diffMinutes = Math.floor(diffMs / (1000 * 60));
            const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
            const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
            if (diffMinutes < 60) return `${diffMinutes} phút trước`;
            if (diffHours < 24) return `${diffHours} giờ trước`;
            if (diffDays < 7) return `${diffDays} ngày trước`;
            return date.toLocaleDateString('vi-VN', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
        } catch {
            return 'Vừa xong';
        }
    };

    const renderFeaturedItem = ({ item, index }) => (
        <TouchableOpacity
            style={styles.featuredCard}
            activeOpacity={0.9}
            onPress={() => handleNewsPress(item)}
        >
            <Image
                source={{
                    uri: item.image || `https://via.placeholder.com/400x200/1e90ff/ffffff?text=Tin+${index + 1}`,
                    cache: 'force-cache'
                }}
                style={styles.featuredImage}
                resizeMode="cover"
            />
            <View style={styles.featuredOverlay}>
                <View style={styles.featuredContent}>
                    <Text style={styles.featuredTitle} numberOfLines={2}>
                        {item.title}
                    </Text>
                    <Text style={styles.featuredExcerpt} numberOfLines={2}>
                        {item.excerpt}
                    </Text>
                    <View style={styles.featuredMeta}>
                        <Ionicons name="time-outline" size={12} color="#fff" />
                        <Text style={styles.featuredTime}>
                            {formatDate(item.lastPublishedAt || item.parsedDate)}
                        </Text>
                    </View>
                </View>
            </View>
            <View style={styles.featuredIndex}>
                <Text style={styles.featuredIndexText}>{index + 1}</Text>
            </View>
        </TouchableOpacity>
    );

    const renderNewsItem = ({ item, index }) => (
        <TouchableOpacity
            style={styles.newsCard}
            activeOpacity={0.9}
            onPress={() => handleNewsPress(item)}
        >
            <Text style={styles.newsTitle} numberOfLines={3}>
                {item.title}
            </Text>

            <View style={styles.imageContainer}>
                <View style={{ backgroundColor: '#d59d2c', alignSelf: 'flex-start', justifyContent: 'center', alignItems: 'center', padding: 8, borderRadius: 8, marginBottom: 8, position: 'absolute', top: 10, left: 10, zIndex: 2 }}>
                    <Text style={{ color: 'white', fontWeight: '600' }} numberOfLines={1}>
                        {item.category || 'Đang cập nhật...'}
                    </Text>
                </View>
                <Image
                    source={{
                        uri: item.image || `https://via.placeholder.com/800x400/1e90ff/ffffff?text=${encodeURIComponent(item.title.substring(0, 20))}`,
                        cache: 'force-cache'
                    }}
                    style={styles.newsImage}
                    resizeMode="cover"
                />
                <View style={styles.imageGradient} />
            </View>
            <Text style={styles.newsExcerpt} numberOfLines={3}>
                {item.excerpt || 'Đang cập nhật...'}
            </Text>
            <View style={styles.newsMeta}>
                <View style={styles.metaLeft}>
                    <Ionicons name="time-outline" size={14} color="#666" />
                    <Text style={styles.newsTime}>
                        {formatDate(item.lastPublishedAt || item.parsedDate)}
                    </Text>
                </View>
                <TouchableOpacity
                    style={styles.readMoreButton}
                    onPress={() => handleNewsPress(item)}
                >
                    <Text style={styles.readMoreText}>Đọc tiếp →</Text>
                </TouchableOpacity>
            </View>
            {index < news.length - 1 && <View style={styles.divider} />}
        </TouchableOpacity>
    );

    const handleNewsPress = async (item) => {
        try {
            const supported = await Linking.canOpenURL(item.link);
            if (supported) {
                await Linking.openURL(item.link);
            } else {
                Alert.alert('Lỗi', 'Không thể mở liên kết này');
            }
        } catch (error) {
            Alert.alert('Lỗi', 'Không thể mở bài viết');
        }
    };

    const handleScrollToTop = () => {
        flatListRef.current?.scrollToOffset({ animated: true, offset: 0 });
    };

    const renderFooter = () => {
        if (loadingMore) {
            return (
                <View style={styles.loadingMoreContainer}>
                    <ActivityIndicator size="small" color="#1e90ff" />
                    <Text style={styles.loadingMoreText}>Đang tải thêm...</Text>
                </View>
            );
        }
        if (!hasMore && news.length > 0) {
            return (
                <View style={styles.endOfList}>
                    <Text style={styles.endOfListText}>
                        {totalPages <= 1 ? `Đã hiển thị tất cả ${news.length} tin tức` : 'Đã xem hết tin'}
                    </Text>
                </View>
            );
        }
        return null;
    };

    if (loading && page === 1) {
        return (
            <View style={[styles.container, { paddingTop: insets.top }]}>
                <StatusBar barStyle="dark-content" />
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#1e90ff" />
                    <Text style={styles.loadingText}>Đang tải tin tức...</Text>
                </View>
            </View>
        );
    }

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <StatusBar barStyle="dark-content" backgroundColor="#fff" />
            <View style={styles.fixedHeader}>
                {/* <Text style={styles.headerTitle}>Tin Tức TGP Hà Nội</Text> */}
                <Image source={require('../../assets/icon-tgp.png')} style={{ width: 50, height: 50 }} />
                    
                <TouchableOpacity
                    style={styles.searchButton}
                    onPress={() => Alert.alert('Thông báo', 'Tính năng tìm kiếm đang phát triển')}
                >
                    <Ionicons name="search-outline" size={22} color="#333" />
                </TouchableOpacity>
            </View>

            <FlatList
                ref={flatListRef}
                data={news}
                keyExtractor={(item) => `news-${item._id}`}
                renderItem={renderNewsItem}
                ListHeaderComponent={() => (
                    <View>
                        {featuredNews.length > 0 && (
                            <View style={styles.featuredSection}>
                                <Text style={styles.sectionTitle}>Tin nổi bật</Text>
                                <FlatList
                                    horizontal
                                    data={featuredNews}
                                    keyExtractor={(item) => `featured-${item._id}`}
                                    renderItem={renderFeaturedItem}
                                    showsHorizontalScrollIndicator={false}
                                    contentContainerStyle={styles.featuredList}
                                    pagingEnabled
                                    snapToInterval={CARD_WIDTH + 16}
                                    decelerationRate="fast"
                                />
                            </View>
                        )}
                        <View style={styles.newsSectionHeader}>
                            <Text style={styles.newsSectionTitle}>Tin mới nhất</Text>
                        </View>
                    </View>
                )}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={['#1e90ff']}
                        tintColor="#1e90ff"
                    />
                }
                onScroll={Animated.event(
                    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                    {
                        useNativeDriver: false,
                        listener: (event) => {
                            const offsetY = event.nativeEvent.contentOffset.y;
                            if (offsetY > 400 && !showScrollTop) {
                                setShowScrollTop(true);
                            } else if (offsetY <= 400 && showScrollTop) {
                                setShowScrollTop(false);
                            }
                        }
                    }
                )}
                onEndReached={loadMore}
                onEndReachedThreshold={0.5}
                scrollEventThrottle={16}
                showsVerticalScrollIndicator={false}
                ListFooterComponent={renderFooter}
                ListEmptyComponent={() => (
                    !loading && (
                        <View style={styles.emptyContainer}>
                            <Ionicons name="newspaper-outline" size={64} color="#ccc" />
                            <Text style={styles.emptyText}>Không có tin tức nào</Text>
                            <TouchableOpacity
                                style={styles.retryButton}
                                onPress={() => fetchNews(1, false)}
                            >
                                <Text style={styles.retryButtonText}>Thử lại</Text>
                            </TouchableOpacity>
                        </View>
                    )
                )}
                removeClippedSubviews={true}
                maxToRenderPerBatch={10}
                windowSize={5}
            />

            {showScrollTop && (
                <TouchableOpacity
                    style={[styles.scrollTopButton, { bottom: 20 }]}
                    onPress={handleScrollToTop}
                    activeOpacity={0.8}
                >
                    <Ionicons name="arrow-up" size={24} color="#fff" />
                </TouchableOpacity>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    fixedHeader: {
        backgroundColor: '#fff',
        paddingHorizontal: 16,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: '#1e90ff',
    },
    searchButton: {
        padding: 8,
    },
    featuredSection: {
        backgroundColor: '#f8f9fa',
        paddingVertical: 20,
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: '#333',
        paddingHorizontal: 16,
        marginBottom: 12,
    },
    featuredList: {
        paddingHorizontal: 16,
    },
    featuredCard: {
        width: CARD_WIDTH,
        height: FEATURED_HEIGHT,
        marginRight: 16,
        borderRadius: 12,
        overflow: 'hidden',
        position: 'relative',
    },
    featuredImage: {
        width: '100%',
        height: '100%',
        position: 'absolute',
    },
    featuredOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
    },
    featuredContent: {
        flex: 1,
        padding: 16,
        justifyContent: 'flex-end',
    },
    featuredTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '700',
        lineHeight: 24,
        marginBottom: 8,
    },
    featuredExcerpt: {
        color: 'rgba(255, 255, 255, 0.9)',
        fontSize: 14,
        lineHeight: 20,
        marginBottom: 12,
    },
    featuredMeta: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    featuredTime: {
        color: 'rgba(255, 255, 255, 0.9)',
        fontSize: 12,
        marginLeft: 4,
    },
    featuredIndex: {
        position: 'absolute',
        top: 12,
        right: 12,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        width: 30,
        height: 30,
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
    },
    featuredIndexText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
    newsSectionHeader: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        marginBottom: 10,
    },
    newsSectionTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: '#333',
        marginBottom: 4,
    },
    newsCount: {
        fontSize: 14,
        color: '#666',
    },
    newsCard: {
        paddingHorizontal: 16,
        paddingVertical: 20,
        backgroundColor: '#fff',
    },
    newsTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#333',
        lineHeight: 28,
        marginBottom: 16,
    },
    imageContainer: {
        position: 'relative',
        marginBottom: 16,
    },
    newsImage: {
        width: '100%',
        height: NORMAL_IMAGE_HEIGHT,
        borderRadius: 12,
    },
    imageGradient: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 40,
        borderBottomLeftRadius: 12,
        borderBottomRightRadius: 12,
    },
    newsExcerpt: {
        fontSize: 16,
        color: '#555',
        lineHeight: 24,
        marginBottom: 16,
    },
    newsMeta: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    metaLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    newsTime: {
        fontSize: 14,
        color: '#666',
        marginLeft: 6,
    },
    readMoreButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: '#f0f7ff',
        borderRadius: 6,
    },
    readMoreText: {
        fontSize: 14,
        color: '#1e90ff',
        fontWeight: '600',
    },
    divider: {
        height: 1,
        backgroundColor: '#f0f0f0',
        marginTop: 20,
    },
    scrollTopButton: {
        position: 'absolute',
        right: 20,
        backgroundColor: '#1e90ff',
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 5,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 16,
        color: '#666',
    },
    loadingMoreContainer: {
        paddingVertical: 20,
        alignItems: 'center',
    },
    loadingMoreText: {
        marginTop: 8,
        fontSize: 14,
        color: '#666',
    },
    endOfList: {
        paddingVertical: 30,
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
        marginHorizontal: 16,
        borderRadius: 12,
        marginVertical: 20,
    },
    endOfListText: {
        fontSize: 14,
        color: '#666',
        fontWeight: '500',
    },
    emptyContainer: {
        alignItems: 'center',
        paddingVertical: 60,
    },
    emptyText: {
        marginTop: 16,
        fontSize: 16,
        color: '#999',
    },
    retryButton: {
        marginTop: 20,
        paddingHorizontal: 30,
        paddingVertical: 12,
        backgroundColor: '#1e90ff',
        borderRadius: 8,
    },
    retryButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});