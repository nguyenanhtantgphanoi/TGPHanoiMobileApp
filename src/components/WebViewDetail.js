import React, { useRef, useState, useEffect } from 'react';
import {
    StyleSheet,
    View,
    Platform,
    BackHandler,
    AppState,
    TouchableOpacity,
    TextInput,
} from 'react-native';
import WebView from 'react-native-webview';
import * as Progress from 'react-native-progress';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

export default function WebViewDetail({ linkWeb }) {
    const webViewRef = useRef(null);
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();
    const [canGoBack, setCanGoBack] = useState(false);
    const [progress, setProgress] = useState(0);
    const [webViewKey, setWebViewKey] = useState(0);
    const [isWebViewLoaded, setIsWebViewLoaded] = useState(true);
    const [showSearchBox, setShowSearchBox] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const appState = useRef(AppState.currentState);
    const timeoutRef = useRef(null);
    const searchTimeoutRef = useRef(null);

    const injectScript = () => {
        const spacerHeight = insets.top + 8;

        const script = `
      (function() {
        const spacer = document.createElement('div');
        spacer.style.height = '${spacerHeight}px';
        spacer.style.width = '100%';
        spacer.style.background = 'transparent';
        spacer.style.display = 'block';
        if (document.body && document.body.firstChild) {
          document.body.insertBefore(spacer, document.body.firstChild);
        }

        const classNames = ['site-header', 'elementor-button-wrapper'];
        classNames.forEach(function(className) {
          const elements = document.getElementsByClassName(className);
          for (var i = 0; i < elements.length; i++) {
            elements[i].style.setProperty('display', 'none', 'important');
            elements[i].style.setProperty('visibility', 'hidden', 'important');
            elements[i].style.setProperty('opacity', '0', 'important');
          }
        });

        window.ReactNativeWebView.postMessage("header-hidden");
      })();
      true;
    `;
        webViewRef.current?.injectJavaScript(script);
    };

    // Android back
    useEffect(() => {
        const onBackPress = () => {
            if (canGoBack && webViewRef.current) {
                webViewRef.current.goBack();
                return true;
            }
            return false;
        };

        const backHandler = BackHandler.addEventListener('hardwareBackPress', onBackPress);
        return () => backHandler.remove();
    }, [canGoBack]);

    // Reload nếu WebView bị trắng sau khi resume
    useEffect(() => {
        const handleAppStateChange = (nextAppState) => {
            if (
                appState.current.match(/inactive|background/) &&
                nextAppState === 'active'
            ) {
                timeoutRef.current = setTimeout(() => {
                    if (!isWebViewLoaded) {
                        console.log('🔁 Reload CathCalendar WebView vì bị trắng khi resume');
                        setWebViewKey(prev => prev + 1);
                    }
                }, 500);
            }
            appState.current = nextAppState;
        };

        const subscription = AppState.addEventListener('change', handleAppStateChange);
        return () => {
            subscription.remove();
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
        };
    }, [isWebViewLoaded]);

        const handleExit = () => {
                if (navigation?.canGoBack?.()) {
                        navigation.goBack();
                }
        };

        const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

        const handleSearch = (keywordText) => {
            const keyword = (keywordText ?? searchQuery).trim();
                if (!keyword) return;

                const escapedKeyword = escapeRegExp(keyword);
                const script = `
            (function() {
                try {
                    var keyword = ${JSON.stringify(escapedKeyword)};
                    var regex = new RegExp(keyword, 'i');
                    var walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null);
                    var targetNode = null;
                    while (walker.nextNode()) {
                        var node = walker.currentNode;
                        if (node && node.nodeValue && regex.test(node.nodeValue)) {
                            targetNode = node;
                            break;
                        }
                    }

                    if (!targetNode) {
                        window.ReactNativeWebView.postMessage('search-not-found');
                        return true;
                    }

                    var range = document.createRange();
                    var match = targetNode.nodeValue.match(regex);
                    var start = match ? match.index : 0;
                    var end = start + (match ? match[0].length : 1);
                    range.setStart(targetNode, start);
                    range.setEnd(targetNode, end);

                    var selection = window.getSelection();
                    selection.removeAllRanges();
                    selection.addRange(range);

                    var parentElement = targetNode.parentElement;
                    if (parentElement && parentElement.scrollIntoView) {
                        parentElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }

                    window.ReactNativeWebView.postMessage('search-found');
                } catch (e) {
                    window.ReactNativeWebView.postMessage('search-error');
                }
                return true;
            })();
        `;

                webViewRef.current?.injectJavaScript(script);
        };

    const handleTypingSearch = (text) => {
        setSearchQuery(text);

        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }

        const trimmedText = text.trim();
        if (!trimmedText) return;

        searchTimeoutRef.current = setTimeout(() => {
            handleSearch(trimmedText);
        }, 180);
    };

    return (
        <View style={styles.container}>
            {/* Thanh progress */}
            {progress < 1 && (
                <View style={{ position: 'absolute', top: insets.top, left: 0, right: 0, zIndex: 10 }}>
                    <Progress.Bar
                        progress={progress}
                        width={null}
                        borderWidth={0}
                        color="#1e90ff"
                        unfilledColor="#f0f0f0"
                        height={4}
                    />
                </View>
            )}

            <WebView
                key={webViewKey}
                ref={webViewRef}
                source={{ uri: linkWeb }}
                style={[styles.webview, { opacity: progress < 1 ? 0 : 1 }]}
                javaScriptEnabled
                domStorageEnabled
                startInLoadingState={false}
                bounces={true}
                showsVerticalScrollIndicator={false}
                useWebKit={true}
                allowsBackForwardNavigationGestures={Platform.OS === 'ios'}
                decelerationRate={Platform.OS === 'ios' ? 'normal' : 0.985}
                onNavigationStateChange={(navState) => setCanGoBack(navState.canGoBack)}
                onLoadEnd={() => {
                    setIsWebViewLoaded(true);
                    injectScript();
                    if (timeoutRef.current) clearTimeout(timeoutRef.current);
                }}
                onError={() => {
                    setIsWebViewLoaded(false);
                }}
                onMessage={(event) => {
                    const message = event.nativeEvent.data;
                    if (message === 'header-hidden') {
                        setProgress(1);
                    }
                }}
                onLoadProgress={({ nativeEvent }) => setProgress(nativeEvent.progress)}
                injectedJavaScriptBeforeContentLoaded={`
          document.body.style['-webkit-overflow-scrolling'] = 'touch';
          document.body.style.overflow = 'scroll';
          true;
        `}
            />

            <View style={[styles.topControlsRow, { top: insets.top + 8, left: 10, right: 10 }]}> 
                <TouchableOpacity
                    onPress={() => canGoBack && webViewRef.current?.goBack()}
                    disabled={!canGoBack}
                    style={[styles.floatingButton, !canGoBack && styles.floatingButtonDisabled]}
                >
                    <Ionicons name="arrow-back" size={22} color={!canGoBack ? '#999' : '#000'} />
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={() => setShowSearchBox(prev => !prev)}
                    style={styles.floatingButton}
                >
                    <Ionicons name="search" size={22} color="#000" />
                </TouchableOpacity>

                {showSearchBox && (
                    <View style={styles.inlineSearchBox}>
                        <TextInput
                            value={searchQuery}
                            onChangeText={handleTypingSearch}
                            onSubmitEditing={() => handleSearch()}
                            placeholder="Tìm trong trang..."
                            placeholderTextColor="#888"
                            style={styles.searchInput}
                            returnKeyType="search"
                        />
                    </View>
                )}

                <TouchableOpacity
                    onPress={handleExit}
                    style={styles.floatingButton}
                >
                    <Ionicons name="close" size={22} color="#000" />
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    webview: {
        flex: 1,
    },
    topControlsRow: {
        position: 'absolute',
        zIndex: 100,
        flexDirection: 'row',
        alignItems: 'center',
        columnGap: 8,
    },
    floatingButton: {
        position: 'relative',
        padding: 10,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderRadius: 24,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    floatingButtonDisabled: {
        backgroundColor: 'rgba(255, 255, 255, 0.75)',
    },
    inlineSearchBox: {
        flex: 1,
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderRadius: 12,
        paddingHorizontal: 10,
        paddingVertical: 6,
        elevation: 4,
    },
    searchInput: {
        flex: 1,
        fontSize: 14,
        color: '#111',
        paddingVertical: 4,
    },
});
