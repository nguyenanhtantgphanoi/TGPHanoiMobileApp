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
import MonthCalendarModal from '../components/MonthCalendarModal';

const { width, height } = Dimensions.get('window');
const FONT_SCALE_KEY = "@kinh_font_scale";
const DARK_MODE_KEY = "@kinh_dark_mode";

const GENERATED_MONTHS = [];
for (let y = 2025; y <= 2026; y++) {
    for (let m = 0; m < 12; m++) {
        const d = new Date(y, m, 1);
        if (d >= new Date(2025, 11, 1) && d <= new Date(2026, 10, 1)) {
            GENERATED_MONTHS.push({ month: m, year: y });
        }
    }
}

const DayCard = memo(({ item, insets, setSelectedLe, setModalVisible }) => {
    const dateObj = new Date(item.date);
    const daysOfWeek = ['Chúa Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
    const solar = Solar.fromYmd(dateObj.getFullYear(), dateObj.getMonth() + 1, dateObj.getDate());
    const lunar = solar.getLunar();
    const listLe = useMemo(() => item.arr_cac_le?.length ? item.arr_cac_le : [item], [item.arr_cac_le, item]);
    const [activeLeIndex, setActiveLeIndex] = useState(0);
    const lunarChi = ["Thân", "Dậu", "Tuất", "Hợi", "Tý", "Sửu", "Dần", "Mão", "Thìn", "Tỵ", "Ngọ", "Mùi"]
    const lunarCan = ["Canh", "Tân", "Nhâm", "Quý", "Giáp", "Ất", "Bính", "Đinh", "Mậu", "Kỷ"]
    return (
        // <View style={[styles.page, styles.container_x]}>
        <View style={[styles.page, styles.container_x]}>
            {/* <View style={[styles.topBlock, { marginTop: insets.top + 15 }]}>
                <Text style={styles.dayNameText}>{daysOfWeek[dateObj.getDay()].toUpperCase()}</Text>
                <View style={styles.mainDateContainer}>
                    <Text style={styles.dayNumText}>{dateObj.getDate()}</Text>
                    <Text style={styles.monthYearText}>THÁNG {dateObj.getMonth() + 1} NĂM {dateObj.getFullYear()}</Text>
                </View>
                <View style={styles.topFooter}>
                    <Text style={styles.lunarText}>Lịch âm: <Text style={styles.lunarDateHighlight}>{lunar.getDay()}/{lunar.getMonth()}</Text></Text>
                </View>
            </View> */}
            <View style={[styles.dateBanner, { marginTop: insets.top + 15 }]}>                   
                <Text style={styles.dayNumber}>{dateObj.getDate()}</Text>
                <View style={styles.dateTextContainer}>
                    <Text style={styles.weekDay}>{daysOfWeek[dateObj.getDay()].toUpperCase()}</Text>
                    <Text style={styles.fullDate}>THÁNG {dateObj.getMonth() + 1} NĂM {dateObj.getFullYear()}</Text>
                    {/* <Text style={styles.lunarText}>{lunar.getDay()}/{lunar.getMonth()}/{lunarCan[lunar.getYear()%10]} {lunarChi[lunar.getYear()%12]} </Text> */}
                </View>                                                    
            </View>
            {/* <View>
                <Text style={styles.lunarText}>{lunar.getDay()}/{lunar.getMonth()}/{lunarCan[lunar.getYear()%10]} {lunarChi[lunar.getYear()%12]} </Text>
            </View> */}
            <View style={[styles.bottomBlock, { marginBottom: 60 }]}>
                <PagerView style={styles.pagerLe} initialPage={0} onPageSelected={e => setActiveLeIndex(e.nativeEvent.position)}>
                    {listLe.map((le, idx) => {
                        const displayTitle = le.title;
                        const displayBd1 = (idx === 0 && item.bd_1) ? item.bd_1 : (le.ban_van?.bd1_le_trich_tu || le.bd_1);
                        const displayBd2 = (idx === 0 && item.bd_2) ? item.bd_2 : (le.ban_van?.bd2_trich_tu || le.bd_2);
                        const displayTm = (idx === 0 && item.tin_mung) ? item.tin_mung : (le.ban_van?.phuc_am_trich_tu || le.tin_mung);

                        return (
                            <TouchableOpacity key={`le-sub-item-${idx}`} activeOpacity={0.9} onPress={() => { setSelectedLe(le); setModalVisible(true); }} style={styles.lePage}>
                                <Text style={styles.titleText}>{displayTitle}</Text>
                                <View style={styles.infoRow}><Image source={renderAoLe(le.mau_ao_le)} style={styles.aoLeIcon} /><View style={styles.tag}><Text style={styles.tagText}>Lễ {le.bac_le}</Text></View></View>
                                <View style={styles.summaryContainer}>
                                    <Text style={[styles.summaryText, { fontSize: 16 }]}><Text style={styles.highlightText}>{displayBd1}{displayBd2 ? `; ${displayBd2}` : ""}{displayTm ? `; ${displayTm}` : ""}</Text></Text>
                                </View>
                                <Text style={[styles.highlightText, { marginTop: 10, fontStyle: 'italic', textAlign: 'center', fontSize: 16 }]}>{le.ban_van?.cau_phuc_am_tom_gon || (le.cau_loi_chua ? `"${le.cau_loi_chua}"` : "")}</Text>
                            </TouchableOpacity>
                        );
                    })}
                </PagerView>
                {listLe.length > 1 && (
                    <View style={styles.dotsContainer}>{listLe.map((_, i) => (<View key={`dot-${i}`} style={[styles.dot, activeLeIndex === i ? styles.activeDot : styles.inactiveDot]} />))}</View>
                )}
                {item?.xu_chau_luot && (
                    <View style={styles.chauLuotContainer}>
                        <Text style={styles.chauLuotTitle}>⛪ Chầu lượt:</Text>
                        <Text style={styles.chauLuotText}>
                            {item.xu_chau_luot.trim()} Chầu Mình Thánh
                        </Text>
                    </View>
                )}
            </View>
            
        </View>
    );
});

const LichCongGiaoScreen = forwardRef((props, ref) => {
    const pagerRef = useRef(null);
    const insets = useSafeAreaInsets();
    const { width: contentWidth } = useWindowDimensions();
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
            const res = await axios.get(`https://service-tgphn.lamgs.io.vn/get-calendar?date=${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`);
            const data = [...(res.data.prev_month || []), ...(res.data.cur_month || []), ...(res.data.next_month || [])];
            const idx = data.findIndex(d => d.date === `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`);
            setAllDays(data);
            setInitialIndex(idx !== -1 ? idx : 0);
            setLoading(false);
        } catch { setLoading(false); }
    };

    const fetchYearData = async () => {
        try {
            const res = await axios.get('https://service-tgphn.lamgs.io.vn/get-calendar-year');
            if (Array.isArray(res.data)) setYearData(res.data);
        } catch { }
    };

    useEffect(() => { fetchData(); fetchYearData(); }, []);

    const handleDayPress = async (date) => {
        setClickedDate(date);
        setLoadingDay(true);
        try {
            const formattedDate = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
            const res = await axios.get(`https://service-tgphn.lamgs.io.vn/get-one-day?day=${formattedDate}`);
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
        p: { marginBottom: 10, color: modalColors.text, fontSize: 17 * fontScale,textAlign: "justify" },
        strong: { fontWeight: "bold", color: modalColors.text },
        em: { fontStyle: "italic", color: modalColors.text }
    }), [fontScale, modalColors]);

    if (loading) return <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#007AFF" /></View>;

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <FlingGestureHandler direction={Directions.UP} onHandlerStateChange={onFlingUp}>
                <View style={{ flex: 1 }}>
                    <ImageBackground source={require('../../assets/images/11.jpg')} style={styles.container}>
                        <PagerView ref={pagerRef} style={styles.mainPager} initialPage={initialIndex} offscreenPageLimit={1}>
                            {allDays.map((day, i) => (
                                <View key={`${day.date}-${i}`}>
                                    <DayCard item={day} insets={insets} setSelectedLe={setSelectedLe} setModalVisible={setModalVisible} />
                                </View>
                            ))}
                        </PagerView>

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
                                    <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeButton}><Text style={[styles.closeButtonText, { color: modalColors.title }]}>✕ Đóng</Text></TouchableOpacity>
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
    dayNameText: { fontSize: 24, fontWeight: '900', color: '#c0392b'},
    mainDateContainer: { alignItems: 'center' },
    dayNumText: { fontSize: 90, fontWeight: 'bold' },
    monthYearText: { fontSize: 18, fontWeight: '700' },
    topFooter: { paddingTop: 10 },
    lunarText: { fontSize: 18, color:"#fff" },
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
    modalContainer: { flex: 1 },
    controlBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 10, borderBottomWidth: 1 },
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
        // backgroundColor: "rgba(33, 100, 100, 0.94)",
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
        // marginBottom: 5,
        backgroundColor: "#f0f7ff",
        padding: 10,
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

});

export default LichCongGiaoScreen;