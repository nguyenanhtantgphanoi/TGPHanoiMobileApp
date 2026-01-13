import React, { useEffect, useState, useRef, useImperativeHandle, forwardRef } from 'react';
import { ImageBackground, StyleSheet, Text, View, ActivityIndicator, Dimensions, Image, TouchableOpacity, Modal, ScrollView } from 'react-native';
import PagerView from 'react-native-pager-view';
import axios from 'axios';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Solar } from 'lunar-javascript';
import renderAoLe from '../utils/renderAoLe';

const { width, height } = Dimensions.get('window');

// Hàm làm sạch HTML
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

    // State cho Modal
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedLe, setSelectedLe] = useState(null);

    useImperativeHandle(ref, () => ({
        goToToday: () => {
            if (pagerRef.current) pagerRef.current.setPage(initialIndex);
        }
    }));

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const today = new Date();
            const year = today.getFullYear();
            const month = today.getMonth() + 1;
            const day = String(today.getDate()).padStart(2, '0');
            const formattedDate = `${year}-${month}-${day}`;

            const response = await axios.get(`https://service-tgphn.lamgs.io.vn/get-calendar?date=${formattedDate}`);
            const combinedData = [...(response.data.prev_month || []), ...(response.data.cur_month || []), ...(response.data.next_month || [])];

            const todayStr = `${year}-${String(month).padStart(2, '0')}-${day}`;
            const foundIndex = combinedData.findIndex(item => item.date === todayStr);

            setAllDays(combinedData);
            setInitialIndex(foundIndex !== -1 ? foundIndex : 0);
            setLoading(false);
        } catch (error) {
            setLoading(false);
        }
    };

    const handleOpenModal = (le) => {
        setSelectedLe(le);
        setModalVisible(true);
    };

    const DayCard = ({ item }) => {
        const dateObj = new Date(item.date);
        const daysOfWeek = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
        const dayName = daysOfWeek[dateObj.getDay()];
        const solar = Solar.fromYmd(dateObj.getFullYear(), dateObj.getMonth() + 1, dateObj.getDate());
        const lunar = solar.getLunar();

        const [activeLeIndex, setActiveLeIndex] = useState(0);
        const listLe = item.arr_cac_le && item.arr_cac_le.length > 0 ? item.arr_cac_le : [item];

        return (
            <View style={styles.page}>
                {/* Block 1: Top */}
                <View style={[styles.topBlock, { marginTop: insets.top + 15 }]}>
                    <Text style={styles.dayNameText}>{dayName.toUpperCase()}</Text>
                    <View style={styles.mainDateContainer}>
                        <Text style={styles.dayNumText}>{dateObj.getDate()}</Text>
                        <Text style={styles.monthYearText}>THÁNG {dateObj.getMonth() + 1} NĂM {dateObj.getFullYear()}</Text>
                    </View>
                    <View style={styles.topFooter}>
                        <Text style={styles.lunarText}>Lịch âm: <Text style={styles.lunarDateHighlight}>{lunar.getDay()}/{lunar.getMonth()}</Text></Text>
                    </View>
                </View>

                {/* Block 2: Touchable để mở Modal */}
                <View style={[styles.bottomBlock, { marginBottom: 60 }]}>
                    <PagerView
                        style={styles.pagerLe}
                        initialPage={0}
                        onPageSelected={(e) => setActiveLeIndex(e.nativeEvent.position)}
                    >
                        {listLe.map((le, idx) => (
                            <TouchableOpacity
                                key={idx}
                                style={styles.lePage}
                                activeOpacity={0.9}
                                onPress={() => handleOpenModal(le)}
                            >
                                <Text style={styles.titleText}>{le.title}</Text>

                                <View style={styles.infoRow}>
                                    <Image
                                        source={renderAoLe(le.mau_ao_le)}
                                        style={styles.aoLeIcon}
                                    />
                                    <View style={[styles.tag, { backgroundColor: 'rgba(41, 128, 185, 0.9)' }]}><Text style={styles.tagText}>Lễ {le.bac_le}</Text></View>
                                </View>

                                <View style={styles.summaryContainer}>
                                    <Text style={[styles.summaryText,{fontSize: 16}]}>
                                        <Text style={styles.highlightText}>
                                            {le.ban_van?.bd1_le_trich_tu?.trim() || item.bd_1}
                                            {le.ban_van?.bd2_trich_tu ? `; ${le.ban_van.bd2_trich_tu.trim()}` : (item.bd_2 ? `; ${item.bd_2}` : "")}
                                            {le.ban_van?.phuc_am_trich_tu ? `; ${le.ban_van.phuc_am_trich_tu.trim()}` : (item.tin_mung ? `; ${item.tin_mung}` : "")}
                                        </Text>
                                    </Text>
                                </View>

                                <Text style={[styles.highlightText, { marginTop: 10, fontStyle: 'italic', textAlign: 'center', fontSize: 16 }]}>
                                    {le.ban_van?.cau_phuc_am_tom_gon || (item.cau_loi_chua ? `"${item.cau_loi_chua}"` : "")}
                                </Text>
                                <Text style={{ textAlign: 'center', color: '#c0392b', fontSize: 11, marginTop: 5, fontWeight: 'bold' }}>— Chạm để xem chi tiết —</Text>
                            </TouchableOpacity>
                        ))}
                    </PagerView>

                    {listLe.length > 1 && (
                        <View style={styles.dotsContainer}>
                            {listLe.map((_, dotIdx) => (
                                <View key={dotIdx} style={[styles.dot, activeLeIndex === dotIdx ? styles.activeDot : styles.inactiveDot]} />
                            ))}
                        </View>
                    )}
                </View>
            </View>
        );
    };

    if (loading) return <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#007AFF" /></View>;

    return (
        <ImageBackground source={require('../../assets/images/11.jpg')} style={styles.container}>
            <PagerView ref={pagerRef} style={styles.mainPager} initialPage={initialIndex}>
                {allDays.map((day, index) => <View key={index}><DayCard item={day} /></View>)}
            </PagerView>

            {/* MODAL CHI TIẾT BÀI ĐỌC */}
            <Modal
                animationType="slide"
                transparent={false}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <SafeAreaView style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeButton}>
                            <Text style={styles.closeButtonText}>✕ Đóng</Text>
                        </TouchableOpacity>
                        {/* <Text style={styles.modalHeaderTitle} numberOfLines={1}>{selectedLe?.title}</Text> */}
                    </View>

                    <ScrollView contentContainerStyle={styles.modalScrollContent}>
                        {selectedLe?.ban_van ? (
                            <View>
                                {/* Bài đọc 1 */}
                                {selectedLe.ban_van.bd1_le_trich_tu && (
                                    <View style={styles.detailSection}>
                                        <Text style={styles.sectionTitle}>BÀI ĐỌC I ({selectedLe.ban_van.bd1_le_trich_tu})</Text>
                                        <Text style={styles.sectionContent}>{cleanHTML(selectedLe.ban_van.bd1_le)}</Text>
                                    </View>
                                )}

                                {/* Đáp ca */}
                                {selectedLe.ban_van.dap_ca_le_trich_tu && (
                                    <View style={styles.detailSection}>
                                        <Text style={styles.sectionTitle}>ĐÁP CA ({selectedLe.ban_van.dap_ca_le_trich_tu})</Text>
                                        <Text style={[styles.sectionContent, { fontStyle: 'italic' }]}>{cleanHTML(selectedLe.ban_van.dap_ca_le)}</Text>
                                    </View>
                                )}

                                {/* Bài đọc 2 */}
                                {selectedLe.ban_van.bd2_le_trich_tu && (
                                    <View style={styles.detailSection}>
                                        <Text style={styles.sectionTitle}>BÀI ĐỌC II ({selectedLe.ban_van.bd2_le_trich_tu})</Text>
                                        <Text style={styles.sectionContent}>{cleanHTML(selectedLe.ban_van.bd2_le)}</Text>
                                    </View>
                                )}

                                {/* Tin Mừng */}
                                {selectedLe.ban_van.phuc_am_trich_tu && (
                                    <View style={styles.detailSection}>
                                        <Text style={styles.sectionTitle}>TIN MỪNG ({selectedLe.ban_van.phuc_am_trich_tu})</Text>
                                        <Text style={[styles.sectionContent, { fontWeight: '500' }]}>{cleanHTML(selectedLe.ban_van.phuc_am)}</Text>
                                    </View>
                                )}
                            </View>
                        ) : (
                            <Text style={styles.noDataText}>Nội dung chi tiết đang được cập nhật...</Text>
                        )}
                    </ScrollView>
                </SafeAreaView>
            </Modal>
        </ImageBackground>
    );
});

const styles = StyleSheet.create({
    container: { flex: 1 },
    mainPager: { flex: 1 },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
    page: { flex: 1, alignItems: 'center', justifyContent: 'space-between' },

    topBlock: {
        width: width * 0.9,
        backgroundColor: 'rgba(255, 255, 255, 0.75)',
        borderRadius: 24,
        padding: 20,
        alignItems: 'center',
        elevation: 5,
    },
    dayNameText: { fontSize: 24, fontWeight: '900', color: '#c0392b', letterSpacing: 2 },
    mainDateContainer: { alignItems: 'center', marginVertical: 10 },
    dayNumText: { fontSize: 90, fontWeight: 'bold', color: '#2c3e50', lineHeight: 100 },
    monthYearText: { fontSize: 18, fontWeight: '700', color: '#7f8c8d' },
    topFooter: { width: '100%', alignItems: 'center', paddingTop: 15, borderTopWidth: 0.5, borderTopColor: 'rgba(0,0,0,0.1)' },
    lunarText: { fontSize: 16, color: '#34495e' },
    lunarDateHighlight: { color: '#c0392b', fontWeight: 'bold' },

    bottomBlock: {
        width: width * 0.92,
        height: height * 0.32,
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        borderRadius: 28,
        overflow: 'hidden',
        elevation: 5,
    },
    pagerLe: { flex: 1 },
    lePage: { flex: 1, padding: 15, justifyContent: 'center' },
    titleText: { fontSize: 18, fontWeight: 'bold', color: '#c0392b', textAlign: 'center', marginBottom: 5 },
    infoRow: { justifyContent: 'center', marginBottom: 5, alignSelf: 'center', alignItems: 'center' },
    aoLeIcon: { width: 40, height: 40, resizeMode: 'contain', marginBottom: 5 },
    tag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, marginHorizontal: 4 },
    tagText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },

    summaryContainer: { flexDirection: 'row', justifyContent: 'center', paddingHorizontal: 10 },
    summaryText: { fontSize: 14, color: '#34495e', fontWeight: '800', textAlign: 'center', marginTop: 10 },
    highlightText: { color: '#555', fontWeight: '500' },

    dotsContainer: { flexDirection: 'row', justifyContent: 'center', paddingBottom: 10 },
    dot: { width: 7, height: 7, borderRadius: 3.5, marginHorizontal: 3 },
    activeDot: { backgroundColor: '#c0392b', width: 16 },
    inactiveDot: { backgroundColor: 'rgba(0,0,0,0.1)' },

    // Modal Styles
    modalContainer: { flex: 1, backgroundColor: '#fff' },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        backgroundColor: '#f9f9f9'
    },
    closeButton: { padding: 5 },
    closeButtonText: { color: '#c0392b', fontWeight: 'bold', fontSize: 16 },
    modalHeaderTitle: { flex: 1, textAlign: 'center', fontWeight: 'bold', fontSize: 16, color: '#2c3e50', marginRight: 40 },
    modalScrollContent: { padding: 20 },
    detailSection: { marginBottom: 25 },
    sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#c0392b', marginBottom: 10, borderLeftWidth: 4, borderLeftColor: '#c0392b', paddingLeft: 10 },
    sectionContent: { fontSize: 16, color: '#2c3e50', lineHeight: 24, textAlign: 'justify' },
    noDataText: { textAlign: 'center', marginTop: 50, color: '#999', fontSize: 16 },
});

export default LichCongGiaoScreen;