import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
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

// --- TÁCH COMPONENT TIN NỔI BẬT ĐỂ TỐI ƯU ---
const FeaturedSection = React.memo(({ data, renderItem }) => {
    const [activeIndex, setActiveIndex] = useState(0);

    if (!data || data.length === 0) return null;

    // Tính toán index ngay khi đang scroll (không delay)
    const handleScroll = (event) => {
        const scrollOffset = event.nativeEvent.contentOffset.x;
        const index = Math.round(scrollOffset / (CARD_WIDTH + 16));
        if (index !== activeIndex && index >= 0 && index < data.length) {
            setActiveIndex(index);
        }
    };

    return (
        <View style={styles.featuredSection}>
            <Text style={styles.sectionTitle}>Tin nổi bật</Text>
            <FlatList
                horizontal
                data={data}
                keyExtractor={(item) => `featured-${item.postId || item._id}`}
                renderItem={renderItem}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.featuredList}
                pagingEnabled
                snapToInterval={CARD_WIDTH + 16}
                decelerationRate="fast"
                removeClippedSubviews={true}
                onScroll={handleScroll} // Chuyển sang dùng onScroll
                scrollEventThrottle={16} // Tần suất bắt sự kiện cao nhất để dot chạy theo tay
            />
            {/* Dots indicator */}
            <View style={styles.paginationDots}>
                {data.map((_, index) => (
                    <View
                        key={index}
                        style={[
                            styles.dot,
                            activeIndex === index ? styles.activeDot : styles.inactiveDot
                        ]}
                    />
                ))}
            </View>
        </View>
    );
}, (prev, next) => prev.data === next.data);

export default function NewsScreen({ navigation }) {
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
        fetchFeaturedNews();
    }, []);

    const fetchFeaturedNews = async () => {
        try {
            const response = await axios.get(API_URL + 'get-featured-news', {
                timeout: 10000,
                headers: { 'Cache-Control': 'no-cache' }
            });
            if (response.data && response.data.success) {
                setFeaturedNews(response.data.data.posts || []);
            }
        } catch (error) {
            console.log("Lỗi lấy danh sách tin tức nổi bật: ", error)
        }
    };

    const fetchNews = async (pageNum = 1, isLoadMore = false) => {
        try {
            if (pageNum === 1 && !isLoadMore) setLoading(true);
            else setLoadingMore(true);

            setError(null);
            const response = await axios.get(API_URL, {
                timeout: 10000,
                headers: { 'Cache-Control': 'no-cache' }
            });

            if (response.data && response.data.success) {
                const data = response.data.data;
                const posts = data.posts || [];
                if (pageNum === 1) {
                    setNews(posts);
                    setTotalPages(data.totalPages || 1);
                } else {
                    const newPosts = posts.filter(newPost =>
                        !news.some(existingPost => existingPost._id === newPost._id)
                    );
                    if (newPosts.length > 0) setNews(prev => [...prev, ...newPosts]);
                }
                setPage(pageNum);
                setHasMore(pageNum < (data.totalPages || 1));
            }
        } catch (error) {
            setError(error.message);
            if (!isLoadMore) Alert.alert('Lỗi', 'Không thể tải tin tức.');
        } finally {
            setLoading(false);
            setLoadingMore(false);
            setRefreshing(false);
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
            if (diffMinutes < 60) return `${diffMinutes} phút trước`;
            if (diffHours < 24) return `${diffHours} giờ trước`;
            return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
        } catch { return 'Vừa xong'; }
    };

    const handleNewsPress = useCallback((item) => {
        if (item.link) navigation.navigate('NewsDetailScreen', { link: item.link });
    }, [navigation]);

    const renderFeaturedItem = useCallback(({ item, index }) => (
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
                    <Text style={styles.featuredTitle} numberOfLines={2}>{item.title}</Text>
                    <Text style={styles.featuredExcerpt} numberOfLines={2}>{item.excerpt}</Text>
                    <View style={styles.featuredMeta}>
                        <Ionicons name="time-outline" size={12} color="#fff" />
                        <Text style={styles.featuredTime}>{formatDate(item.lastPublishedAt || item.parsedDate)}</Text>
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    ), [handleNewsPress]);

    const renderNewsItem = useCallback(({ item, index }) => (
        <TouchableOpacity
            style={styles.newsCard}
            activeOpacity={0.9}
            onPress={() => handleNewsPress(item)}
        >
            <Text style={styles.newsTitle} numberOfLines={3}>{item.title}</Text>
            <View style={styles.imageContainer}>
                <View style={styles.categoryBadge}>
                    <Text style={styles.categoryText}>{item.category || 'Tin tức'}</Text>
                </View>
                <Image
                    source={{
                        uri: item.image || `https://via.placeholder.com/800x400/1e90ff/ffffff`,
                        cache: 'force-cache'
                    }}
                    style={styles.newsImage}
                    resizeMode="cover"
                />
            </View>
            <Text style={styles.newsExcerpt} numberOfLines={3}>{item.excerpt || 'Đang cập nhật...'}</Text>
            <View style={styles.newsMeta}>
                <View style={styles.metaLeft}>
                    <Ionicons name="time-outline" size={14} color="#666" />
                    <Text style={styles.newsTime}>{formatDate(item.lastPublishedAt || item.parsedDate)}</Text>
                </View>
                <View style={styles.readMoreButton}>
                    <Text style={styles.readMoreText}>Đọc tiếp →</Text>
                </View>
            </View>
            {index < news.length - 1 && <View style={styles.divider} />}
        </TouchableOpacity>
    ), [news.length, handleNewsPress]);

    const listHeader = useMemo(() => (
        <View>
            <FeaturedSection
                data={featuredNews}
                renderItem={renderFeaturedItem}
            />
            <View style={styles.newsSectionHeader}>
                <Text style={styles.newsSectionTitle}>Tin mới nhất</Text>
            </View>
        </View>
    ), [featuredNews, renderFeaturedItem]);

    const handleScrollToTop = () => {
        flatListRef.current?.scrollToOffset({ animated: true, offset: 0 });
    };

    const renderFooter = () => {
        if (loadingMore) return (
            <View style={styles.loadingMoreContainer}>
                <ActivityIndicator size="small" color="#1e90ff" />
            </View>
        );
        return null;
    };

    const loadMore = () => {
        if (!loadingMore && hasMore && totalPages > 1) {
            fetchNews(page + 1, true);
        }
    };

    if (loading && page === 1) {
        return (
            <View style={[styles.container, { paddingTop: insets.top, justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color="#1e90ff" />
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
                ListHeaderComponent={listHeader}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchNews(1); fetchFeaturedNews(); }} />
                }
                onScroll={Animated.event(
                    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                    {
                        useNativeDriver: false,
                        listener: (event) => {
                            const offsetY = event.nativeEvent.contentOffset.y;
                            if (offsetY > 400 && !showScrollTop) setShowScrollTop(true);
                            else if (offsetY <= 400 && showScrollTop) setShowScrollTop(false);
                        }
                    }
                )}
                onEndReached={() => hasMore && loadMore()}
                onEndReachedThreshold={0.5}
                ListFooterComponent={renderFooter}
                removeClippedSubviews={true}
                initialNumToRender={10}
                maxToRenderPerBatch={10}
                windowSize={5}
            />

            {showScrollTop && (
                <TouchableOpacity style={styles.scrollTopButton} onPress={handleScrollToTop}>
                    <Ionicons name="arrow-up" size={24} color="#fff" />
                </TouchableOpacity>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    fixedHeader: {
        height: 60,
        backgroundColor: '#fff',
        paddingHorizontal: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    featuredSection: { paddingVertical: 15, backgroundColor: '#f8f9fa' },
    sectionTitle: { fontSize: 20, fontWeight: '700', marginLeft: 16, marginBottom: 10 },
    featuredList: { paddingHorizontal: 16 },
    featuredCard: { width: CARD_WIDTH, height: FEATURED_HEIGHT, marginRight: 16, borderRadius: 12, overflow: 'hidden' },
    featuredImage: { ...StyleSheet.absoluteFillObject },
    featuredOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'flex-end', padding: 15 },
    featuredTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
    featuredExcerpt: { color: '#eee', fontSize: 13, marginTop: 5 },
    featuredMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
    featuredTime: { color: '#fff', fontSize: 11, marginLeft: 4 },
    paginationDots: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 10,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginHorizontal: 4,
    },
    activeDot: {
        backgroundColor: '#1e90ff',
        width: 20,
    },
    inactiveDot: {
        backgroundColor: '#ccc',
    },
    newsSectionHeader: { padding: 16 },
    newsSectionTitle: { fontSize: 20, fontWeight: '700' },
    newsCard: { padding: 16 },
    newsTitle: { fontSize: 18, fontWeight: '700', color: '#333', marginBottom: 12 },
    imageContainer: { position: 'relative' },
    newsImage: { width: '100%', height: NORMAL_IMAGE_HEIGHT, borderRadius: 10 },
    categoryBadge: { position: 'absolute', top: 10, left: 10, zIndex: 2, backgroundColor: '#d59d2c', padding: 6, borderRadius: 6 },
    categoryText: { color: '#fff', fontSize: 12, fontWeight: '600' },
    newsExcerpt: { fontSize: 15, color: '#666', marginTop: 12, lineHeight: 22 },
    newsMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
    metaLeft: { flexDirection: 'row', alignItems: 'center' },
    newsTime: { fontSize: 13, color: '#888', marginLeft: 5 },
    readMoreButton: { backgroundColor: '#f0f7ff', padding: 8, borderRadius: 6 },
    readMoreText: { color: '#1e90ff', fontWeight: '600', fontSize: 13 },
    divider: { height: 1, backgroundColor: '#f0f0f0', marginTop: 20 },
    scrollTopButton: { position: 'absolute', bottom: 30, right: 20, backgroundColor: '#1e90ff', width: 45, height: 45, borderRadius: 22.5, justifyContent: 'center', alignItems: 'center', elevation: 5 },
    loadingMoreContainer: { padding: 20, alignItems: 'center' }
});