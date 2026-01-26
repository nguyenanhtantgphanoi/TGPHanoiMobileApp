import React, { useRef, useState, useEffect } from 'react';
import {
    StyleSheet,
    View,
    BackHandler,
    TouchableOpacity,
    ActivityIndicator,
    Text,
    Modal,
    TouchableWithoutFeedback,
} from 'react-native';
import WebView from 'react-native-webview';
import * as Progress from 'react-native-progress';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const THEMES = {
    white: { bg: '#ffffff', text: '#1a1a1a', card: '#ffffff', border: '#eee' },
    sepia: { bg: '#f4ecd8', text: '#5b4636', card: '#efe3c5', border: '#d3c1a5' },
    dark: { bg: '#121212', text: '#e0e0e0', card: '#1e1e1e', border: '#333' },
};

export default function NewsDetail({ linkWeb }) {
    const webViewRef = useRef(null);
    const insets = useSafeAreaInsets();
    const navigation = useNavigation();
    const [canGoBack, setCanGoBack] = useState(false);
    const [progress, setProgress] = useState(0);
    const [isWebViewLoaded, setIsWebViewLoaded] = useState(false);
    const [readerMode, setReaderMode] = useState(true);
    const isScriptInjected = useRef(false);

    const [showSettings, setShowSettings] = useState(false);
    const [fontSize, setFontSize] = useState(18);
    const [theme, setTheme] = useState('white');

    useEffect(() => {
        const loadSettings = async () => {
            try {
                const savedFontSize = await AsyncStorage.getItem('reader_fontSize');
                const savedTheme = await AsyncStorage.getItem('reader_theme');
                if (savedFontSize) setFontSize(parseInt(savedFontSize));
                if (savedTheme) setTheme(savedTheme);
            } catch (e) {
                console.log("Không thể tải cài đặt", e);
            }
        };
        loadSettings();
    }, []);

    useEffect(() => {
        const saveSettings = async () => {
            try {
                await AsyncStorage.setItem('reader_fontSize', fontSize.toString());
                await AsyncStorage.setItem('reader_theme', theme);
            } catch (e) {
                console.log("Không thể lưu cài đặt", e);
            }
        };
        saveSettings();
    }, [fontSize, theme]);

    const getReaderCSS = (fSize, tName) => `
        * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; text-decoration: none !important; }
        html, body { 
            margin: 0; padding: 0; 
            width: 100%; 
            overflow-x: hidden !important; 
            background: ${THEMES[tName].bg}; 
            color: ${THEMES[tName].text}; 
            font-family: -apple-system, sans-serif; 
            line-height: 1.6; 
            font-size: ${fSize}px;
        }
        body { padding: 0 20px; }
        h1 { 
            font-size: ${fSize + 6}px; 
            margin: 25px 0; 
            font-weight: 700; 
            text-align: center; 
            line-height: 1.3;
        }
        .content p, .content div, .content li { font-size: ${fSize}px !important; }
        img, figure { 
            display: block !important;
            height: auto !important;
            width: 100vw !important;
            max-width: none !important;
            position: relative;
            left: 50%;
            right: 50%;
            margin-left: -50vw !important;
            margin-right: -50vw !important;
            object-fit: cover;
        }
        figure { margin: 20px 0; padding: 0; }
        .group-header-title { 
            font-size: ${fSize + 2}px; font-weight: bold; color: #b30000; 
            margin: 30px 0 15px 0; text-transform: uppercase;
            border-bottom: 2px solid #b30000; padding-bottom: 5px;
        }
        .data-card { 
            background: ${THEMES[tName].card}; border: 1px solid ${THEMES[tName].border}; 
            border-radius: 12px; padding: 15px; margin-bottom: 15px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.05);
        }
        .data-item-row { margin-bottom: 10px; display: flex; flex-direction: column; }
        .data-label { font-size: ${fSize - 5}px; color: #888; text-transform: uppercase; font-weight: bold; }
        .data-value { font-size: ${fSize - 1}px; color: ${THEMES[tName].text}; margin-top: 2px; }
        .data-value a { color: #0044cc !important; }
    `;

    const activateReaderScript = `
        (function() {
            if (window.__READER_MODE_ACTIVE__) return;
            window.__READER_MODE_ACTIVE__ = true;
            try {
                const title = document.querySelector('h1')?.innerText || document.title;
                const containerNode = document.querySelector('.elementor-widget-theme-post-content') || 
                                     document.querySelector('article') || 
                                     document.querySelector('main');
                if (!containerNode) return;
                const contentNode = containerNode.cloneNode(true);
                const junk = ['script', 'style', '.ads', '.social-share', '.sfsi_responsive_icons', '.sfsi_icons_container', '.fb-like', '.share-buttons', 'footer', 'nav', '[class*="facebook"]', '[class*="twitter"]', '[class*="share"]'];
                contentNode.querySelectorAll(junk.join(',')).forEach(el => el.remove());
                const tables = contentNode.querySelectorAll('table');
                tables.forEach(table => {
                    const rows = Array.from(table.querySelectorAll('tr'));
                    if (rows.length === 0) return;
                    const container = document.createElement('div');
                    container.className = 'custom-table-container';
                    const headerRow = rows[0];
                    const headers = Array.from(headerRow.querySelectorAll('th, td')).map(h => h.innerText.trim());
                    let currentGroupTitle = "";
                    for (let i = 1; i < rows.length; i++) {
                        const cells = Array.from(rows[i].querySelectorAll('td'));
                        if (cells.length === 0) continue;
                        let dataCells = [];
                        if (cells.length === headers.length) {
                            const groupTitle = cells[0].innerText.trim();
                            if (groupTitle && groupTitle !== currentGroupTitle) {
                                currentGroupTitle = groupTitle;
                                const titleDiv = document.createElement('div');
                                titleDiv.className = 'group-header-title';
                                titleDiv.innerText = currentGroupTitle;
                                container.appendChild(titleDiv);
                            }
                            dataCells = cells.slice(1);
                        } else { dataCells = cells; }
                        const card = document.createElement('div');
                        card.className = 'data-card';
                        dataCells.forEach((cell, index) => {
                            const label = headers[index + 1] || headers[index];
                            const item = document.createElement('div');
                            item.className = 'data-item-row';
                            item.innerHTML = \`<span class="data-label">\${label}</span><span class="data-value">\${cell.innerHTML}</span>\`;
                            card.appendChild(item);
                        });
                        container.appendChild(card);
                    }
                    table.parentNode.replaceChild(container, table);
                });
                const readerHTML = \`<html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"><style id="reader-style">\${${JSON.stringify(getReaderCSS(fontSize, theme))}}</style></head><body><h1>\${title}</h1><div class="content">\${contentNode.innerHTML}</div><div style="height:100px;"></div></body></html>\`;
                document.open(); document.write(readerHTML); document.close();
                window.ReactNativeWebView.postMessage("reader-activated");
            } catch(e) { window.ReactNativeWebView.postMessage("error"); }
        })();
        true;
    `;

    const toggleReaderMode = () => {
        isScriptInjected.current = false;
        if (readerMode) {
            setReaderMode(false);
            webViewRef.current?.reload();
        } else {
            setReaderMode(true);
            webViewRef.current?.injectJavaScript(activateReaderScript);
        }
    };

    useEffect(() => {
        if (readerMode && isWebViewLoaded) {
            const cssContent = getReaderCSS(fontSize, theme).replace(/\n/g, ' ');
            webViewRef.current?.injectJavaScript(`(function(){var s=document.getElementById('reader-style');if(s)s.innerHTML=\`${cssContent}\`;})();true;`);
        }
    }, [fontSize, theme]);

    const handleBackAction = () => {
        if (canGoBack) webViewRef.current?.goBack();
        else navigation.goBack();
        return true;
    };

    useEffect(() => {
        const backHandler = BackHandler.addEventListener('hardwareBackPress', handleBackAction);
        return () => backHandler.remove();
    }, [canGoBack]);

    return (
        <View style={[styles.container, { backgroundColor: readerMode ? THEMES[theme].bg : '#fff' }]}>
            <View style={[styles.toolbar, { paddingTop: insets.top + 10, backgroundColor: readerMode ? THEMES[theme].bg : '#fff' }]}>
                <TouchableOpacity onPress={handleBackAction} style={styles.iconBtn}><Ionicons name="chevron-back" size={24} color={readerMode ? THEMES[theme].text : "#333"} /></TouchableOpacity>
                <View style={[styles.urlBar, readerMode && { backgroundColor: THEMES[theme].card }]}><Text style={[styles.urlText, readerMode && { color: THEMES[theme].text }]} numberOfLines={1}>{linkWeb.split('/')[2]}</Text></View>
                {readerMode && <TouchableOpacity onPress={() => setShowSettings(true)} style={styles.iconBtn}><Ionicons name="text-outline" size={20} color={THEMES[theme].text} /></TouchableOpacity>}
                <TouchableOpacity onPress={toggleReaderMode} style={[styles.readerBtn, readerMode && styles.readerBtnActive]}><Ionicons name="document-text" size={18} color={readerMode ? "#fff" : "#007aff"} /></TouchableOpacity>
            </View>
            {progress < 1 && <Progress.Bar progress={progress} width={null} borderWidth={0} color="#007aff" height={2} />}
            <WebView
                ref={webViewRef}
                source={{ uri: linkWeb }}
                style={styles.webview}
                onMessage={(e) => { if (e.nativeEvent.data === "reader-activated") setReaderMode(true); }}
                onLoadEnd={() => { setIsWebViewLoaded(true); if (readerMode && !isScriptInjected.current) { isScriptInjected.current = true; webViewRef.current?.injectJavaScript(activateReaderScript); } }}
                onLoadProgress={({ nativeEvent }) => setProgress(nativeEvent.progress)}
                onNavigationStateChange={(navState) => setCanGoBack(navState.canGoBack)}
                decelerationRate={0.998} bounces={true}
            />

            <Modal visible={showSettings} transparent animationType="slide" onRequestClose={() => setShowSettings(false)}>
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setShowSettings(false)}
                >
                    <TouchableOpacity
                        activeOpacity={1}
                        style={styles.panelContainer}
                    >
                        <View style={styles.panel}>
                            <Text style={styles.panelTitle}>Tùy chỉnh</Text>
                            <View style={styles.row}>
                                <TouchableOpacity onPress={() => setFontSize(f => Math.max(12, f - 2))} style={styles.btnSmall}><Text>A-</Text></TouchableOpacity>
                                <Text style={styles.sizeText}>{fontSize}</Text>
                                <TouchableOpacity onPress={() => setFontSize(f => Math.min(32, f + 2))} style={styles.btnSmall}><Text>A+</Text></TouchableOpacity>
                            </View>
                            <View style={styles.row}>{Object.keys(THEMES).map(t => (<TouchableOpacity key={t} onPress={() => setTheme(t)} style={[styles.themeCircle, { backgroundColor: THEMES[t].bg, borderWidth: theme === t ? 2 : 1, borderColor: '#007aff' }]} />))}</View>
                            <TouchableOpacity style={styles.closeBtn} onPress={() => setShowSettings(false)}><Text style={{ color: '#fff', fontWeight: 'bold' }}>Hoàn tất</Text></TouchableOpacity>
                        </View>
                    </TouchableOpacity>
                </TouchableOpacity>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 }, webview: { flex: 1 },
    toolbar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, paddingBottom: 10, borderBottomWidth: 0.5, borderBottomColor: '#eee' },
    urlBar: { flex: 1, backgroundColor: '#f0f0f2', marginHorizontal: 10, paddingVertical: 8, borderRadius: 10, alignItems: 'center' },
    urlText: { fontSize: 14 }, iconBtn: { width: 35, height: 35, justifyContent: 'center', alignItems: 'center' },
    readerBtn: { width: 32, height: 32, borderRadius: 6, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0f0f2' },
    readerBtnActive: { backgroundColor: '#007aff' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
    panelContainer: { width: '100%' }, // Đảm bảo container của panel chiếm hết chiều ngang để không bị bấm hụt
    panel: { backgroundColor: '#fff', padding: 25, borderTopLeftRadius: 24, borderTopRightRadius: 24, elevation: 5 },
    panelTitle: { textAlign: 'center', fontWeight: 'bold', marginBottom: 20, fontSize: 16 },
    row: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', marginBottom: 25 },
    btnSmall: { padding: 12, backgroundColor: '#f0f0f2', borderRadius: 10, width: 60, alignItems: 'center' },
    sizeText: { fontSize: 20, fontWeight: 'bold' }, themeCircle: { width: 45, height: 45, borderRadius: 25 },
    closeBtn: { backgroundColor: '#007aff', padding: 16, borderRadius: 14, alignItems: 'center', marginTop: 10 }
});