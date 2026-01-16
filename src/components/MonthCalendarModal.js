import React, { useMemo, memo, useState } from 'react';
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    Modal,
    ScrollView,
    FlatList,
    Dimensions,
    ActivityIndicator,
    StatusBar,
    useWindowDimensions
} from 'react-native';
import PagerView from 'react-native-pager-view';
import RenderHTML from "react-native-render-html";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { width, height } = Dimensions.get('window');
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

const MonthCell = memo(({ item, isToday, isClicked, dayInfo, onPress }) => {
    if (!item) return <View style={styles.cellWrapper} />;
    const dotColor = dayInfo ? mapColor(dayInfo.mau_ao_le) : 'transparent';
    const isTrong = dayInfo?.bac_le === 'Trọng';
    const isSunday = item.date.getDay() === 0;

    return (
        <View style={styles.cellWrapper}>
            <TouchableOpacity
                activeOpacity={0.7}
                style={[styles.dayCell, isToday && styles.todayCell, isTrong && styles.cellLeTrong, isClicked && styles.clickedCell]}
                onPress={() => onPress(item.date)}
            >
                <Text style={[styles.dayCellText, isSunday && { color: '#c0392b' }, isTrong && { fontWeight: 'bold' }]}>{item.day}</Text>
                <View style={[styles.dotMauAo, { backgroundColor: dotColor, borderColor: dotColor === '#ecf0f1' ? '#bdc3c7' : 'transparent', borderWidth: dotColor === '#ecf0f1' ? 0.5 : 0 }]} />
            </TouchableOpacity>
        </View>
    );
});

const MonthGrid = memo(({ month, year, clickedDate, yearData, onDayPress }) => {
    const grid = useMemo(() => {
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const firstDay = new Date(year, month, 1).getDay();
        const cells = [];
        for (let i = 0; i < firstDay; i++) cells.push(null);
        for (let d = 1; d <= daysInMonth; d++) cells.push({ day: d, date: new Date(year, month, d) });
        return cells;
    }, [month, year]);

    return (
        <View style={{ width: '100%' }}>
            <View style={styles.weekHeader}>
                {['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'].map(d => (
                    <Text key={d} style={[styles.weekDay, d === 'CN' && { color: '#c0392b' }]}>{d}</Text>
                ))}
            </View>
            <FlatList
                data={grid}
                numColumns={7}
                scrollEnabled={false}
                keyExtractor={(_, i) => `grid-${month}-${year}-${i}`}
                renderItem={({ item }) => {
                    const dateKey = item ? `${item.date.getFullYear()}-${String(item.date.getMonth() + 1).padStart(2, '0')}-${String(item.date.getDate()).padStart(2, '0')}` : "";
                    return (
                        <MonthCell
                            item={item}
                            isToday={item && new Date().toDateString() === item.date.toDateString()}
                            isClicked={item && clickedDate?.toDateString() === item.date.toDateString()}
                            dayInfo={yearData.find(x => x.date === dateKey)}
                            onPress={onDayPress}
                        />
                    );
                }}
            />
        </View>
    );
});

const MonthCalendarModal = ({
    visible, onClose, insets, GENERATED_MONTHS, monthPagerIndex,
    setMonthPagerIndex, clickedDate, setClickedDate, yearData,
    fullDayData, loadingDay, fontScale, setFontScale, darkMode, setDarkMode
}) => {
    const [activeLeIdx, setActiveLeIdx] = useState(0);
    const [detailVisible, setDetailVisible] = useState(false);
    const [selectedLe, setSelectedLe] = useState(null);
    const { width: contentWidth } = useWindowDimensions();

    const listLe = useMemo(() => {
        if (!fullDayData) return [];
        const arr = fullDayData.arr_cac_le || [];
        if (arr.length === 0) return [fullDayData];
        return arr.map((le, index) => {
            if (index === 0) {
                return {
                    ...le,
                    bd_1: fullDayData.bd_1 || le.bd_1,
                    bd_2: fullDayData.bd_2 || le.bd_2,
                    tin_mung: fullDayData.tin_mung || le.tin_mung,
                };
            }
            return le;
        });
    }, [fullDayData]);

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

    return (
        <Modal animationType="slide" visible={visible}>
            <View style={[styles.fullModal, { paddingTop: insets.top }]}>
                <View style={styles.monthHeaderRow}>
                    <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                        <Text style={styles.closeBtnTxt}>✕ Đóng</Text>
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Lịch Tháng</Text>
                    <View style={{ width: 60 }} />
                </View>

                <View style={styles.calendarContainer}>
                    <PagerView
                        style={{ flex: 1 }}
                        initialPage={monthPagerIndex}
                        onPageSelected={(e) => setMonthPagerIndex(e.nativeEvent.position)}
                    >
                        {GENERATED_MONTHS.map((m, index) => (
                            <View key={`month-page-${index}`} style={{ paddingHorizontal: 10 }}>
                                <Text style={styles.monthLabel}>Tháng {m.month + 1} - {m.year}</Text>
                                <MonthGrid month={m.month} year={m.year} clickedDate={clickedDate} yearData={yearData} onDayPress={(d) => { setActiveLeIdx(0); setClickedDate(d); }} />
                            </View>
                        ))}
                    </PagerView>
                </View>

                <View style={styles.infoBox}>
                    {loadingDay ? (
                        <ActivityIndicator size="large" color="#c0392b" style={{ marginTop: 40 }} />
                    ) : clickedDate && listLe.length > 0 ? (
                        <View style={{ flex: 1, width: '100%' }}>
                            <View style={{ alignItems: 'center', marginBottom: 5 }}>
                                <Text style={styles.infoTextMain}>{clickedDate.getDate()}-{clickedDate.getMonth() + 1}-{clickedDate.getFullYear()}</Text>
                                <View style={styles.dividerSmall} />
                            </View>

                            <PagerView
                                style={{ flex: 1 }}
                                initialPage={0}
                                onPageSelected={(e) => setActiveLeIdx(e.nativeEvent.position)}
                            >
                                {listLe.map((le, idx) => (
                                    <ScrollView key={`le-info-${idx}`} showsVerticalScrollIndicator={false}>
                                        <TouchableOpacity activeOpacity={0.7} onPress={() => { setSelectedLe(le); setDetailVisible(true); }} style={{ alignItems: 'center', paddingBottom: 20 }}>
                                            <Text style={styles.infoTextSub}>{le.title}</Text>
                                            <Text style={styles.summaryText}>
                                                {le.ban_van?.bd1_le_trich_tu || le.bd_1}
                                                {le.ban_van?.bd2_trich_tu ? `; ${le.ban_van.bd2_trich_tu}` : le.bd_2 ? `; ${le.bd_2}` : ""}
                                                {`; ${le.ban_van?.phuc_am_trich_tu || le.tin_mung || ""}`}
                                            </Text>
                                            <Text style={[styles.infoTextSub, { fontWeight: '500', fontSize: 16, marginTop: 8, marginBottom: 0 }]}>{fullDayData.under_title}</Text>
                                            {fullDayData.xu_chau_luot ? (
                                                <View style={styles.chauLuotContainer}>
                                                    <Text style={styles.chauLuotTitle}>⛪ Chầu lượt:</Text>
                                                    <Text style={styles.chauLuotText}>{fullDayData.xu_chau_luot.trim()} Chầu Mình Thánh</Text>
                                                </View>
                                            ) : null}
                                            {/* <Text style={styles.noteText}>Chạm để xem chi tiết bài đọc 📖</Text> */}
                                        </TouchableOpacity>
                                    </ScrollView>
                                ))}
                            </PagerView>

                            {listLe.length > 1 && (
                                <View style={styles.dotsContainer}>
                                    {listLe.map((_, i) => (
                                        <View key={`dot-m-${i}`} style={[styles.dot, activeLeIdx === i ? styles.activeDot : styles.inactiveDot]} />
                                    ))}
                                </View>
                            )}
                        </View>
                    ) : (
                        <Text style={styles.placeholderText}>Chọn một ngày để xem</Text>
                    )}
                </View>

                {/* MODAL CHI TIẾT LỒNG BÊN TRONG CÓ ĐẦY ĐỦ CONTROL BAR */}
                <Modal animationType="slide" visible={detailVisible} transparent={false}>
                    <View style={[styles.detailModalContainer, { paddingTop: insets.top, backgroundColor: modalColors.bg }]}>
                        <StatusBar barStyle={darkMode ? "light-content" : "dark-content"} />
                        <View style={[styles.detailControlBar, { backgroundColor: modalColors.controlBg, borderBottomColor: modalColors.border }]}>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <TouchableOpacity onPress={() => { const s = Math.max(0.8, fontScale - 0.1); setFontScale(s); AsyncStorage.setItem(FONT_SCALE_KEY, s.toString()) }}><Text style={{ fontSize: 20, color: modalColors.text, padding: 5 }}>A-</Text></TouchableOpacity>
                                <Text style={{ marginHorizontal: 10, color: modalColors.text }}>{Math.round(fontScale * 100)}%</Text>
                                <TouchableOpacity onPress={() => { const s = Math.min(1.8, fontScale + 0.1); setFontScale(s); AsyncStorage.setItem(FONT_SCALE_KEY, s.toString()) }}><Text style={{ fontSize: 20, color: modalColors.text, padding: 5 }}>A+</Text></TouchableOpacity>
                            </View>
                            <TouchableOpacity onPress={() => { const m = !darkMode; setDarkMode(m); AsyncStorage.setItem(DARK_MODE_KEY, m.toString()) }}><Text style={{ fontSize: 20 }}>{darkMode ? "🌙" : "☀️"}</Text></TouchableOpacity>
                            <TouchableOpacity onPress={() => setDetailVisible(false)} style={styles.detailCloseBtn}>
                                <Text style={{ color: modalColors.title, fontWeight: 'bold', fontSize: 16 }}>✕ Đóng</Text>
                            </TouchableOpacity>
                        </View>
                        <ScrollView contentContainerStyle={{ padding: 20 }}>
                            {selectedLe?.ban_van ? (
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
                            ) : (
                                <Text style={{ textAlign: 'center', marginTop: 50, color: modalColors.text }}>Chưa có nội dung bài đọc.</Text>
                            )}
                        </ScrollView>
                    </View>
                </Modal>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    fullModal: { flex: 1, backgroundColor: '#fff' },
    monthHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 10, borderBottomWidth: 0.5, borderBottomColor: '#eee' },
    closeBtn: { padding: 5 },
    closeBtnTxt: { fontSize: 16, color: '#2980b9', fontWeight: 'bold' },
    headerTitle: { fontSize: 18, fontWeight: 'bold' },
    calendarContainer: { height: height * 0.42, backgroundColor: '#fff' },
    monthLabel: { fontSize: 18, fontWeight: 'bold', color: '#c0392b', textAlign: 'center', marginVertical: 8 },
    weekHeader: { flexDirection: 'row', paddingVertical: 5 },
    weekDay: { flex: 1, textAlign: 'center', fontWeight: 'bold', fontSize: 13, color: '#7f8c8d' },
    cellWrapper: { flex: 1 / 7, aspectRatio: 1, alignItems: 'center', justifyContent: 'center' },
    dayCell: { width: '85%', height: '85%', alignItems: 'center', justifyContent: 'center' },
    dayCellText: { fontSize: 16, color: '#2c3e50' },
    todayCell: { backgroundColor: '#ffecec', borderRadius: 8, borderWidth: 1, borderColor: '#c0392b' },
    clickedCell: { backgroundColor: '#e3f2fd', borderRadius: 8, borderWidth: 1.5, borderColor: '#3498db' },
    cellLeTrong: { borderWidth: 1, borderColor: '#c0392b', borderRadius: 8, backgroundColor: '#fffcfc' },
    dotMauAo: { width: 4, height: 4, borderRadius: 2, position: 'absolute', bottom: 4 },
    infoBox: { flex: 1, paddingHorizontal: 20, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#f0f0f0' },
    infoTextMain: { fontSize: 28, fontWeight: 'bold', color: '#c0392b', marginTop: 10 },
    dividerSmall: { width: 40, height: 3, backgroundColor: '#c0392b', borderRadius: 2, marginVertical: 5 },
    infoTextSub: { fontSize: 17, color: '#34495e', textAlign: 'center', fontWeight: 'bold', marginBottom: 10 },
    summaryText: { textAlign: 'center', color: '#555', fontSize: 14, paddingHorizontal: 15 },
    noteText: { textAlign: 'center', color: '#bdc3c7', fontSize: 12, marginTop: 12, fontStyle: 'italic' },
    placeholderText: { textAlign: 'center', marginTop: 100, color: '#bdc3c7' },
    dotsContainer: { flexDirection: 'row', justifyContent: 'center', paddingVertical: 10 },
    dot: { width: 6, height: 6, borderRadius: 3, margin: 3 },
    activeDot: { backgroundColor: '#c0392b', width: 12 },
    inactiveDot: { backgroundColor: '#ddd' },
    detailModalContainer: { flex: 1 },
    detailControlBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 10, borderBottomWidth: 1 },
    detailCloseBtn: { padding: 5 },
    sectionTitle: { fontWeight: 'bold', marginBottom: 5 },
    chauLuotContainer: { marginTop: 12, backgroundColor: '#f0f7ff', padding: 10, borderRadius: 10, width: '100%' },
    chauLuotTitle: { fontSize: 13, fontWeight: 'bold', color: '#2980b9', marginBottom: 2 },
    chauLuotText: { fontSize: 14, color: '#444', fontStyle: 'italic', marginTop: 8 },
});

export default memo(MonthCalendarModal);