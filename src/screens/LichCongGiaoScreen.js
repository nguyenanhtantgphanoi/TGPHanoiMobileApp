import React, { useEffect, useState, useRef, useImperativeHandle, forwardRef, useMemo, memo } from 'react';
import {
    ImageBackground,
    StyleSheet,
    Text,
    View,
    ActivityIndicator,
    Dimensions,
    Image,
    TouchableOpacity,
    Modal,
    ScrollView,
    FlatList,
    StatusBar,
    useWindowDimensions
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
import { useIsFocused } from '@react-navigation/native';
// import { red } from 'react-native-reanimated/lib/typescript/Colors';

const { width, height } = Dimensions.get('window');

/* ================= CONSTANT (DÙNG CHUNG VỚI FILE KINH) ================= */
const FONT_SCALE_KEY = "@kinh_font_scale";
const DARK_MODE_KEY = "@kinh_dark_mode";

const mapColor = (colorName) => {
    switch (colorName) {
        case 'Tím': return '#8e44ad';
        case 'Trắng': return '#ecf0f1';
        case 'Đỏ': return '#e74c3c';
        case 'Xanh': return '#27ae60';
        case 'Vàng': return '#f1c40f';
        case 'Hồng': return '#ff9ff3';
        default: return 'transparent';
    }
};

const GENERATED_MONTHS = [];
for (let y = 2025; y <= 2026; y++) {
    for (let m = 0; m < 12; m++) {
        const d = new Date(y, m, 1);
        if (d >= new Date(2025, 11, 1) && d <= new Date(2026, 10, 1)) {
            GENERATED_MONTHS.push({ month: m, year: y });
        }
    }
}

// BỌC DAYCARD TRONG MEMO ĐỂ GIỮ NGUYÊN TRẠNG THÁI KHI MODAL MỞ
const DayCard = memo(({ item, insets, setSelectedLe, setModalVisible }) => {
    const dateObj = new Date(item.date);
    const daysOfWeek = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
    const solar = Solar.fromYmd(dateObj.getFullYear(), dateObj.getMonth() + 1, dateObj.getDate());
    const lunar = solar.getLunar();

    const listLe = useMemo(() => item.arr_cac_le?.length ? item.arr_cac_le : [item], [item.arr_cac_le, item]);
    const [activeLeIndex, setActiveLeIndex] = useState(0);

    return (
        <View style={styles.page}>
            <View style={[styles.topBlock, { marginTop: insets.top + 15 }]}>
                <Text style={styles.dayNameText}>{daysOfWeek[dateObj.getDay()].toUpperCase()}</Text>
                <View style={styles.mainDateContainer}>
                    <Text style={styles.dayNumText}>{dateObj.getDate()}</Text>
                    <Text style={styles.monthYearText}>THÁNG {dateObj.getMonth() + 1} NĂM {dateObj.getFullYear()}</Text>
                </View>
                <View style={styles.topFooter}>
                    <Text style={styles.lunarText}>Lịch âm: <Text style={styles.lunarDateHighlight}>{lunar.getDay()}/{lunar.getMonth()}</Text></Text>
                </View>
            </View>

            <View style={[styles.bottomBlock, { marginBottom: 60 }]}>
                <PagerView
                    style={styles.pagerLe}
                    initialPage={0}
                    onPageSelected={e => setActiveLeIndex(e.nativeEvent.position)}
                >
                    {listLe.map((le, idx) => (
                        <TouchableOpacity
                            key={`le-sub-item-${idx}`}
                            activeOpacity={0.9}
                            onPress={() => {
                                setSelectedLe(le);
                                setModalVisible(true);
                            }}
                            style={styles.lePage}
                        >
                            <Text style={styles.titleText}>{le.title}</Text>
                            <View style={styles.infoRow}>
                                <Image source={renderAoLe(le.mau_ao_le)} style={styles.aoLeIcon} />
                                <View style={styles.tag}><Text style={styles.tagText}>Lễ {le.bac_le}</Text></View>
                            </View>
                            <View style={styles.summaryContainer}>
                                <Text style={[styles.summaryText, { fontSize: 16 }]}>
                                    <Text style={styles.highlightText}>
                                        {le.ban_van?.bd1_le_trich_tu?.trim() || item.bd_1}
                                        {le.ban_van?.bd2_trich_tu ? `; ${le.ban_van.bd2_trich_tu.trim()}` : item.bd_2 ? `; ${item.bd_2}` : ""}
                                        {le.ban_van?.phuc_am_trich_tu ? `; ${le.ban_van.phuc_am_trich_tu.trim()}` : item.tin_mung ? `; ${item.tin_mung}` : ""}
                                    </Text>
                                </Text>
                            </View>
                            <Text style={[styles.highlightText, { marginTop: 10, fontStyle: 'italic', textAlign: 'center', fontSize: 16 }]}>
                                {le.ban_van?.cau_phuc_am_tom_gon || (item.cau_loi_chua ? `"${item.cau_loi_chua}"` : "")}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </PagerView>

                {listLe.length > 1 && (
                    <View style={styles.dotsContainer}>
                        {listLe.map((_, i) => (
                            <View
                                key={`dot-${i}`}
                                style={[
                                    styles.dot,
                                    activeLeIndex === i ? styles.activeDot : styles.inactiveDot
                                ]}
                            />
                        ))}
                    </View>
                )}
            </View>
        </View>
    );
}, (prev, next) => prev.item.date === next.item.date && prev.item.id === next.item.id);

const LichCongGiaoScreen = forwardRef((props, ref) => {
    const pagerRef = useRef(null);
    const insets = useSafeAreaInsets();
    const { width: contentWidth } = useWindowDimensions();
    const isFocused = useIsFocused();

    const [loading, setLoading] = useState(true);
    const [allDays, setAllDays] = useState([]);
    const [yearData, setYearData] = useState([]);
    const [initialIndex, setInitialIndex] = useState(0);
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedLe, setSelectedLe] = useState(null);
    const [monthModalVisible, setMonthModalVisible] = useState(false);
    const [monthPagerIndex, setMonthPagerIndex] = useState(0);

    const [fontScale, setFontScale] = useState(1);
    const [darkMode, setDarkMode] = useState(false);

    useImperativeHandle(ref, () => ({
        goToToday: () => pagerRef.current?.setPage(initialIndex)
    }));

    const syncSettings = async () => {
        try {
            const savedFont = await AsyncStorage.getItem(FONT_SCALE_KEY);
            const savedDark = await AsyncStorage.getItem(DARK_MODE_KEY);
            if (savedFont) setFontScale(parseFloat(savedFont));
            if (savedDark) setDarkMode(savedDark === "true");
        } catch (err) { console.log("Sync error", err); }
    };

    useEffect(() => {
        if (isFocused || modalVisible) { syncSettings(); }
    }, [isFocused, modalVisible]);

    const saveFontScale = async (scale) => {
        const newScale = Math.max(0.8, Math.min(1.8, scale));
        setFontScale(newScale);
        await AsyncStorage.setItem(FONT_SCALE_KEY, newScale.toString());
    };

    const saveDarkMode = async (mode) => {
        setDarkMode(mode);
        await AsyncStorage.setItem(DARK_MODE_KEY, mode.toString());
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
        p: { marginBottom: 10, color: modalColors.text, fontSize: 17 * fontScale },
        strong: { fontWeight: "bold", color: modalColors.text },
        em: { fontStyle: "italic", color: modalColors.text }
    }), [fontScale, modalColors]);
    
    useEffect(() => {
        fetchData();
        fetchYearData();
    }, []);

    const fetchData = async () => {
        try {
            const today = new Date();
            const year = today.getFullYear();
            const month = today.getMonth() + 1;
            const day = String(today.getDate()).padStart(2, '0');
            const formattedDate = `${year}-${month}-${day}`;
            const res = await axios.get(`https://service-tgphn.lamgs.io.vn/get-calendar?date=${formattedDate}`);
            const data = [...(res.data.prev_month || []), ...(res.data.cur_month || []), ...(res.data.next_month || [])];

            // Tìm index ngày hôm nay dựa trên date chuỗi
            const todayStr = `${year}-${String(month).padStart(2, '0')}-${day}`;
            const idx = data.findIndex(d => d.date === todayStr);

            setAllDays(data);
            setInitialIndex(idx !== -1 ? idx : 0);
            setLoading(false);
        } catch { setLoading(false); }
    };

    const fetchYearData = async () => {
        try {
            const res = await axios.get('https://service-tgphn.lamgs.io.vn/get-calendar-year');
            if (Array.isArray(res.data)) setYearData(res.data);
        } catch (error) { console.error("Lỗi load lịch năm:", error); }
    };

    const MonthGrid = ({ month, year }) => {
        const grid = useMemo(() => {
            const daysInMonth = new Date(year, month + 1, 0).getDate();
            const firstDay = new Date(year, month, 1).getDay();
            const cells = [];
            for (let i = 0; i < firstDay; i++) cells.push(null);
            for (let d = 1; d <= daysInMonth; d++) cells.push({ day: d, date: new Date(year, month, d) });
            return cells;
        }, [month, year]);

        return (
            <View style={{ flex: 1 }}>
                <View style={styles.weekHeader}>
                    {['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'].map(d => (<Text key={d} style={styles.weekDay}>{d}</Text>))}
                </View>
                <FlatList
                    data={grid}
                    numColumns={7}
                    scrollEnabled={false}
                    keyExtractor={(_, i) => `grid-${month}-${i}`}
                    renderItem={({ item }) => {
                        if (!item) return <View style={styles.emptyDay} />;
                        const isToday = new Date().toDateString() === item.date.toDateString();
                        const dateKey = `${item.date.getFullYear()}-${String(item.date.getMonth() + 1).padStart(2, '0')}-${String(item.date.getDate()).padStart(2, '0')}`;
                        const dayInfo = yearData.find(x => x.date === dateKey);
                        const dotColor = dayInfo ? mapColor(dayInfo.mau_ao_le) : 'transparent';
                        const isTrong = dayInfo?.bac_le === 'Trọng';
                        return (
                            <TouchableOpacity style={[styles.dayCell, isToday && styles.todayCell, isTrong && styles.cellLeTrong]}>
                                <Text style={[styles.dayCellText, isTrong && { color: '#c0392b', fontWeight: 'bold' }]}>{item.day}</Text>
                                <View style={[styles.dotMauAo, { backgroundColor: dotColor, borderColor: dotColor === '#ecf0f1' ? '#bdc3c7' : 'transparent', borderWidth: dotColor === '#ecf0f1' ? 0.5 : 0 }]} />
                            </TouchableOpacity>
                        );
                    }}
                />
            </View>
        );
    };

    const onFlingUp = ({ nativeEvent }) => {
        if (nativeEvent.state === State.ACTIVE) {
            const today = new Date();
            const idx = GENERATED_MONTHS.findIndex(m => m.month === today.getMonth() && m.year === today.getFullYear());
            setMonthPagerIndex(idx !== -1 ? idx : 0);
            setMonthModalVisible(true);
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
                        >
                            {allDays.map((day, i) => (
                                <View key={`${day.date}-${i}`}>
                                    <DayCard
                                        item={day}
                                        insets={insets}
                                        setSelectedLe={setSelectedLe}
                                        setModalVisible={setModalVisible}
                                    />
                                </View>
                            ))}
                        </PagerView>

                        <Modal animationType="slide" visible={monthModalVisible}>
                            <View style={[styles.fullModal, { paddingTop: insets.top }]}>
                                <View style={styles.monthHeaderRow}>
                                    <TouchableOpacity onPress={() => setMonthModalVisible(false)}><Text style={styles.closeBtnTxt}>✕</Text></TouchableOpacity>
                                    <View style={{ width: 40 }} />
                                </View>
                                <PagerView
                                    style={{ flex: 1 }}
                                    initialPage={monthPagerIndex}
                                    onPageSelected={(e) => setMonthPagerIndex(e.nativeEvent.position)}
                                >
                                    {GENERATED_MONTHS.map((m, index) => (
                                        <View key={`month-page-${index}`}>
                                            <View style={{ alignItems: 'center', marginBottom: 15 }}>
                                                <Text style={styles.monthLabel}>Tháng {m.month + 1} - {m.year}</Text>
                                            </View>
                                            <MonthGrid month={m.month} year={m.year} />
                                        </View>
                                    ))}
                                </PagerView>
                            </View>
                        </Modal>

                        <Modal animationType="slide" visible={modalVisible}>
                            <View style={[styles.modalContainer, { paddingTop: insets.top, backgroundColor: modalColors.bg }]}>
                                <StatusBar barStyle={darkMode ? "light-content" : "dark-content"} />
                                <View style={[styles.controlBar, { backgroundColor: modalColors.controlBg, borderBottomColor: modalColors.border }]}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                        <TouchableOpacity onPress={() => saveFontScale(fontScale - 0.1)}><Text style={{ fontSize: 20, color: modalColors.text, padding: 5 }}>A-</Text></TouchableOpacity>
                                        <Text style={{ marginHorizontal: 10, color: modalColors.text }}>{Math.round(fontScale * 100)}%</Text>
                                        <TouchableOpacity onPress={() => saveFontScale(fontScale + 0.1)}><Text style={{ fontSize: 20, color: modalColors.text, padding: 5 }}>A+</Text></TouchableOpacity>
                                    </View>
                                    <TouchableOpacity onPress={() => saveDarkMode(!darkMode)}><Text style={{ fontSize: 20 }}>{darkMode ? "🌙" : "☀️"}</Text></TouchableOpacity>
                                    <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeButton}>
                                        <Text style={[styles.closeButtonText, { color: modalColors.title }]}>✕ Đóng</Text>
                                    </TouchableOpacity>
                                </View>
                                <ScrollView contentContainerStyle={styles.modalScrollContent}>
                                    {selectedLe?.ban_van && (
                                        <>
                                            {selectedLe.ban_van.bd1_le && (
                                                <View style={{ marginBottom: 20 }}>
                                                    <Text style={[styles.sectionTitle, { color: modalColors.title, fontSize: 18 * fontScale }]}>Bài đọc I</Text>
                                                    <RenderHTML contentWidth={contentWidth} source={{ html: selectedLe.ban_van.bd1_le }} tagsStyles={tagsStyles} />
                                                </View>
                                            )}
                                            {selectedLe.ban_van.dap_ca_le && (
                                                <View style={{ marginBottom: 20 }}>
                                                    <Text style={[styles.sectionTitle, { color: modalColors.title, fontSize: 18 * fontScale }]}>Đáp ca</Text>
                                                    <RenderHTML contentWidth={contentWidth} source={{ html: selectedLe.ban_van.dap_ca_le }} tagsStyles={tagsStyles} />
                                                </View>
                                            )}
                                            {selectedLe.ban_van.bd2 && (
                                                <View style={{ marginBottom: 20 }}>
                                                    <Text style={[styles.sectionTitle, { color: modalColors.title, fontSize: 18 * fontScale }]}>Bài đọc II</Text>
                                                    <RenderHTML contentWidth={contentWidth} source={{ html: selectedLe.ban_van.bd2 }} tagsStyles={tagsStyles} />
                                                </View>
                                            )}
                                            {selectedLe.ban_van.alleluia && (
                                                <View style={{ marginBottom: 20 }}>
                                                    <Text style={[styles.sectionTitle, { color: modalColors.title, fontSize: 18 * fontScale }]}>Alleluia</Text>
                                                    <RenderHTML contentWidth={contentWidth} source={{ html: selectedLe.ban_van.alleluia }} tagsStyles={tagsStyles} />
                                                </View>
                                            )}
                                            {selectedLe.ban_van.phuc_am && (
                                                <View style={{ marginBottom: 20 }}>
                                                    <Text style={[styles.sectionTitle, { color: modalColors.title, fontSize: 18 * fontScale }]}>Phúc âm</Text>
                                                    <RenderHTML contentWidth={contentWidth} source={{ html: selectedLe.ban_van.phuc_am }} tagsStyles={tagsStyles} />
                                                </View>
                                            )}
                                        </>
                                    )}
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
    page: { flex: 1, alignItems: 'center', justifyContent: 'space-between' },
    topBlock: { width: width * 0.9, backgroundColor: 'rgba(255,255,255,0.75)', borderRadius: 24, padding: 20, alignItems: 'center' },
    dayNameText: { fontSize: 24, fontWeight: '900', color: '#c0392b' },
    mainDateContainer: { alignItems: 'center' },
    dayNumText: { fontSize: 90, fontWeight: 'bold' },
    monthYearText: { fontSize: 18, fontWeight: '700' },
    topFooter: { paddingTop: 10 },
    lunarText: { fontSize: 16 },
    lunarDateHighlight: { color: '#c0392b', fontWeight: 'bold' },
    bottomBlock: { width: width * 0.92, height: height * 0.32, backgroundColor: 'rgba(255,255,255,0.8)', borderRadius: 28 },
    pagerLe: { flex: 1 },
    lePage: { flex: 1, justifyContent: 'center', padding: 15, borderRadius: 16 },
    titleText: { fontSize: 18, fontWeight: 'bold', textAlign: 'center', color: '#c0392b' },
    infoRow: { alignItems: 'center' },
    aoLeIcon: { width: 40, height: 40 },
    tag: { backgroundColor: '#2980b9', padding: 5, borderRadius: 6 },
    tagText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
    summaryContainer: { paddingHorizontal: 10 },
    summaryText: { textAlign: 'center', marginTop: 10, fontSize: 14 },
    highlightText: { color: '#555' },
    dotsContainer: { flexDirection: 'row', justifyContent: 'center', paddingBottom: 10 },
    dot: { width: 7, height: 7, borderRadius: 3.5, margin: 3 },
    activeDot: { backgroundColor: '#c0392b', width: 16 },
    inactiveDot: { backgroundColor: '#ccc' },
    fullModal: { flex: 1, backgroundColor: '#fff' },
    monthHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15 },
    closeBtnTxt: { fontSize: 24 },
    monthLabel: { fontSize: 20, fontWeight: 'bold', color: '#c0392b' },
    weekHeader: { flexDirection: 'row' },
    weekDay: { width: width / 7, textAlign: 'center', fontWeight: 'bold' },
    dayCell: { width: width / 7, height: height / 11, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: 'transparent' },
    cellLeTrong: { borderColor: '#c0392b', borderRadius: 8 },
    emptyDay: { width: width / 7, height: height / 11 },
    dayCellText: { fontSize: 18 },
    todayCell: { backgroundColor: '#fdecea', borderRadius: 8 },
    dotMauAo: { width: 6, height: 6, borderRadius: 3, marginTop: 4 },
    modalContainer: { flex: 1 },
    controlBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 10, borderBottomWidth: 1 },
    closeButton: { padding: 5 },
    closeButtonText: { fontSize: 16, fontWeight: 'bold' },
    modalScrollContent: { padding: 20 },
    sectionTitle: { fontWeight: 'bold', marginBottom: 5 },
});

export default LichCongGiaoScreen;