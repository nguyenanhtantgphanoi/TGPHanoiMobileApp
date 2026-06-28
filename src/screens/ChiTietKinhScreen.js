import React, { useEffect, useMemo, useRef, useState } from "react";
import {
    View,
    ScrollView,
    Text,
    TouchableOpacity,
    useWindowDimensions,
    StatusBar,
    TextInput,
} from "react-native";
import RenderHTML from "react-native-render-html";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useIsFocused } from "@react-navigation/native"; // Cần thiết để đồng bộ
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

/* ================= CONSTANT (DÙNG CHUNG) ================= */
const FONT_SCALE_KEY = "@kinh_font_scale";
const DARK_MODE_KEY = "@kinh_dark_mode";

/* ================= UTILS ================= */
const extractBodyHTML = (html) => {
    if (!html) return "";
    const match = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
    return match ? match[1] : html;
};

const normalizeForSearch = (value) =>
    value
        .normalize("NFD")
        .replace(/\p{M}/gu, "")
        .replace(/đ/g, "d")
        .replace(/Đ/g, "D");

const buildPlainTextIndex = (htmlText) => {
    let plainText = "";
    const map = [];
    let inTag = false;

    for (let i = 0; i < htmlText.length; i += 1) {
        const char = htmlText[i];

        if (char === "<") {
            inTag = true;
            continue;
        }
        if (char === ">" && inTag) {
            inTag = false;
            continue;
        }
        if (inTag) continue;

        plainText += char;
        map.push(i);
    }

    return { plainText, map };
};

const buildNormalizedTextWithMap = (text) => {
    const normalizedChars = [];
    const map = [];

    for (let i = 0; i < text.length; i += 1) {
        const normalized = normalizeForSearch(text[i]);
        if (!normalized) continue;

        for (let j = 0; j < normalized.length; j += 1) {
            normalizedChars.push(normalized[j]);
            map.push(i);
        }
    }

    return { normalizedText: normalizedChars.join(""), map };
};


/* ================= SCREEN ================= */
export default function ChiTietKinhScreen({ route, navigation }) {
    const { html } = route.params;
    const { width } = useWindowDimensions();
    const isFocused = useIsFocused(); // Theo dõi trạng thái màn hình

    const [fontScale, setFontScale] = useState(1);
    const [darkMode, setDarkMode] = useState(false);
    const [ready, setReady] = useState(false);
    const [showSearch, setShowSearch] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
    const [pendingScrollIndex, setPendingScrollIndex] = useState(null);
    const [contentHeight, setContentHeight] = useState(0);
    const [viewportHeight, setViewportHeight] = useState(0);
    const scrollRef = useRef(null);

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
    const trimmedQuery = useMemo(() => searchQuery.trim(), [searchQuery]);
    const { highlightedHtml, matchCount, matches, plainLength } = useMemo(() => {
        if (!trimmedQuery || !bodyHtml) {
            return { highlightedHtml: bodyHtml, matchCount: 0, matches: [], plainLength: 0 };
        }

        const normalizedQuery = normalizeForSearch(trimmedQuery).toLowerCase();
        if (!normalizedQuery) {
            return { highlightedHtml: bodyHtml, matchCount: 0, matches: [], plainLength: 0 };
        }

        const { plainText, map: plainToHtml } = buildPlainTextIndex(bodyHtml);
        const { normalizedText, map: normalizedToPlain } = buildNormalizedTextWithMap(plainText);
        const normalizedTextLower = normalizedText.toLowerCase();

        if (!normalizedTextLower.includes(normalizedQuery)) {
            return { highlightedHtml: bodyHtml, matchCount: 0, matches: [], plainLength: plainText.length };
        }

        const foundMatches = [];
        let searchIndex = 0;

        while (searchIndex <= normalizedTextLower.length - normalizedQuery.length) {
            const matchIndex = normalizedTextLower.indexOf(normalizedQuery, searchIndex);
            if (matchIndex === -1) break;

            const startPlain = normalizedToPlain[matchIndex];
            const endPlain = normalizedToPlain[matchIndex + normalizedQuery.length - 1] + 1;

            let contiguous = true;
            for (let i = startPlain; i < endPlain - 1; i += 1) {
                if (plainToHtml[i] + 1 !== plainToHtml[i + 1]) {
                    contiguous = false;
                    break;
                }
            }

            if (contiguous) {
                const startHtml = plainToHtml[startPlain];
                const endHtml = plainToHtml[endPlain - 1] + 1;
                foundMatches.push({
                    startHtml,
                    endHtml,
                    startPlain,
                    endPlain,
                    index: foundMatches.length,
                });
            }

            searchIndex = matchIndex + normalizedQuery.length;
        }

        if (!foundMatches.length) {
            return { highlightedHtml: bodyHtml, matchCount: 0, matches: [], plainLength: plainText.length };
        }

        const activeIndex = Math.min(currentMatchIndex, foundMatches.length - 1);
        let nextHtml = bodyHtml;
        for (let i = foundMatches.length - 1; i >= 0; i -= 1) {
            const { startHtml, endHtml, index } = foundMatches[i];
            const className =
                index === activeIndex ? "search-hit search-hit-active" : "search-hit";

            nextHtml =
                nextHtml.slice(0, startHtml) +
                `<span class="${className}" data-hit-index="${index}">` +
                nextHtml.slice(startHtml, endHtml) +
                "</span>" +
                nextHtml.slice(endHtml);
        }

        return {
            highlightedHtml: nextHtml,
            matchCount: foundMatches.length,
            matches: foundMatches,
            plainLength: plainText.length,
        };
    }, [bodyHtml, trimmedQuery, currentMatchIndex]);

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
            body: { color: colors.text },
            h1: { fontSize: 22 * fontScale, fontWeight: "bold", textAlign: "center", marginBottom: 16, color: colors.title },
            h2: { fontSize: 18 * fontScale, fontWeight: "bold", textAlign: "center", marginVertical: 10, color: colors.title },
            h3: { fontSize: 17 * fontScale, fontWeight: "bold", marginVertical: 8, color: colors.title },
            h4: { fontSize: 16 * fontScale, fontWeight: "bold", marginVertical: 6, color: colors.title },
            p: { fontSize: 18 * fontScale, lineHeight: 30 * fontScale, marginBottom: 10, color: colors.text, textAlign: 'justify' },
            li: { fontSize: 16 * fontScale, lineHeight: 30 * fontScale, marginBottom: 10, color: colors.text, textAlign: 'justify' },
            em: { fontStyle: "italic", color: colors.text },
            sup: {
                fontSize: 12 * fontScale,
                lineHeight: 30 * fontScale,
                color: colors.text,                
            },
            strong: { fontWeight: "bold", color: colors.text },
            b: { fontWeight: "bold", color: colors.text },
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
            justify:{textAlign: 'justify'},
            'search-hit': {
                backgroundColor: darkMode ? "#5C4B00" : "#FFE58A",
                color: colors.text,
                paddingHorizontal: 2,
            },
            'search-hit-active': {
                backgroundColor: darkMode ? "#8A6E00" : "#FFD54F",
                color: colors.text,
                paddingHorizontal: 2,
            },
        }),
        [fontScale, colors, darkMode]
    );

    useEffect(() => {
        if (!showSearch || !trimmedQuery || matchCount === 0) {
            setPendingScrollIndex(null);
            setCurrentMatchIndex(0);
            return;
        }

        setCurrentMatchIndex(0);
        setPendingScrollIndex(0);
    }, [showSearch, trimmedQuery, matchCount]);

    useEffect(() => {
        if (matchCount > 0 && currentMatchIndex > matchCount - 1) {
            setCurrentMatchIndex(0);
        }
    }, [matchCount, currentMatchIndex]);

    useEffect(() => {
        if (pendingScrollIndex === null || !matches.length) return;
        if (contentHeight <= 0 || viewportHeight <= 0) return;

        const match = matches[pendingScrollIndex];
        if (!match) {
            setPendingScrollIndex(null);
            return;
        }

        const maxScrollY = Math.max(0, contentHeight - viewportHeight);
        const ratio = plainLength > 1 ? match.startPlain / (plainLength - 1) : 0;
        const targetY = Math.max(0, Math.min(maxScrollY, ratio * maxScrollY - 12));

        scrollRef.current?.scrollTo({ y: targetY, animated: true });
        setPendingScrollIndex(null);
    }, [pendingScrollIndex, matches, plainLength, contentHeight, viewportHeight]);

    const toggleSearch = () => {
        setShowSearch((prev) => {
            const next = !prev;
            if (!next) {
                setSearchQuery("");
                setCurrentMatchIndex(0);
                setPendingScrollIndex(null);
            }
            return next;
        });
    };

    const handleSearchChange = (text) => {
        setSearchQuery(text);
        if (text.trim().length > 0) {
            setCurrentMatchIndex(0);
            setPendingScrollIndex(0);
        } else {
            setPendingScrollIndex(null);
        }
    };

    const goToNextMatch = () => {
        if (matchCount === 0) return;

        setCurrentMatchIndex((prev) => {
            const nextIndex = (prev + 1) % matchCount;
            setPendingScrollIndex(nextIndex);
            return nextIndex;
        });
    };

    const goToPrevMatch = () => {
        if (matchCount === 0) return;

        setCurrentMatchIndex((prev) => {
            const prevIndex = (prev - 1 + matchCount) % matchCount;
            setPendingScrollIndex(prevIndex);
            return prevIndex;
        });
    };

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
                    <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginRight: 12 }}>
                        <MaterialIcons name="arrow-back" size={24} color={colors.text} />
                    </TouchableOpacity>

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

                <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <TouchableOpacity onPress={toggleSearch} style={{ marginRight: 12 }}>
                        <MaterialIcons name="search" size={22} color={colors.text} />
                    </TouchableOpacity>

                    <TouchableOpacity onPress={toggleDarkMode}>
                        <Text style={{ fontSize: 18 }}>{darkMode ? "🌙" : "☀️"}</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {showSearch && (
                <View
                    style={{
                        backgroundColor: colors.controlBg,
                        borderBottomWidth: 1,
                        borderBottomColor: colors.border,
                        paddingHorizontal: 16,
                        paddingBottom: 10,
                    }}
                >
                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                        <View style={{ flex: 1, position: "relative" }}>
                            <TextInput
                                value={searchQuery}
                                onChangeText={handleSearchChange}
                                placeholder="Tim trong noi dung..."
                                placeholderTextColor={darkMode ? "#BBBBBB" : "#666666"}
                                style={{
                                    backgroundColor: colors.bg,
                                    color: colors.text,
                                    borderWidth: 1,
                                    borderColor: colors.border,
                                    borderRadius: 8,
                                    paddingHorizontal: 12,
                                    paddingVertical: 8,
                                    paddingRight: 36,
                                    fontSize: 16,
                                }}
                                returnKeyType="search"
                                autoCorrect={false}
                            />
                            {!!searchQuery && (
                                <TouchableOpacity
                                    onPress={() => {
                                        setSearchQuery("");
                                        setCurrentMatchIndex(0);
                                        setPendingScrollIndex(null);
                                    }}
                                    style={{
                                        position: "absolute",
                                        right: 10,
                                        top: 0,
                                        bottom: 0,
                                        justifyContent: "center",
                                    }}
                                >
                                    <MaterialIcons name="close" size={18} color={colors.text} />
                                </TouchableOpacity>
                            )}
                        </View>

                        <View style={{ alignItems: "center", marginLeft: 10 }}>
                            <Text style={{ color: colors.text, fontSize: 12 }}>
                                {matchCount > 0 ? `${currentMatchIndex + 1}/${matchCount}` : "0/0"}
                            </Text>
                            <View style={{ flexDirection: "row", marginTop: 2 }}>
                                <TouchableOpacity
                                    onPress={goToPrevMatch}
                                    disabled={matchCount === 0}
                                    style={{ opacity: matchCount === 0 ? 0.4 : 1, marginRight: 4 }}
                                >
                                    <MaterialIcons name="keyboard-arrow-up" size={20} color={colors.text} />
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={goToNextMatch}
                                    disabled={matchCount === 0}
                                    style={{ opacity: matchCount === 0 ? 0.4 : 1 }}
                                >
                                    <MaterialIcons name="keyboard-arrow-down" size={20} color={colors.text} />
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                    {!!trimmedQuery && matchCount === 0 && (
                        <Text style={{ marginTop: 6, color: colors.text, opacity: 0.7, fontSize: 12 }}>
                            Khong tim thay ket qua.
                        </Text>
                    )}
                </View>
            )}

            {/* ========== CONTENT ========== */}
            <ScrollView
                ref={scrollRef}
                contentContainerStyle={{ padding: 16 }}
                onLayout={(event) => {
                    setViewportHeight(event.nativeEvent.layout.height);
                }}
                onContentSizeChange={(w, h) => {
                    setContentHeight(h);
                }}
            >
                <View>
                    <RenderHTML
                        contentWidth={width}
                        source={{ html: highlightedHtml }}
                        ignoredDomTags={["head", "meta", "link"]}
                        enableCSSInlineProcessing={false}
                        tagsStyles={tagsStyles}
                        classesStyles={classesStyles}
                        baseStyle={{ color: colors.text, backgroundColor: colors.bg }}
                        defaultTextProps={{ selectable: true, selectionColor: '#facc15' }}
                        renderersProps={{ text: { selectable: true, selectionColor: '#facc15' } }}
                    />
                </View>
            </ScrollView>
        </View>
    );
}