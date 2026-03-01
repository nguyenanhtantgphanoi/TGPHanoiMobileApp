import React, { useEffect, useState, useRef, useImperativeHandle, forwardRef, useMemo, memo } from 'react';
import {
    ImageBackground,
    StyleSheet,
    Text,
    View,
    SafeAreaView,
    ActivityIndicator,
    Dimensions,
    Image,
    TouchableOpacity,
    Modal,
    ScrollView,
    StatusBar,
    Platform,
    useWindowDimensions,
    Animated,
    Easing,
} from 'react-native';
import PagerView from 'react-native-pager-view';
import axios from 'axios';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Solar } from 'lunar-javascript';
import renderAoLe from '../utils/renderAoLe';
import {
    GestureHandlerRootView,
    FlingGestureHandler,
    Directions,
    State
} from 'react-native-gesture-handler';
import AsyncStorage from "@react-native-async-storage/async-storage";
import RenderHTML from "react-native-render-html";
import { useIsFocused, useNavigation } from '@react-navigation/native';
import MonthCalendarModal from '../components/MonthCalendarModal';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');
const FONT_SCALE_KEY = "@kinh_font_scale";
const DARK_MODE_KEY = "@kinh_dark_mode";
const QUICK_UTILITY_API_URL = 'https://mapp.tgphanoi.org/get-quick-utilities';
const DEFAULT_QUICK_UTILITIES = [
    
];

const GENERATED_MONTHS = [];
for (let y = 2025; y <= 2026; y++) {
    for (let m = 0; m < 12; m++) {
        const d = new Date(y, m, 1);
        if (d >= new Date(2025, 11, 1) && d <= new Date(2026, 10, 1)) {
            GENERATED_MONTHS.push({ month: m, year: y });
        }
    }
}

const DayCard = memo(({ item, insets, setSelectedLe, setModalVisible, middleBlockReservedSpace, onGoToToday, onOpenMonthCalendar, onBottomBlockLayout }) => {
    const navigation = useNavigation();
    const { width: screenWidth, height: screenHeight } = useWindowDimensions();
    const dateObj = new Date(item.date);
    const daysOfWeek = ['Chúa Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
    const solar = Solar.fromYmd(dateObj.getFullYear(), dateObj.getMonth() + 1, dateObj.getDate());
    const lunar = solar.getLunar();
    const listLe = useMemo(() => item.arr_cac_le?.length ? item.arr_cac_le : [item], [item.arr_cac_le, item]);
    const hasXuChauLuot = Boolean(item?.xu_chau_luot?.trim());

    const [activeLeIndex, setActiveLeIndex] = useState(0);
    // State quản lý chiều cao để PagerView co giãn theo nội dung
    const [contentHeight, setContentHeight] = useState(160);
    const [pageContentHeights, setPageContentHeights] = useState({});
    const [xuChauLuotMeasuredHeight, setXuChauLuotMeasuredHeight] = useState(0);
    const [dotsMeasuredHeight, setDotsMeasuredHeight] = useState(0);

    const isVerySmall = screenWidth <= 320;
    const isNarrow = screenWidth < 360;
    const isVeryShort = screenHeight < 680;
    const isCompactHeight = screenHeight < 760;
    const responsiveTopWidth = Math.min(screenWidth * (isVerySmall ? 0.98 : (isNarrow ? 0.94 : 0.9)), 460);
    const responsiveBottomWidth = Math.min(screenWidth * (isVerySmall ? 0.99 : (isNarrow ? 0.96 : 0.92)), 480);
    const dayFontSize = isVeryShort ? 54 : (isCompactHeight ? 70 : (isNarrow ? 88 : 100));
    const dayNameFontSize = isVerySmall ? 16 : (isNarrow ? 19 : 24);
    const monthYearFontSize = isVerySmall ? 12 : (isNarrow ? 14 : 18);
    const lunarFontSize = isVerySmall ? 12 : (isNarrow ? 14 : 18);
    const isDoubleDigitDay = dateObj.getDate() > 9;
    const topRowScale = isDoubleDigitDay
        ? (isVerySmall ? 0.62 : (isNarrow ? 0.7 : (isCompactHeight ? 0.76 : 0.8)))
        : 1;
    const adjustedDayFontSize = Math.max(42, Math.round(dayFontSize * topRowScale));
    const adjustedDayNameFontSize = Math.max(14, Math.round(dayNameFontSize * topRowScale));
    const adjustedMonthYearFontSize = Math.max(11, Math.round(monthYearFontSize * topRowScale));
    const adjustedLunarFontSize = Math.max(11, Math.round(lunarFontSize * topRowScale));
    const bottomMargin = Math.max(15, middleBlockReservedSpace || 0);

    const estimateTextHeight = (text, fontSize, lineHeight, maxWidth, avgCharWidthRatio = 0.52) => {
        const safeText = String(text || '').trim();
        if (!safeText) return 0;
        const charsPerLine = Math.max(8, Math.floor(maxWidth / Math.max(1, fontSize * avgCharWidthRatio)));
        const paragraphs = safeText.split(/\n+/);
        const estimatedLines = paragraphs.reduce((sum, paragraph) => {
            const normalized = paragraph.replace(/\s+/g, ' ').trim();
            if (!normalized) return sum + 1;
            return sum + Math.max(1, Math.ceil(normalized.length / charsPerLine));
        }, 0);
        return estimatedLines * lineHeight;
    };

    const xuChauLuotText = hasXuChauLuot ? `${item.xu_chau_luot.trim()} Chầu Mình Thánh` : '';
    const xuChauLuotTextWidth = Math.max(150, responsiveBottomWidth - 30);
    const estimatedXuChauLuotHeight = hasXuChauLuot
        ? Math.max(34, Math.ceil(estimateTextHeight(xuChauLuotText, 15, 22, xuChauLuotTextWidth, 0.52))) + 24
        : 0;
    const reservedXuChauLuotHeight = hasXuChauLuot
        ? Math.max(estimatedXuChauLuotHeight, xuChauLuotMeasuredHeight)
        : 0;
    const reservedDotsHeight = listLe.length > 1
        ? Math.max(18, dotsMeasuredHeight)
        : 0;
    const baseMaxPagerHeight = Math.floor(screenHeight * (isVeryShort ? 0.54 : (isCompactHeight ? 0.6 : 0.68)));
    const safetyReserve = hasXuChauLuot ? (isVeryShort ? 26 : 20) : 8;
    const maxPagerHeight = Math.max(100, baseMaxPagerHeight - reservedXuChauLuotHeight - reservedDotsHeight - safetyReserve);

    const estimatedPageHeights = useMemo(() => {
        const horizontalPadding = isVerySmall ? 10 : 15;
        const textWidth = Math.max(150, responsiveBottomWidth - horizontalPadding * 2 - 20);
        const titleFontSize = isVerySmall ? 17 : 20;
        const summaryFontSize = isVerySmall ? 14 : 16;
        const quoteFontSize = isVerySmall ? 14 : 16;

        return listLe.map((le, idx) => {
            const displayBd1 = (idx === 0 && item.bd_1) ? item.bd_1 : (le.ban_van?.bd1_le_trich_tu || le.bd_1 || '');
            const displayBd2 = (idx === 0 && item.bd_2) ? item.bd_2 : (le.ban_van?.bd2_trich_tu || le.bd_2 || '');
            const displayTm = (idx === 0 && item.tin_mung) ? item.tin_mung : (le.ban_van?.phuc_am_trich_tu || le.tin_mung || '');
            const summaryText = `${displayBd1}${displayBd2 ? `; ${displayBd2}` : ''}${displayTm ? `; ${displayTm}` : ''}`.trim();
            const quoteText = le.ban_van?.cau_phuc_am_tom_gon || (le.cau_loi_chua ? `"${le.cau_loi_chua}"` : '');
            const titleText = (le.title || '').trim();

            const hasContent = Boolean(titleText || summaryText || quoteText);
            if (!hasContent) {
                return 0;
            }

            const titleHeight = estimateTextHeight(titleText, titleFontSize, titleFontSize * 1.25, textWidth, 0.5);
            const summaryHeight = estimateTextHeight(summaryText, summaryFontSize, summaryFontSize * 1.35, textWidth, 0.53);
            const quoteHeight = estimateTextHeight(quoteText, quoteFontSize, quoteFontSize * 1.45, textWidth, 0.5);

            const topPad = 15;
            const bottomPad = isVeryShort ? 20 : 30;
            const infoBlockHeight = 78;
            const summarySpacing = summaryHeight > 0 ? 10 : 0;
            const quoteSpacing = quoteHeight > 0 ? (isVeryShort ? 6 : 10) : 0;
            const spacingHeight = summarySpacing + quoteSpacing + 14;

            return Math.ceil(topPad + titleHeight + infoBlockHeight + summaryHeight + quoteHeight + spacingHeight + bottomPad);
        });
    }, [listLe, item.bd_1, item.bd_2, item.tin_mung, responsiveBottomWidth, isVerySmall, isVeryShort]);

    const adaptiveTextScale = useMemo(() => {
        const currentEstimated = estimatedPageHeights[activeLeIndex] ?? estimatedPageHeights[0] ?? 0;
        if (!currentEstimated || currentEstimated <= maxPagerHeight) return 1;
        const minScale = isVeryShort ? 0.82 : 0.86;
        return Math.max(minScale, Math.min(1, maxPagerHeight / currentEstimated));
    }, [activeLeIndex, estimatedPageHeights, maxPagerHeight, isVeryShort]);

    const scaledTitleFontSize = Math.max(14, (isVerySmall ? 17 : 20) * adaptiveTextScale);
    const scaledSummaryFontSize = Math.max(12, (isVerySmall ? 14 : 16) * adaptiveTextScale);
    const scaledQuoteFontSize = Math.max(12, (isVerySmall ? 14 : 16) * adaptiveTextScale);

    const getPagerHeightForPage = (pageIndex, fallbackHeight) => {
        const estimatedHeight = estimatedPageHeights[pageIndex] ?? 0;
        const measuredHeight = pageContentHeights[pageIndex] ?? fallbackHeight;
        const rawHeight = Math.max(estimatedHeight, measuredHeight || 0);
        if (!rawHeight) return 0;
        return Math.min(maxPagerHeight, rawHeight);
    };

    // Hàm đo chiều cao thực tế của từng trang trong PagerView
    const onLayout = (pageIndex, event) => {
        const { height: layoutHeight } = event.nativeEvent.layout;
        if (!layoutHeight) return;

        setPageContentHeights(prev => {
            if (prev[pageIndex] === layoutHeight) return prev;
            return { ...prev, [pageIndex]: layoutHeight };
        });

        if (pageIndex === activeLeIndex) {
            const nextHeight = getPagerHeightForPage(pageIndex, layoutHeight);
            if (nextHeight !== contentHeight) {
                setContentHeight(nextHeight);
            }
        }
    };

    useEffect(() => {
        if (contentHeight > maxPagerHeight) {
            setContentHeight(maxPagerHeight);
        }
    }, [contentHeight, maxPagerHeight]);

    useEffect(() => {
        const nextHeight = getPagerHeightForPage(activeLeIndex);
        if (nextHeight !== contentHeight) {
            setContentHeight(nextHeight);
        }
    }, [activeLeIndex, pageContentHeights, estimatedPageHeights, maxPagerHeight]);

    const lunarChi = ["Thân", "Dậu", "Tuất", "Hợi", "Tý", "Sửu", "Dần", "Mão", "Thìn", "Tỵ", "Ngọ", "Mùi"]
    const lunarCan = ["Canh", "Tân", "Nhâm", "Quý", "Giáp", "Ất", "Bính", "Đinh", "Mậu", "Kỷ"]

    return (
        <View style={[styles.page, styles.container_x, (isVeryShort || isCompactHeight) && { justifyContent: 'flex-start' }]}>
            <View
                style={[
                    styles.topBlock,
                    {
                        marginTop: Platform.OS === 'android' ? 15 : insets.top + (isVeryShort ? 2 : (isCompactHeight ? 6 : 15)),
                        width: width - 30 > responsiveTopWidth ? responsiveTopWidth : width - 30,
                        
                        
                    },
                ]}
            >
                <View style={styles.topMainRow}>
                    <Text style={[styles.dayNumText, { fontSize: adjustedDayFontSize }]}>{dateObj.getDate()}</Text>
                    <View style={styles.topRightColumn}>
                        <Text
                            numberOfLines={1}
                            style={[styles.dayNameText, { fontSize: adjustedDayNameFontSize }]}
                        >
                            {daysOfWeek[dateObj.getDay()].toUpperCase()}
                        </Text>
                        <Text numberOfLines={1} style={[styles.monthYearText, { fontSize: adjustedMonthYearFontSize }]}>
                            THÁNG {dateObj.getMonth() + 1} NĂM {dateObj.getFullYear()}
                        </Text>
                        <Text numberOfLines={1} style={[styles.lunarDateHighlight, { fontSize: adjustedLunarFontSize, textAlign: 'center' }]}>
                            {lunar.getDay()}/{lunar.getMonth()}/{lunarCan[lunar.getYear() % 10]} {lunarChi[lunar.getYear() % 12]}
                        </Text>
                    </View>
                </View>
                <View style={styles.topActionRow}>
                    <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => {
                            const date = new Date(item.date);
                            navigation.navigate('GKPVScreen', {
                                day: date.getDate().toString(),
                                month: (date.getMonth() + 1).toString(),
                                year: date.getFullYear().toString(),
                            });
                        }}
                        style={styles.cgkpvTopButton}
                    >
                        <View style={styles.cgkpvTopButtonContent}>
                            <Ionicons name="book-outline" size={20} color="#fff" />
                            <Text numberOfLines={1} style={styles.cgkpvTopButtonText}>CGKPV</Text>
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => {
                            const date = new Date(item.date);
                            onOpenMonthCalendar?.(date);
                        }}
                        style={styles.monthTopButton}
                    >
                        <View style={styles.cgkpvTopButtonContent}>
                            <Ionicons name="calendar-clear-outline" size={20} color="#fff" />
                            <Text numberOfLines={1} style={styles.cgkpvTopButtonText}>Lịch Tháng</Text>
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={onGoToToday}
                        style={styles.todayTopButton}
                    >
                        <View style={styles.cgkpvTopButtonContent}>
                            <Text numberOfLines={1} style={styles.cgkpvTopButtonText}>Hôm nay</Text>
                        </View>
                    </TouchableOpacity>
                </View>
            </View>
            <View
                style={[
                    styles.bottomBlock,
                    {
                        width: width - 30 > responsiveTopWidth ? responsiveTopWidth : width - 30,
                        marginBottom: bottomMargin,
                    },
                ]}
                onLayout={(event) => {
                    const { y, height: blockHeight } = event.nativeEvent.layout;
                    if (!blockHeight) return;
                    const measuredBottom = Math.round(y + blockHeight);
                    onBottomBlockLayout?.(measuredBottom);
                }}
            > 
                {/* Gán chiều cao động contentHeight vào PagerView */}
                <PagerView
                    style={[styles.pagerLe, { height: contentHeight}]}
                    initialPage={0}
                    onPageSelected={e => setActiveLeIndex(e.nativeEvent.position)}
                >
                    {listLe.map((le, idx) => {
                        const displayTitle = le.title;
                        const displayBd1 = (idx === 0 && item.bd_1) ? item.bd_1 : (le.ban_van?.bd1_le_trich_tu || le.bd_1);
                        const displayBd2 = (idx === 0 && item.bd_2) ? item.bd_2 : (le.ban_van?.bd2_trich_tu || le.bd_2);
                        const displayTm = (idx === 0 && item.tin_mung) ? item.tin_mung : (le.ban_van?.phuc_am_trich_tu || le.tin_mung);
                        const displaySummary = `${displayBd1 || ''}${displayBd2 ? `; ${displayBd2}` : ""}${displayTm ? `; ${displayTm}` : ""}`.trim();
                        const displayQuote = le.ban_van?.cau_phuc_am_tom_gon || (le.cau_loi_chua ? `"${le.cau_loi_chua}"` : "");
                        const isLeItemEmpty = !String(displayTitle || '').trim() && !displaySummary && !displayQuote;

                        if (isLeItemEmpty) {
                            return <View key={`le-sub-item-${idx}`} onLayout={(event) => onLayout(idx, event)} style={{ height: 0 }} />;
                        }

                        return (
                            <TouchableOpacity
                                key={`le-sub-item-${idx}`}
                                activeOpacity={0.9}
                                onPress={() => { setSelectedLe(le); setModalVisible(true); }}
                                onLayout={(event) => onLayout(idx, event)}
                                style={[styles.lePage, { paddingBottom: isVeryShort ? 20 : 30, paddingHorizontal: isVerySmall ? 10 : 15 }]}
                            >
                                <View>
                                    {!!String(displayTitle || '').trim() && (
                                        <Text style={[styles.titleText, { fontSize: scaledTitleFontSize, lineHeight: Math.round(scaledTitleFontSize * 1.2) }]}>{displayTitle}</Text>
                                    )}
                                    <View style={styles.infoRow}>
                                        <Image source={renderAoLe(le.mau_ao_le)} style={styles.aoLeIcon} />
                                        <View style={styles.tag}><Text style={styles.tagText}>Lễ {le.bac_le}</Text></View>
                                    </View>
                                    {!!displaySummary && (
                                        <View style={styles.summaryContainer}>
                                            <Text style={[styles.summaryText, { fontSize: scaledSummaryFontSize, lineHeight: Math.round(scaledSummaryFontSize * 1.35) }]}>
                                                <Text style={styles.highlightText}>{displaySummary}</Text>
                                            </Text>
                                        </View>
                                    )}
                                    {!!displayQuote && (
                                        <Text style={[styles.highlightText, { marginTop: isVeryShort ? 6 : 10, fontStyle: 'italic', textAlign: 'center', fontSize: scaledQuoteFontSize, lineHeight: Math.round(scaledQuoteFontSize * 1.45) }]}>
                                            {displayQuote}
                                        </Text>
                                    )}
                                </View>
                            </TouchableOpacity>
                        );
                    })}
                </PagerView>

                {listLe.length > 1 && (
                    <View
                        style={styles.dotsContainer}
                        onLayout={(event) => {
                            const h = Math.ceil(event.nativeEvent.layout.height || 0);
                            if (h && h !== dotsMeasuredHeight) setDotsMeasuredHeight(h);
                        }}
                    >
                        {listLe.map((_, i) => (<View key={`dot-${i}`} style={[styles.dot, activeLeIndex === i ? styles.activeDot : styles.inactiveDot]} />))}
                    </View>
                )}

                {hasXuChauLuot && (
                    <View
                        style={styles.chauLuotContainer}
                        onLayout={(event) => {
                            const h = Math.ceil(event.nativeEvent.layout.height || 0);
                            if (h && h !== xuChauLuotMeasuredHeight) setXuChauLuotMeasuredHeight(h);
                        }}
                    >
                        <Text style={styles.chauLuotText}>
                            <Image style={{ height: 30, width: 30 }} source={require('../../assets/images/monstrance_1.png')} />
                            {' '}
                            {item.xu_chau_luot.trim()} Chầu Mình Thánh
                        </Text>
                    </View>
                )}
            </View>
        </ View>
    );
});

const LichCongGiaoScreen = forwardRef((props, ref) => {
    const navigation = useNavigation();
    const pagerRef = useRef(null);
    const insets = useSafeAreaInsets();
    const { width: contentWidth, height: screenHeight } = useWindowDimensions();
    const isFocused = useIsFocused();
    const [loading, setLoading] = useState(true);
    const [loadingDay, setLoadingDay] = useState(false);
    const [allDays, setAllDays] = useState([]);
    const [yearData, setYearData] = useState([]);
    const [initialIndex, setInitialIndex] = useState(0);
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedLe, setSelectedLe] = useState(null);
    const [monthModalVisible, setMonthModalVisible] = useState(false);
    const [monthPagerIndex, setMonthPagerIndex] = useState(0);
    const [clickedDate, setClickedDate] = useState(null);
    const [fullDayData, setFullDayData] = useState(null);
    const [fontScale, setFontScale] = useState(1);
    const [darkMode, setDarkMode] = useState(false);
    const [currentDayIndex, setCurrentDayIndex] = useState(0);
    const [quickUtilities, setQuickUtilities] = useState(DEFAULT_QUICK_UTILITIES);
    const [quickUtilityHtmlModalVisible, setQuickUtilityHtmlModalVisible] = useState(false);
    const [quickUtilityHtmlTitle, setQuickUtilityHtmlTitle] = useState('Tiện ích');
    const [quickUtilityHtmlContent, setQuickUtilityHtmlContent] = useState('');

    useImperativeHandle(ref, () => ({ goToToday: () => pagerRef.current?.setPage(initialIndex) }));
    const syncSettings = async () => {
        try {
            const savedFont = await AsyncStorage.getItem(FONT_SCALE_KEY);
            const savedDark = await AsyncStorage.getItem(DARK_MODE_KEY);
            if (savedFont) setFontScale(parseFloat(savedFont));
            if (savedDark) setDarkMode(savedDark === "true");
        } catch { }
    };

    useEffect(() => { if (isFocused || modalVisible) syncSettings(); }, [isFocused, modalVisible]);

    const fetchData = async () => {
        try {
            const today = new Date();
            const res = await axios.get(`https://mapp.tgphanoi.org/get-calendar?date=${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`);
            const data = [...(res.data.prev_month || []), ...(res.data.cur_month || []), ...(res.data.next_month || [])];
            const idx = data.findIndex(d => d.date === `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`);
            setAllDays(data);
            setInitialIndex(idx !== -1 ? idx : 0);
            setLoading(false);
        } catch { setLoading(false); }
    };

    const fetchYearData = async () => {
        try {
            const res = await axios.get('https://mapp.tgphanoi.org/get-calendar-year');
            if (Array.isArray(res.data)) setYearData(res.data);
        } catch { }
    };

    const normalizeQuickUtility = (item, index) => {
        if (!item || typeof item !== 'object') return null;

        const title = String(item.title || item.name || item.label || '').trim();
        const url = String(item.url || item.link || item.linkWeb || '').trim();
        const html = String(item.html || item.htmlString || item.html_content || item.content || '').trim();
        const iconBackgroundColor = String(
            item.iconBackgroundColor ||
            item.icon_background_color ||
            item.backgroundColor ||
            item.background_color ||
            item.bgColor ||
            ''
        ).trim();

        if (!title || (!url && !html)) return null;

        return {
            id: String(item.id || `api-quick-utility-${index}`),
            title,
            icon: String(item.icon || 'globe-outline').trim(),
            url,
            html,
            iconBackgroundColor,
        };
    };

    const fetchQuickUtilities = async () => {
        try {
            const res = await axios.get(QUICK_UTILITY_API_URL);
            const payload = Array.isArray(res.data) ? res.data : (Array.isArray(res.data?.data) ? res.data.data : []);
            const apiButtons = payload
                .map((item, index) => normalizeQuickUtility(item, index))
                .filter(Boolean);

            if (apiButtons.length > 0) {
                setQuickUtilities([...DEFAULT_QUICK_UTILITIES, ...apiButtons]);
            } else {
                setQuickUtilities(DEFAULT_QUICK_UTILITIES);
            }
        } catch {
            setQuickUtilities(DEFAULT_QUICK_UTILITIES);
        }
    };

    useEffect(() => {
        fetchData();
        fetchYearData();
        fetchQuickUtilities();
    }, []);

    useEffect(() => {
        setCurrentDayIndex(initialIndex);
    }, [initialIndex]);

    const handleDayPress = async (date) => {
        setClickedDate(date);
        setLoadingDay(true);
        try {
            const formattedDate = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
            const res = await axios.get(`https://mapp.tgphanoi.org/get-one-day?day=${formattedDate}`);
            if (res.data) {
                setFullDayData(res.data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoadingDay(false);
        }
    };

    const onFlingUp = ({ nativeEvent }) => {
        if (nativeEvent.state === State.ACTIVE) {
            const today = new Date();
            const idx = GENERATED_MONTHS.findIndex(m => m.month === today.getMonth() && m.year === today.getFullYear());
            setMonthPagerIndex(idx !== -1 ? idx : 0);
            handleDayPress(today);
            setMonthModalVisible(true);
        }
    };

    const modalColors = useMemo(() => ({
        bg: darkMode ? "#121212" : "#FFFFFF",
        text: darkMode ? "#EAEAEA" : "#000000",
        title: darkMode ? "#FFB3B3" : "#c0392b",
        controlBg: darkMode ? "#1E1E1E" : "#F4F4F4",
        border: darkMode ? "#333" : "#DDD",
    }), [darkMode]);

    const tagsStyles = useMemo(() => ({
        body: { color: modalColors.text, fontSize: 17 * fontScale, lineHeight: 28 * fontScale },
        p: { marginBottom: 10, color: modalColors.text, fontSize: 17 * fontScale, textAlign: "justify" },
        strong: { fontWeight: "bold", color: modalColors.text },
        b: { fontWeight: "bold", color: modalColors.text },
        em: { fontStyle: "italic", color: modalColors.text }
    }), [fontScale, modalColors]);

    const currentDay = allDays[currentDayIndex] || allDays[initialIndex] || null;
    const currentDate = currentDay?.date ? new Date(currentDay.date) : null;
    const [middleBlockHeight, setMiddleBlockHeight] = useState(120);
    const [isMiddleBlockExpanded, setIsMiddleBlockExpanded] = useState(false);
    const [dayCardBottomByIndex, setDayCardBottomByIndex] = useState({});
    const middleBlockBottomOffset = Math.max(insets.bottom, 8);
    const middleBlockReservedSpace = middleBlockBottomOffset + middleBlockHeight + 15;
    const middleBlockGapFromDayCard = 10;
    const defaultMiddleBlockMaxHeight = Math.min(Math.max(100, Math.floor(screenHeight * 0.2)), 160);
    const expandedMiddleBlockMaxHeight = Math.max(180, Math.floor(screenHeight * 0.5));
    const middleBlockMaxHeight = isMiddleBlockExpanded ? expandedMiddleBlockMaxHeight : defaultMiddleBlockMaxHeight;
    const middleBlockAnimatedHeight = useRef(new Animated.Value(defaultMiddleBlockMaxHeight)).current;
    const middleBlockAnimatedShiftY = useRef(new Animated.Value(0)).current;
    const middleButtonFontSize = screenHeight < 720 ? 12 : 13;

    useEffect(() => {
        const targetHeight = isMiddleBlockExpanded ? expandedMiddleBlockMaxHeight : defaultMiddleBlockMaxHeight;
        Animated.timing(middleBlockAnimatedHeight, {
            toValue: targetHeight,
            duration: 260,
            easing: Easing.out(Easing.quad),
            useNativeDriver: false,
        }).start();
    }, [
        isMiddleBlockExpanded,
        defaultMiddleBlockMaxHeight,
        expandedMiddleBlockMaxHeight,
        middleBlockAnimatedHeight,
    ]);

    useEffect(() => {
        const currentDayBottom = dayCardBottomByIndex[currentDayIndex];
        if (!currentDayBottom || !middleBlockHeight) {
            Animated.timing(middleBlockAnimatedShiftY, {
                toValue: 0,
                duration: 200,
                easing: Easing.out(Easing.quad),
                useNativeDriver: false,
            }).start();
            return;
        }

        const middleBlockTopAtDefault = screenHeight - middleBlockBottomOffset - middleBlockHeight;
        const overlapAmount = currentDayBottom + middleBlockGapFromDayCard - middleBlockTopAtDefault;
        const targetShift = overlapAmount > 0 ? overlapAmount : 0;

        Animated.timing(middleBlockAnimatedShiftY, {
            toValue: targetShift,
            duration: 220,
            easing: Easing.out(Easing.quad),
            useNativeDriver: false,
        }).start();
    }, [
        currentDayIndex,
        dayCardBottomByIndex,
        middleBlockHeight,
        screenHeight,
        middleBlockBottomOffset,
        middleBlockAnimatedShiftY,
    ]);

    const handleOpenQuickUtility = (item) => {
        if (!item) return;

        if (item.url) {
            navigation.navigate('GXDetailScreen', { link: item.url });
            return;
        }

        if (item.html) {
            setQuickUtilityHtmlTitle(item.title || 'Tiện ích');
            setQuickUtilityHtmlContent(item.html);
            setQuickUtilityHtmlModalVisible(true);
        }
    };

    if (loading) return <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#007AFF" /></View>;

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <FlingGestureHandler direction={Directions.UP} onHandlerStateChange={onFlingUp}>
                <View style={{ flex: 1 }}>
                    <ImageBackground source={require('../../assets/images/11.jpg')} style={styles.container}>
                        <PagerView
                            ref={pagerRef}
                            style={styles.mainPager}
                            initialPage={initialIndex}
                            offscreenPageLimit={1}
                            onPageSelected={(e) => {
                                setCurrentDayIndex(e.nativeEvent.position);
                                setIsMiddleBlockExpanded(false);
                            }}
                        >
                            {allDays.map((day, i) => (
                                <View key={`${day.date}-${i}`}>
                                    <DayCard
                                        item={day}
                                        insets={insets}
                                        setSelectedLe={setSelectedLe}
                                        setModalVisible={setModalVisible}
                                        middleBlockReservedSpace={middleBlockReservedSpace}
                                        onBottomBlockLayout={(bottomY) => {
                                            setDayCardBottomByIndex(prev => {
                                                const previousBottom = prev[i];
                                                if (typeof previousBottom === 'number' && Math.abs(previousBottom - bottomY) < 1) {
                                                    return prev;
                                                }
                                                return { ...prev, [i]: bottomY };
                                            });
                                        }}
                                        onGoToToday={() => {
                                            pagerRef.current?.setPage(initialIndex);
                                            setCurrentDayIndex(initialIndex);
                                        }}
                                        onOpenMonthCalendar={(date) => {
                                            const targetDate = date instanceof Date ? date : new Date();
                                            const idx = GENERATED_MONTHS.findIndex(
                                                m => m.month === targetDate.getMonth() && m.year === targetDate.getFullYear()
                                            );
                                            setMonthPagerIndex(idx !== -1 ? idx : 0);
                                            handleDayPress(targetDate);
                                            setMonthModalVisible(true);
                                        }}
                                    />
                                </View>
                            ))}
                        </PagerView>

                        <View style={[styles.fixedMiddleBlock, { bottom: middleBlockBottomOffset, height: expandedMiddleBlockMaxHeight }]}> 
                            <Animated.View
                                style={[
                                    styles.middleBlock,
                                    {
                                        width: Math.min(contentWidth * 0.92, 460),
                                        height: middleBlockAnimatedHeight,
                                        maxHeight: middleBlockMaxHeight,
                                        transform: [{ translateY: middleBlockAnimatedShiftY }],
                                    },
                                ]}
                                onLayout={(event) => {
                                    const measuredHeight = Math.ceil(event.nativeEvent.layout.height || 0);
                                    if (measuredHeight && measuredHeight !== middleBlockHeight) {
                                        setMiddleBlockHeight(measuredHeight);
                                    }
                                }}
                            >
                                <View style={styles.middleBlockHeader}>
                                    <Text style={styles.middleBlockTitle}>Tiện ích</Text>
                                    <TouchableOpacity
                                        activeOpacity={0.8}
                                        style={styles.middleBlockDragButton}
                                        onPress={() => setIsMiddleBlockExpanded(prev => !prev)}
                                    >
                                        <Ionicons
                                            name={isMiddleBlockExpanded ? "chevron-down-outline" : "chevron-up-outline"}
                                            size={18}
                                            color="#555"
                                        />
                                    </TouchableOpacity>
                                </View>
                                <ScrollView
                                    showsVerticalScrollIndicator={false}
                                    contentContainerStyle={styles.middleScrollContent}
                                >
                                    {quickUtilities.map((utility) => (
                                        <TouchableOpacity
                                            key={utility.id}
                                            activeOpacity={0.8}
                                            onPress={() => handleOpenQuickUtility(utility)}
                                            style={styles.middleButton}
                                        >
                                            <View style={styles.middleButtonContentInline}>
                                                <View
                                                    style={[
                                                        styles.middleButtonIconSquare,
                                                        utility.iconBackgroundColor ? { backgroundColor: utility.iconBackgroundColor } : null,
                                                    ]}
                                                >
                                                    <Ionicons name={utility.icon} size={20} color="#fff" style={styles.middleButtonIcon} />
                                                </View>
                                                <Text numberOfLines={1} style={[styles.middleButtonText, { fontSize: middleButtonFontSize }]}>{utility.title}</Text>
                                            </View>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </Animated.View>
                        </View>

                        <MonthCalendarModal
                            visible={monthModalVisible}
                            onClose={() => setMonthModalVisible(false)}
                            insets={insets}
                            GENERATED_MONTHS={GENERATED_MONTHS}
                            monthPagerIndex={monthPagerIndex}
                            setMonthPagerIndex={setMonthPagerIndex}
                            clickedDate={clickedDate}
                            setClickedDate={handleDayPress}
                            yearData={yearData}
                            fullDayData={fullDayData}
                            loadingDay={loadingDay}
                            fontScale={fontScale}
                            setFontScale={setFontScale}
                            darkMode={darkMode}
                            setDarkMode={setDarkMode}
                        />

                        <Modal animationType="slide" visible={modalVisible}>
                            <View style={[styles.modalContainer, { paddingTop: insets.top, backgroundColor: modalColors.bg }]}>
                                <StatusBar barStyle={darkMode ? "light-content" : "dark-content"} />
                                <View style={[styles.controlBar, { backgroundColor: modalColors.controlBg, borderBottomColor: modalColors.border }]}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                        <TouchableOpacity onPress={() => { const s = Math.max(0.8, fontScale - 0.1); setFontScale(s); AsyncStorage.setItem(FONT_SCALE_KEY, s.toString()) }}><Text style={{ fontSize: 20, color: modalColors.text, padding: 5 }}>A-</Text></TouchableOpacity>
                                        <Text style={{ marginHorizontal: 10, color: modalColors.text }}>{Math.round(fontScale * 100)}%</Text>
                                        <TouchableOpacity onPress={() => { const s = Math.min(1.8, fontScale + 0.1); setFontScale(s); AsyncStorage.setItem(FONT_SCALE_KEY, s.toString()) }}><Text style={{ fontSize: 20, color: modalColors.text, padding: 5 }}>A+</Text></TouchableOpacity>
                                    </View>
                                    <TouchableOpacity onPress={() => { const m = !darkMode; setDarkMode(m); AsyncStorage.setItem(DARK_MODE_KEY, m.toString()) }}><Text style={{ fontSize: 20 }}>{darkMode ? "🌙" : "☀️"}</Text></TouchableOpacity>
                                    <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeButton}><Text numberOfLines={1} style={[styles.closeButtonText, { color: modalColors.title }]}>✕ Đóng</Text></TouchableOpacity>
                                </View>
                                <ScrollView contentContainerStyle={styles.modalScrollContent}>
                                    {selectedLe?.ban_van && (
                                        <>
                                            {selectedLe.ban_van.bd1_le && (
                                                <View style={{ marginBottom: 20 }}>
                                                    <Text style={[styles.sectionTitle, { color: modalColors.title, fontSize: 18 * fontScale }]}>Bài đọc I: {selectedLe.ban_van?.bd1_le_trich_tu}</Text>
                                                    <RenderHTML contentWidth={contentWidth} source={{ html: selectedLe.ban_van.bd1_le }} tagsStyles={tagsStyles} />
                                                </View>
                                            )}
                                            {selectedLe.ban_van.dap_ca_le && (
                                                <View style={{ marginBottom: 20 }}>
                                                    <Text style={[styles.sectionTitle, { color: modalColors.title, fontSize: 18 * fontScale }]}>Đáp ca: {selectedLe.ban_van?.dap_ca_le_trich_tu}</Text>
                                                    <RenderHTML contentWidth={contentWidth} source={{ html: selectedLe.ban_van.dap_ca_le }} tagsStyles={tagsStyles} />
                                                </View>
                                            )}
                                            {selectedLe.ban_van.bd2 && (
                                                <View style={{ marginBottom: 20 }}>
                                                    <Text style={[styles.sectionTitle, { color: modalColors.title, fontSize: 18 * fontScale }]}>Bài đọc II: {selectedLe.ban_van?.bd2_trich_tu}</Text>
                                                    <RenderHTML contentWidth={contentWidth} source={{ html: selectedLe.ban_van.bd2 }} tagsStyles={tagsStyles} />
                                                </View>
                                            )}
                                            {selectedLe.ban_van.alleluia && (
                                                <View style={{ marginBottom: 20 }}>
                                                    <Text style={[styles.sectionTitle, { color: modalColors.title, fontSize: 18 * fontScale }]}>Tung hô tin mừng: {selectedLe.ban_van?.alleluia_trich_tu}</Text>
                                                    <RenderHTML contentWidth={contentWidth} source={{ html: selectedLe.ban_van.alleluia }} tagsStyles={tagsStyles} />
                                                </View>
                                            )}
                                            {selectedLe.ban_van.phuc_am && (
                                                <View style={{ marginBottom: 20 }}>
                                                    <Text style={[styles.sectionTitle, { color: modalColors.title, fontSize: 18 * fontScale }]}>Phúc âm: {selectedLe.ban_van?.phuc_am_trich_tu}</Text>
                                                    <RenderHTML contentWidth={contentWidth} source={{ html: selectedLe.ban_van.phuc_am }} tagsStyles={tagsStyles} />
                                                </View>
                                            )}
                                            {selectedLe.articles && (
                                                <View style={{ marginBottom: 20 }}>
                                                    <Text style={[styles.sectionTitle, { color: modalColors.title, fontSize: 18 * fontScale }]}>{selectedLe.articles[0]?`Suy niệm:`:''}</Text>
                                                    <Text style={[styles.sectionTitle, { color: modalColors.titleText, fontSize: 18 * fontScale, textAlign: 'center' }]}>{selectedLe.articles[0]?.title}</Text>
                                                    <Text style={[styles.sectionTitle, { color: modalColors.titleText, fontSize: 18 * fontScale, textAlign: 'center', fontStyle: 'italic', fontWeight: 'regular' }]}>{selectedLe.articles[0]?.author}</Text>
                                                    <RenderHTML contentWidth={contentWidth} source={{ html: selectedLe.articles[0]?.content }} tagsStyles={tagsStyles} />
                                                </View>
                                            )}
                                        </>
                                    )}
                                </ScrollView>
                            </View>
                        </Modal>

                        <Modal animationType="slide" visible={quickUtilityHtmlModalVisible}>
                            <View style={[styles.modalContainer, { paddingTop: insets.top, backgroundColor: modalColors.bg }]}> 
                                <StatusBar barStyle={darkMode ? "light-content" : "dark-content"} />
                                <View style={[styles.controlBar, { backgroundColor: modalColors.controlBg, borderBottomColor: modalColors.border }]}> 
                                    <Text style={[styles.sectionTitle, { color: modalColors.title, fontSize: 18 }]}>{quickUtilityHtmlTitle}</Text>
                                    <TouchableOpacity onPress={() => setQuickUtilityHtmlModalVisible(false)} style={styles.closeButton}>
                                        <Text numberOfLines={1} style={[styles.closeButtonText, { color: modalColors.title }]}>✕ Đóng</Text>
                                    </TouchableOpacity>
                                </View>
                                <ScrollView contentContainerStyle={styles.modalScrollContent}>
                                    <RenderHTML contentWidth={contentWidth} source={{ html: quickUtilityHtmlContent }} tagsStyles={tagsStyles} />
                                </ScrollView>
                            </View>
                        </Modal>
                    </ImageBackground>
                </View>
            </FlingGestureHandler>
        </GestureHandlerRootView>
    );
});

const styles = StyleSheet.create({
    container: { flex: 1 },
    mainPager: { flex: 1 },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    page: { flex: 1, alignItems: 'center', justifyContent: 'flex-start' },
    topBlock: { width: '100%', backgroundColor: 'rgba(255,255,255,0.75)', padding: 20, alignItems: 'center', borderTopLeftRadius: 30, borderTopRightRadius: 30 },
    topMainRow: { width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
    topActionRow: {
        marginTop: 10,
        alignSelf: 'stretch',
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        columnGap: 6,
    },
    todayTopButton: {
        backgroundColor: '#2980b9',
        borderRadius: 12,
        paddingVertical: 8,
        paddingHorizontal: 10,
        flex: 1,
        minWidth: 0,
    },
    cgkpvTopButton: {
        backgroundColor: '#c0392b',
        borderRadius: 12,
        paddingVertical: 8,
        paddingHorizontal: 10,
        flex: 1,
        minWidth: 0,
    },
    monthTopButton: {
        backgroundColor: '#7f8c8d',
        borderRadius: 12,
        paddingVertical: 8,
        paddingHorizontal: 10,
        flex: 1,
        minWidth: 0,
    },
    cgkpvTopButtonContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        minWidth: 0,
    },
    cgkpvTopButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 13,
    },
    topRightColumn: { flex: 1, justifyContent: 'center', alignItems: 'flex-start', paddingLeft: 12,backgroundColor: 'rgba(255, 255, 255, 0)', paddingVertical: 6, borderRadius: 12 },
    dayNameText: { fontSize: 24, fontWeight: '900', color: '#c0392b', fontFamily: 'System', textTransform: 'uppercase' },
    mainDateContainer: { alignItems: 'center' },
    dayNumText: { fontSize: 100, fontWeight: '900', backgroundColor: 'rgba(255,255,255,0.8)', paddingHorizontal: 20, borderRadius: 20, },
    monthYearText: { fontSize: 18, fontWeight: '900' },
    topFooter: { paddingTop: 10 },
    lunarText: { fontSize: 18, color: "#fff" },
    lunarDateHighlight: { fontSize: 18, color: '#c0392b', fontWeight: 'bold' },

    bottomBlock: { width: '100%', minHeight: 200, backgroundColor: 'rgba(250, 245, 220, 0.8)', paddingTop: 10, flexShrink: 0, borderBottomLeftRadius: 30, borderBottomRightRadius: 30, alignItems: 'center' },
    // Bỏ height cố định để ưu tiên chiều cao động từ inline style
    pagerLe: { width: '100%' },
    lePage: { padding: 15, borderRadius: 16, justifyContent: 'flex-start' },
    titleText: { fontSize: 20, fontWeight: 'bold', textAlign: 'center', color: '#c0392b' },
    infoRow: { alignItems: 'center' },
    aoLeIcon: { width: 40, height: 40, marginVertical: 10 },
    tag: { backgroundColor: '#2980b9', padding: 5, borderRadius: 6 },
    tagText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
    summaryContainer: { paddingHorizontal: 10 },
    summaryText: { textAlign: 'center', marginTop: 10, fontSize: 14 },
    highlightText: { color: '#555' },
    dotsContainer: { flexDirection: 'row', justifyContent: 'center', paddingVertical: 8, paddingHorizontal: 10 },
    dot: { width: 7, height: 7, borderRadius: 3.5, margin: 3 },
    activeDot: { backgroundColor: '#c0392b', width: 16 },
    inactiveDot: { backgroundColor: '#ccc' },
    modalContainer: { flex: 1 },
    controlBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderBottomWidth: 1,
        flexWrap: 'wrap',
        rowGap: 8,
    },
    closeButton: { padding: 5 },
    closeButtonText: { fontSize: 16, fontWeight: 'bold' },
    modalScrollContent: { padding: 20 },
    sectionTitle: { fontWeight: 'bold', marginBottom: 5 },

    container_x: {
        flex: 1,
        alignItems: 'center',
    },

    dateBanner: {
        flexDirection: 'row',
        backgroundColor: "rgba(8, 128, 175, 0.94)",
        borderRadius: 20,
        paddingVertical: 16,
        paddingHorizontal: 24,
        marginTop: 24,
        alignItems: 'center',
    },

    dayNumber: {
        fontSize: 95,
        fontWeight: '900',
        color: '#ffffffee',
        marginRight: 16,
    },

    dateTextContainer: {
        justifyContent: 'center',
    },

    weekDay: {
        fontSize: 35,
        fontWeight: '800',
        color: '#FFF',
    },

    fullDate: {
        fontSize: 20,
        fontWeight: '600',
        color: '#FFF',
        marginTop: 4,
    },
    vestment: {
        width: 90,
        height: 120,
        marginVertical: 16,
    },

    selector: {
        flexDirection: 'row',
        backgroundColor: '#FFF',
        borderRadius: 24,
        paddingVertical: 10,
        paddingHorizontal: 16,
        alignItems: 'center',
        marginBottom: 16,
    },

    selectorText: {
        fontSize: 18,
        fontWeight: '600',
        color: "#ADF",
        marginHorizontal: 12,
    },

    arrow: {
        fontSize: 24,
        color: "#ADF",
        fontWeight: '700',
    },

    card: {
        backgroundColor: "#CAD",
        borderRadius: 20,
        padding: 20,
        width: '85%',
        marginBottom: 24,
    },

    cardTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#333',
    },

    cardText: {
        fontSize: 18,
        color: '#333',
        marginTop: 4,
        lineHeight: 26,
    },

    cathedral: {
        position: 'absolute',
        bottom: 0,
        width: '100%',
        height: 180,
        opacity: 0.9,
    },
    chauLuotContainer: {
        backgroundColor: "#f0f7ff",
        padding: 5,
        paddingHorizontal: 15,
        paddingBottom: 15,
        textAlign: "justify",
        borderRadius: 24,
        borderTopLeftRadius: 0,
        borderTopRightRadius: 0,
        width: "100%",
    },
    chauLuotTitle: { fontSize: 15, fontWeight: "bold", color: "#2980b9" },
    chauLuotText: {
        fontSize: 15,
        color: "#444",
        fontStyle: "italic",
        marginTop: 5,
    },
    prayerButton: {
        width: width * 0.8,
        backgroundColor: '#c0392b',
        borderRadius: 15,
        paddingVertical: 12,
        marginVertical: 15,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
        elevation: 4,
    },
    prayerButtonContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    prayerIcon: {
        width: 22,
        height: 22,
        marginRight: 10,
        tintColor: '#fff',
    },
    prayerButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
        letterSpacing: 0.8,
    },
    fixedMiddleBlock: {
        position: 'absolute',
        left: 0,
        right: 0,
        alignItems: 'center',
        justifyContent: 'flex-end',
        zIndex: 20,
    },
    middleBlock: {
        backgroundColor: 'rgb(255, 255, 255)',
        borderRadius: 15,
        paddingTop: 10,
        paddingHorizontal: 8,
        paddingVertical: 8,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.12,
        shadowRadius: 3,
        elevation: 3,
    },
    middleBlockHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 4,
        marginBottom: 6,
    },
    middleBlockTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#333',
        textAlign: 'left',
    },
    middleBlockDragButton: {
        width: 26,
        height: 26,
        borderRadius: 13,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.06)',
    },
    middleScrollContent: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'stretch',
        paddingHorizontal: 8,
        paddingBottom: 4,
        gap: 8,
    },
    middleButton: {
        
        borderRadius: 12,
        paddingVertical: 9,
        paddingHorizontal: 14,
        width: '48%',
        alignItems: 'center',
        justifyContent: 'center',
    },
    middleButtonContentInline: {
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
    },
    middleButtonIconSquare: {
        width: 50,
        height: 50,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.7)',
        backgroundColor: 'rgba(161, 16, 16, 0.77)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 2,
    },
    middleButtonIcon: {
        marginTop: 0,
    },
    middleButtonText: {
        color: '#053c8d',
        fontSize: 14,
        fontWeight: 'bold',
    },

});

export default LichCongGiaoScreen;