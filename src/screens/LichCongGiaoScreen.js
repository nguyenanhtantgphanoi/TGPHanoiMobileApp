import React, { useEffect, useState, useRef, useImperativeHandle, forwardRef, useMemo } from 'react';
import { ImageBackground, StyleSheet, Text, View, ActivityIndicator, Dimensions, Image, TouchableOpacity, Modal, ScrollView, FlatList } from 'react-native';
import PagerView from 'react-native-pager-view';
import axios from 'axios';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Solar } from 'lunar-javascript';
import renderAoLe from '../utils/renderAoLe';
import { GestureHandlerRootView, FlingGestureHandler, Directions, State } from 'react-native-gesture-handler';

const { width, height } = Dimensions.get('window');

const cleanHTML = (str) => {
    if (!str) return "";
    return str.replace(/<[^>]*>?/gm, '').replace(/&nbsp;/g, ' ').trim();
};

const LichCongGiaoScreen = forwardRef((props, ref) => {
    const pagerRef = useRef(null);
    const insets = useSafeAreaInsets();
    const [loading, setLoading] = useState(true);
    const [allDays, setAllDays] = useState([]);
    const [initialIndex, setInitialIndex] = useState(0);
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedLe, setSelectedLe] = useState(null);
    const [monthModalVisible, setMonthModalVisible] = useState(false);
    const [currentViewDate, setCurrentViewDate] = useState(new Date());

    const now = new Date();
    const START_YEAR = now.getFullYear() - 1;
    const END_YEAR = now.getFullYear();

    useImperativeHandle(ref, () => ({
        goToToday: () => pagerRef.current?.setPage(initialIndex)
    }));

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        if (monthModalVisible) setCurrentViewDate(new Date());
    }, [monthModalVisible]);

    const fetchData = async () => {
        try {
            const today = new Date();
            const year = today.getFullYear();
            const month = today.getMonth() + 1;
            const day = String(today.getDate()).padStart(2, '0');
            const formattedDate = `${year}-${month}-${day}`;
            const res = await axios.get(`https://service-tgphn.lamgs.io.vn/get-calendar?date=${formattedDate}`);
            const data = [...(res.data.prev_month || []), ...(res.data.cur_month || []), ...(res.data.next_month || [])];
            const todayStr = `${year}-${String(month).padStart(2, '0')}-${day}`;
            const idx = data.findIndex(d => d.date === todayStr);
            setAllDays(data);
            setInitialIndex(idx !== -1 ? idx : 0);
            setLoading(false);
        } catch {
            setLoading(false);
        }
    };

    const calendarGrid = useMemo(() => {
        const year = currentViewDate.getFullYear();
        const month = currentViewDate.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const firstDay = new Date(year, month, 1).getDay();
        const grid = [];
        for (let i = 0; i < firstDay; i++) grid.push(null);
        for (let d = 1; d <= daysInMonth; d++) grid.push({ day: d, date: new Date(year, month, d) });
        return grid;
    }, [currentViewDate]);

    const goPrevMonth = () => {
        const prev = new Date(currentViewDate.getFullYear(), currentViewDate.getMonth() - 1, 1);
        const min = new Date(START_YEAR, 11, 1);
        if (prev >= min) setCurrentViewDate(prev);
    };

    const goNextMonth = () => {
        const next = new Date(currentViewDate.getFullYear(), currentViewDate.getMonth() + 1, 1);
        const max = new Date(END_YEAR, 10, 1);
        if (next <= max) setCurrentViewDate(next);
    };

    const onFlingUp = ({ nativeEvent }) => {
        if (nativeEvent.state === State.ACTIVE) setMonthModalVisible(true);
    };

    const DayCard = ({ item }) => {
        const dateObj = new Date(item.date);
        const daysOfWeek = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
        const solar = Solar.fromYmd(dateObj.getFullYear(), dateObj.getMonth() + 1, dateObj.getDate());
        const lunar = solar.getLunar();
        const [activeLeIndex, setActiveLeIndex] = useState(0);
        const listLe = item.arr_cac_le?.length ? item.arr_cac_le : [item];

        useEffect(() => {
            setActiveLeIndex(0);
        }, [item.date]);

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
                        key={item.date}
                        style={styles.pagerLe}
                        initialPage={0}
                        nestedScrollEnabled
                        onPageSelected={e => setActiveLeIndex(e.nativeEvent.position)}
                    >
                        {listLe.map((le, idx) => (
                            <TouchableOpacity
                                key={idx}
                                style={styles.lePage}
                                activeOpacity={0.9}
                                onPress={() => { setSelectedLe(le); setModalVisible(true); }}
                            >
                                <Text style={styles.titleText}>{le.title}</Text>
                                <View style={styles.infoRow}>
                                    <Image source={renderAoLe(le.mau_ao_le)} style={styles.aoLeIcon} />
                                    <View style={styles.tag}><Text style={styles.tagText}>Lễ {le.bac_le}</Text></View>
                                </View>
                                <View style={styles.summaryContainer}>
                                    <Text style={styles.summaryText}>
                                        <Text style={styles.highlightText}>
                                            {le.ban_van?.bd1_le_trich_tu?.trim() || item.bd_1}
                                            {le.ban_van?.bd2_trich_tu ? `; ${le.ban_van.bd2_trich_tu.trim()}` : (item.bd_2 ? `; ${item.bd_2}` : "")}
                                            {le.ban_van?.phuc_am_trich_tu ? `; ${le.ban_van.phuc_am_trich_tu.trim()}` : (item.tin_mung ? `; ${item.tin_mung}` : "")}
                                        </Text>
                                    </Text>
                                </View>
                                <Text style={[styles.highlightText, { marginTop: 10, fontStyle: 'italic', textAlign: 'center', fontSize: 13 }]}>
                                    {le.ban_van?.cau_phuc_am_tom_gon || (item.cau_loi_chua ? `"${item.cau_loi_chua}"` : "")}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </PagerView>

                    {listLe.length > 1 && (
                        <View style={styles.dotsContainer}>
                            {listLe.map((_, i) => (
                                <View key={i} style={[styles.dot, activeLeIndex === i ? styles.activeDot : styles.inactiveDot]} />
                            ))}
                        </View>
                    )}
                </View>
            </View>
        );
    };

    if (loading) {
        return <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#007AFF" /></View>;
    }

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <FlingGestureHandler direction={Directions.UP} onHandlerStateChange={onFlingUp}>
                <View style={{ flex: 1 }}>
                    <ImageBackground source={require('../../assets/images/11.jpg')} style={styles.container}>
                        <PagerView ref={pagerRef} style={styles.mainPager} initialPage={initialIndex}>
                            {allDays.map((day, i) => <View key={i}><DayCard item={day} /></View>)}
                        </PagerView>

                        <Modal animationType="slide" visible={monthModalVisible}>
                            <View style={[styles.fullModal, { paddingTop: insets.top }]}>
                                <View style={styles.monthHeaderRow}>
                                    <TouchableOpacity onPress={() => setMonthModalVisible(false)}>
                                        <Text style={styles.closeBtnTxt}>✕</Text>
                                    </TouchableOpacity>
                                    <View style={styles.navContainer}>
                                        <TouchableOpacity onPress={goPrevMonth}><Text style={styles.navText}>{"<"}</Text></TouchableOpacity>
                                        <Text style={styles.monthLabel}>Tháng {currentViewDate.getMonth() + 1} - {currentViewDate.getFullYear()}</Text>
                                        <TouchableOpacity onPress={goNextMonth}><Text style={styles.navText}>{">"}</Text></TouchableOpacity>
                                    </View>
                                    <View style={{ width: 30 }} />
                                </View>

                                <View style={styles.weekHeader}>
                                    {['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'].map(d => (
                                        <Text key={d} style={styles.weekDay}>{d}</Text>
                                    ))}
                                </View>

                                <FlatList
                                    data={calendarGrid}
                                    numColumns={7}
                                    keyExtractor={(_, i) => i.toString()}
                                    renderItem={({ item }) => {
                                        if (!item) return <View style={styles.emptyDay} />;
                                        const isToday = new Date().toDateString() === item.date.toDateString();
                                        return (
                                            <TouchableOpacity style={[styles.dayCell, isToday && styles.todayCell]}>
                                                <Text style={styles.dayCellText}>{item.day}</Text>
                                            </TouchableOpacity>
                                        );
                                    }}
                                />
                            </View>
                        </Modal>

                        <Modal animationType="slide" visible={modalVisible}>
                            <View style={[styles.modalContainer, { paddingTop: insets.top }]}>
                                <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeButton}>
                                    <Text style={styles.closeButtonText}>✕ Đóng</Text>
                                </TouchableOpacity>
                                <ScrollView contentContainerStyle={styles.modalScrollContent}>
                                    {selectedLe?.ban_van ? (
                                        <>
                                            {selectedLe.ban_van.bd1_le && (
                                                <>
                                                    <Text style={styles.sectionTitle}>BÀI ĐỌC I</Text>
                                                    <Text style={styles.sectionContent}>{cleanHTML(selectedLe.ban_van.bd1_le)}</Text>
                                                </>
                                            )}
                                            {selectedLe.ban_van.phuc_am && (
                                                <>
                                                    <Text style={styles.sectionTitle}>TIN MỪNG</Text>
                                                    <Text style={styles.sectionContent}>{cleanHTML(selectedLe.ban_van.phuc_am)}</Text>
                                                </>
                                            )}
                                        </>
                                    ) : null}
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
    lePage: { flex: 1, justifyContent: 'center', padding: 15 },
    titleText: { fontSize: 18, fontWeight: 'bold', textAlign: 'center', color: '#c0392b' },
    infoRow: { alignItems: 'center' },
    aoLeIcon: { width: 40, height: 40 },
    tag: { backgroundColor: '#2980b9', padding: 5, borderRadius: 6 },
    tagText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
    summaryContainer: { paddingHorizontal: 10 },
    summaryText: { textAlign: 'center', marginTop: 10, fontSize: 14 },
    highlightText: { color: '#555' },
    dotsContainer: { flexDirection: 'row', justifyContent: 'center' },
    dot: { width: 7, height: 7, borderRadius: 3.5, margin: 3 },
    activeDot: { backgroundColor: '#c0392b', width: 16 },
    inactiveDot: { backgroundColor: '#ccc' },
    fullModal: { flex: 1, backgroundColor: '#fff' },
    monthHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15 },
    closeBtnTxt: { fontSize: 24 },
    navContainer: { flexDirection: 'row', alignItems: 'center' },
    navText: { fontSize: 22, color: '#c0392b' },
    monthLabel: { fontSize: 18, fontWeight: 'bold' },
    weekHeader: { flexDirection: 'row' },
    weekDay: { width: width / 7, textAlign: 'center', fontWeight: 'bold' },
    dayCell: { width: width / 7, height: height / 11, alignItems: 'center', justifyContent: 'center' },
    emptyDay: { width: width / 7, height: height / 11 },
    dayCellText: { fontSize: 18 },
    todayCell: { backgroundColor: '#fdecea' },
    modalContainer: { flex: 1, backgroundColor: '#fff' },
    closeButton: { padding: 15 },
    closeButtonText: { color: '#c0392b', fontSize: 16, fontWeight: 'bold' },
    modalScrollContent: { padding: 20 },
    sectionTitle: { fontSize: 16, fontWeight: 'bold', marginVertical: 10, color: '#c0392b' },
    sectionContent: { fontSize: 16, lineHeight: 24 }
});

export default LichCongGiaoScreen;
