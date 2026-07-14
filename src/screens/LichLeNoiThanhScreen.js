import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, ActivityIndicator, TouchableOpacity, Text, Alert, TextInput } from 'react-native';
import WebView from 'react-native-webview';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function LichLeNoiThanhScreen({ navigation }) {
    const insets = useSafeAreaInsets();
    const webViewRef = useRef(null);
    const [htmlContent, setHtmlContent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [canGoBack, setCanGoBack] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchIndex, setSearchIndex] = useState(0);

    // Fetch HTML content from API
    useEffect(() => {
        fetchHtmlContent();
    }, []);

    const fetchHtmlContent = async () => {
        try {
            setLoading(true);
            // Replace with your actual API endpoint
            const response = await fetch('https://www.tonggiaophanhanoi.org/gio-le-tai-ha-noi-xep-theo-thu-tu-ten-nha-tho/');
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const htmlText = await response.text();
            setHtmlContent(htmlText);
        } catch (error) {
            console.error('Error fetching HTML content:', error);
            Alert.alert(
                'Lỗi',
                'Không thể tải dữ liệu. Vui lòng kiểm tra kết nối internet.',
                [
                    { text: 'Thử lại', onPress: fetchHtmlContent },
                    { text: 'Quay lại', onPress: () => navigation.goBack() }
                ]
            );
        } finally {
            setLoading(false);
        }
    };

    const handleWebViewNavigationStateChange = (newNavState) => {
        setCanGoBack(newNavState.canGoBack);
    };

    const handleSearch = (query) => {
        setSearchQuery(query);
        setSearchIndex(0);
        if (query.trim().length > 0) {
            searchOnWebPage(query, 0);
        }
    };

    const searchOnWebPage = (query, index) => {
        if (!webViewRef.current || !query.trim()) return;

        const searchScript = `
            (function() {
                const searchTerm = "${query.replace(/"/g, '\\"')}";
                const bodyText = document.body.innerText;
                
                // Find all text nodes containing the search term
                const walker = document.createTreeWalker(
                    document.body,
                    NodeFilter.SHOW_TEXT,
                    null,
                    false
                );
                
                let node;
                let matches = [];
                let count = 0;
                
                while (node = walker.nextNode()) {
                    if (node.textContent.toLowerCase().includes(searchTerm.toLowerCase())) {
                        const text = node.textContent.toLowerCase();
                        let startIndex = 0;
                        while ((startIndex = text.indexOf(searchTerm.toLowerCase(), startIndex)) !== -1) {
                            matches.push({
                                node: node,
                                start: startIndex,
                                end: startIndex + searchTerm.length
                            });
                            startIndex++;
                        }
                    }
                }
                
                // Clear previous highlights
                document.querySelectorAll('.search-highlight').forEach(el => {
                    el.classList.remove('search-highlight');
                    el.style.backgroundColor = '';
                });
                
                if (matches.length > 0) {
                    const currentIndex = ${index} % matches.length;
                    const match = matches[currentIndex];
                    
                    // Highlight the current match
                    const span = document.createElement('span');
                    span.className = 'search-highlight';
                    span.style.backgroundColor = 'yellow';
                    
                    // Scroll to the element
                    const range = document.createRange();
                    range.setStart(match.node, match.start);
                    range.setEnd(match.node, match.end);
                    
                    const rect = range.getBoundingClientRect();
                    window.scrollTo({
                        top: window.scrollY + rect.top - 100,
                        behavior: 'smooth'
                    });
                    
                    window.ReactNativeWebView.postMessage(JSON.stringify({
                        type: 'searchResult',
                        current: currentIndex + 1,
                        total: matches.length
                    }));
                } else {
                    window.ReactNativeWebView.postMessage(JSON.stringify({
                        type: 'searchResult',
                        current: 0,
                        total: 0
                    }));
                }
            })();
            true;
        `;

        webViewRef.current.injectJavaScript(searchScript);
    };

    const handleNextResult = () => {
        if (searchQuery.trim()) {
            setSearchIndex(prev => prev + 1);
            searchOnWebPage(searchQuery, searchIndex + 1);
        }
    };

    const handlePreviousResult = () => {
        if (searchQuery.trim()) {
            setSearchIndex(prev => Math.max(0, prev - 1));
            searchOnWebPage(searchQuery, Math.max(0, searchIndex - 1));
        }
    };

    const removeHeader = () => {
        const script = `
            (function() {
                const classNames = ['site-header', 'elementor-button-wrapper', 'header', 'navbar', 'navigation', 'wp-header'];
                classNames.forEach(function(className) {
                    const elements = document.getElementsByClassName(className);
                    for (var i = elements.length - 1; i >= 0; i--) {
                        elements[i].style.setProperty('display', 'none', 'important');
                        elements[i].style.setProperty('visibility', 'hidden', 'important');
                        elements[i].style.setProperty('opacity', '0', 'important');
                    }
                });

                const tagNames = ['header', 'nav'];
                tagNames.forEach(function(tagName) {
                    const elements = document.getElementsByTagName(tagName);
                    for (var i = elements.length - 1; i >= 0; i--) {
                        elements[i].style.setProperty('display', 'none', 'important');
                        elements[i].style.setProperty('visibility', 'hidden', 'important');
                        elements[i].style.setProperty('opacity', '0', 'important');
                    }
                });

                const firstH2 = document.querySelector('h2');
                if (firstH2) {
                    firstH2.style.setProperty('font-size', '20px', 'important');
                }

                window.ReactNativeWebView.postMessage("header-removed");
            })();
            true;
        `;
        webViewRef.current?.injectJavaScript(script);
    };

    return (
        <View style={styles.container}>
            {/* Search Box */}
            <View style={[styles.searchContainer, { top: insets.top }]}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={styles.backButtonInSearch}
                >
                    <MaterialIcons name="arrow-back" size={24} color="#000" />
                </TouchableOpacity>
                <TextInput
                    style={styles.searchInput}
                    placeholder="Tìm kiếm..."
                    placeholderTextColor="#999"
                    value={searchQuery}
                    onChangeText={handleSearch}
                />
                {searchQuery.trim().length > 0 && (
                    <View style={styles.searchControls}>
                        <TouchableOpacity onPress={handlePreviousResult} style={styles.searchButton}>
                            <MaterialIcons name="arrow-upward" size={20} color="#000" />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={handleNextResult} style={styles.searchButton}>
                            <MaterialIcons name="arrow-downward" size={20} color="#000" />
                        </TouchableOpacity>
                        <TouchableOpacity 
                            onPress={() => {
                                setSearchQuery('');
                                setSearchIndex(0);
                            }} 
                            style={styles.searchButton}
                        >
                            <MaterialIcons name="close" size={20} color="#000" />
                        </TouchableOpacity>
                    </View>
                )}
            </View>

            {loading && (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#0000ff" />
                    <Text style={styles.loadingText}>Đang tải dữ liệu...</Text>
                </View>
            )}

            {htmlContent && (
                <WebView
                    ref={webViewRef}
                    originWhitelist={['*']}
                    source={{ html: htmlContent, baseUrl: 'https://www.tonggiaophanhanoi.org/' }}
                    onNavigationStateChange={handleWebViewNavigationStateChange}
                    onLoad={removeHeader}
                    startInLoadingState={true}
                    renderLoading={() => (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color="#0000ff" />
                        </View>
                    )}
                    style={{ marginTop: 120 }}
                />
            )}

            <TouchableOpacity
                onPress={() => navigation.goBack()}
                style={[styles.backButton, { top: insets.top + 10, left: 10 }]}
            >
                <MaterialIcons name="arrow-back" size={28} color="#000" />
            </TouchableOpacity>

            {/* {canGoBack && htmlContent && (
                <TouchableOpacity
                    onPress={() => webViewRef.current?.goBack()}
                    style={[styles.backWebButton, { top: insets.top + 10, left: 60 }]}
                >
                    <MaterialIcons name="navigate-before" size={28} color="#000" />
                </TouchableOpacity>
            )} */}

            <TouchableOpacity
                onPress={fetchHtmlContent}
                style={[styles.refreshButton, { top: insets.top + 10, right: 10 }]}
            >
                <MaterialIcons name="refresh" size={28} color="#000" />
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    searchContainer: {
        position: 'absolute',
        left: 0,
        right: 0,
        zIndex: 101,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        paddingHorizontal: 10,
        paddingTop: 10,
        paddingBottom: 10,
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#ddd',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    searchInput: {
        flex: 1,
        height: 40,
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        paddingHorizontal: 12,
        fontSize: 16,
        backgroundColor: '#f5f5f5',
        marginLeft: 8,
    },
    backButtonInSearch: {
        padding: 8,
        borderRadius: 6,
    },
    searchControls: {
        flexDirection: 'row',
        marginLeft: 8,
        gap: 8,
    },
    searchButton: {
        padding: 8,
        borderRadius: 6,
        backgroundColor: '#e0e0e0',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: '#666',
    },
    backButton: {
        position: 'absolute',
        zIndex: 100,
        padding: 10,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderRadius: 24,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    backWebButton: {
        position: 'absolute',
        zIndex: 100,
        padding: 10,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderRadius: 24,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    refreshButton: {
        position: 'absolute',
        zIndex: 100,
        padding: 10,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderRadius: 24,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
});
