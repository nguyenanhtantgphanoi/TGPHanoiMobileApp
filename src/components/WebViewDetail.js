import React, { useRef, useState, useEffect } from 'react';
import {
    StyleSheet,
    View,
    Platform,
    BackHandler,
    AppState,
} from 'react-native';
import WebView from 'react-native-webview';
import * as Progress from 'react-native-progress';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function WebViewDetail({ linkWeb }) {
    const webViewRef = useRef(null);
    const insets = useSafeAreaInsets();
    const [canGoBack, setCanGoBack] = useState(false);
    const [progress, setProgress] = useState(0);
    const [webViewKey, setWebViewKey] = useState(0);
    const [isWebViewLoaded, setIsWebViewLoaded] = useState(true);
    const appState = useRef(AppState.currentState);
    const timeoutRef = useRef(null);

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
        };
    }, [isWebViewLoaded]);

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
                onMessage={() => setProgress(1)} // Khi nhận "header-hidden" thì set full
                onLoadProgress={({ nativeEvent }) => setProgress(nativeEvent.progress)}
                injectedJavaScriptBeforeContentLoaded={`
          document.body.style['-webkit-overflow-scrolling'] = 'touch';
          document.body.style.overflow = 'scroll';
          true;
        `}
            />
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
});
