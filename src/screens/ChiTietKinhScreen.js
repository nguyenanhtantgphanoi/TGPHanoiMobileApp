import React, { useEffect, useMemo, useState } from "react";
import {
    View,
    ScrollView,
    Text,
    TouchableOpacity,
    useWindowDimensions,
    StatusBar,
} from "react-native";
import RenderHTML from "react-native-render-html";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useIsFocused } from "@react-navigation/native"; // Cần thiết để đồng bộ

/* ================= CONSTANT (DÙNG CHUNG) ================= */
const FONT_SCALE_KEY = "@kinh_font_scale";
const DARK_MODE_KEY = "@kinh_dark_mode";

/* ================= UTILS ================= */
const extractBodyHTML = (html) => {
    if (!html) return "";
    const match = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
    return match ? match[1] : html;
};

/* ================= SCREEN ================= */
export default function ChiTietKinhScreen({ route }) {
    const { html } = route.params;
    const { width } = useWindowDimensions();
    const isFocused = useIsFocused(); // Theo dõi trạng thái màn hình

    const [fontScale, setFontScale] = useState(1);
    const [darkMode, setDarkMode] = useState(false);
    const [ready, setReady] = useState(false);

    /* ========== LOAD & SYNC SETTINGS ========== */
    const loadSettings = async () => {
        try {
            const savedFont = await AsyncStorage.getItem(FONT_SCALE_KEY);
            const savedDark = await AsyncStorage.getItem(DARK_MODE_KEY);

            if (savedFont) setFontScale(parseFloat(savedFont));
            if (savedDark) setDarkMode(savedDark === "true");
        } catch (err) {
            console.log("Load setting error", err);
        } finally {
            setReady(true);
        }
    };

    // Load khi vào màn hình hoặc khi màn hình được quay lại (focus)
    useEffect(() => {
        if (isFocused) {
            loadSettings();
        }
    }, [isFocused]);

    /* ========== SAVE SETTINGS ========== */
    const updateFontScale = (scale) => {
        const newScale = Math.max(0.8, Math.min(1.8, scale));
        setFontScale(newScale);
        AsyncStorage.setItem(FONT_SCALE_KEY, newScale.toString());
    };

    const toggleDarkMode = () => {
        const nextMode = !darkMode;
        setDarkMode(nextMode);
        AsyncStorage.setItem(DARK_MODE_KEY, nextMode.toString());
    };

    const bodyHtml = useMemo(() => extractBodyHTML(html), [html]);

    /* ========== THEME ========== */
    const colors = useMemo(
        () => ({
            bg: darkMode ? "#121212" : "#FFFFFF",
            text: darkMode ? "#EAEAEA" : "#000000",
            title: darkMode ? "#FFB3B3" : "#8B0000",
            controlBg: darkMode ? "#1E1E1E" : "#F4F4F4",
            border: darkMode ? "#333" : "#DDD",
        }),
        [darkMode]
    );

    /* ========== HTML STYLES ========== */
    const tagsStyles = useMemo(
        () => ({
            body: { color: colors.text, fontWeight: "bold" },
            h1: { fontSize: 22 * fontScale, fontWeight: "bold", textAlign: "center", marginBottom: 16, color: colors.title },
            h2: { fontSize: 18 * fontScale, fontWeight: "bold", textAlign: "center", marginVertical: 10, color: colors.title },
            h3: { fontSize: 17 * fontScale, fontWeight: "bold", marginVertical: 8, color: colors.title },
            h4: { fontSize: 16 * fontScale, fontWeight: "bold", marginVertical: 6, color: colors.title },
            p: { fontSize: 18 * fontScale, lineHeight: 30 * fontScale, marginBottom: 10, color: colors.text, textAlign: 'justify' },
            em: { fontStyle: "italic", color: colors.text },
            strong: { fontWeight: "bold", color: colors.text },
            hr: { borderColor: colors.title, borderBottomWidth: 5, margin: 30 },
        }),
        [fontScale, colors]
    );
    const classesStyles = useMemo(
        () => ({
            speaker: {fontWeight: 'bold', color: '#8B0000'},
            dialogue:{marginVertical: 10},
            sign: {fontWeight: 'bold'},
            divider: {textAlign: 'center', marginVertical: 30, fontWeight: 'bold'},
            indent: {marginHorizontal: 10},
            red: {color: '#ff0000'},
            italic: {fontStyle:"italic"},
            exception: {backgroundColor: '#e0e0e0d8', padding: 10},
            bold: {fontWeight: 'bold'},
            justify:{textAlign: 'justify'}
        }),
        [fontScale, colors]
    );
    if (!ready) return null;

    return (
        <View style={{ flex: 1, backgroundColor: colors.bg }}>
            <StatusBar
                barStyle={darkMode ? "light-content" : "dark-content"}
                backgroundColor={colors.bg}
            />

            <SafeAreaView edges={["top"]} style={{ backgroundColor: colors.bg }} />

            {/* ========== CONTROL BAR (ĐỒNG BỘ) ========== */}
            <View
                style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    paddingHorizontal: 16,
                    paddingVertical: 10,
                    backgroundColor: colors.controlBg,
                    borderBottomWidth: 1,
                    borderBottomColor: colors.border,
                }}
            >
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <TouchableOpacity onPress={() => updateFontScale(fontScale - 0.1)}>
                        <Text style={{ fontSize: 18, color: colors.text }}>A−</Text>
                    </TouchableOpacity>

                    <Text style={{ marginHorizontal: 12, color: colors.text, fontSize: 14 }}>
                        {Math.round(fontScale * 100)}%
                    </Text>

                    <TouchableOpacity onPress={() => updateFontScale(fontScale + 0.1)}>
                        <Text style={{ fontSize: 18, color: colors.text }}>A+</Text>
                    </TouchableOpacity>
                </View>

                <TouchableOpacity onPress={toggleDarkMode}>
                    <Text style={{ fontSize: 18 }}>{darkMode ? "🌙" : "☀️"}</Text>
                </TouchableOpacity>
            </View>

            {/* ========== CONTENT ========== */}
            <ScrollView contentContainerStyle={{ padding: 16 }}>
                <RenderHTML
                    contentWidth={width}
                    source={{ html: bodyHtml }}
                    ignoredDomTags={["head", "style", "meta", "link"]}
                    enableCSSInlineProcessing={false}
                    tagsStyles={tagsStyles}
                    classesStyles={classesStyles}
                    baseStyle={{ color: colors.text, backgroundColor: colors.bg }}
                    defaultTextProps={{ selectable: true }}
                />
            </ScrollView>
        </View>
    );
}