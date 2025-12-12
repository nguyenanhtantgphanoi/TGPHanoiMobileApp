import React from "react";
import { View, Text, ImageBackground, StyleSheet, Dimensions, StatusBar } from "react-native";
import { GestureDetector, Gesture } from "react-native-gesture-handler";
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    runOnJS,
    useDerivedValue,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");

// Dữ liệu mẫu (Giữ nguyên)
const daysData = [
    {
        date: "Thứ Sáu, 12",
        lunarDate: "23/10",
        monthYear: "Tháng 12, 2025",
        le: "Ngày thường Mùa Vọng",
        tinMung: "Mt 11:16-19",
        loiChua: "“Ngài dẫn tôi đến đồng cỏ xanh tươi.”",
        mauAo: "Tím",
        color: 'purple',
        background: require("../../assets/images/background.jpg"),
    },
    {
        date: "Thứ Bảy, 13",
        lunarDate: "24/10",
        monthYear: "Tháng 12, 2025",
        le: "Thánh Lucia, Trinh Nữ, Tử Đạo",
        tinMung: "Mt 17:10-13",
        loiChua: "“Ngài là ánh sáng và ơn cứu độ của tôi.”",
        mauAo: "Tím",
        color: 'purple',
        background: require("../../assets/images/b2.webp"),
    },
    {
        date: "Chủ Nhật, 14",
        lunarDate: "25/10",
        monthYear: "Tháng 12, 2025",
        le: "Chúa Nhật III Mùa Vọng (Chúa Nhật Vui Mừng)",
        tinMung: "Ga 1:6-8, 19-28",
        loiChua: "“Hãy vui mừng trong Chúa luôn mãi.”",
        mauAo: "Hồng",
        color: 'pink',
        background: require("../../assets/images/background.jpg"),
    },
    {
        date: "Thứ Hai, 15",
        lunarDate: "26/10",
        monthYear: "Tháng 12, 2025",
        le: "Ngày thường Mùa Vọng",
        tinMung: "Lc 7:24-30",
        loiChua: "“Đức Giê-su Christ là hy vọng của chúng ta.”",
        mauAo: "Tím",
        color: 'purple',
        background: require("../../assets/images/b2.webp"),
    },
];

export default function LichCongGiaoScreen() {
    // Logic Vuốt và Vị trí (Giữ nguyên)
    const currentIndex = useSharedValue(0);
    const position = useSharedValue(0);

    const onFinishSwipe = (newIndex) => {
        currentIndex.value = newIndex;
        position.value = 0;
    };

    const gesture = Gesture.Pan()
        .onUpdate((e) => {
            position.value = e.translationX;
        })
        .onEnd((e) => {
            const THRESH = 100;
            const swipeDuration = 250;
            const currentIdx = currentIndex.value;

            if (e.translationX < -THRESH && currentIdx < daysData.length - 1) {
                const newIndex = currentIdx + 1;
                position.value = withTiming(
                    -width,
                    { duration: swipeDuration },
                    () => runOnJS(onFinishSwipe)(newIndex)
                );
            } else if (e.translationX > THRESH && currentIdx > 0) {
                const newIndex = currentIdx - 1;
                position.value = withTiming(
                    width,
                    { duration: swipeDuration },
                    () => runOnJS(onFinishSwipe)(newIndex)
                );
            } else {
                position.value = withTiming(0, { duration: 200 });
            }
        });

    const translateX = useDerivedValue(() => {
        return -width * currentIndex.value + position.value;
    });

    const styleWrap = useAnimatedStyle(() => ({
        transform: [{ translateX: translateX.value }],
    }));

    const Slot = ({ item }) => {
        const [dayOfWeek, dayOfMonth] = item.date.split(', ');

        return (
            <ImageBackground
                source={item.background}
                style={styles.slot}
                resizeMode="cover"
            >
                <SafeAreaView style={styles.contentWrapper}>
                    {/* Phần Header */}
                    <View style={styles.dateHeader}>
                        <Text style={styles.dayOfWeekText}>{dayOfWeek}</Text>
                        <Text style={styles.dateText}>{dayOfMonth}</Text>

                        <View style={styles.subDateContainer}>
                            <Text style={styles.monthYearText}>{item.monthYear}</Text>

                            {/* Âm Lịch */}
                            <View style={styles.lunarContainer}>
                                <Text style={styles.lunarLabel}> (Âm lịch: </Text>
                                <Text style={styles.lunarDateText}>{item.lunarDate}</Text>
                                <Text style={styles.lunarLabel}>)</Text>
                            </View>
                        </View>
                    </View>

                    {/* Phần Thông Tin Chi Tiết */}
                    <View style={styles.infoContainer}>
                        <Text style={styles.leText}>{item.le}</Text>

                        <View style={styles.mauAoContainer}>
                            <Text style={styles.mauAoLabel}>Áo Lễ:</Text>
                            <View style={[styles.mauAoIndicator, { backgroundColor: item.color.toLowerCase() }]} />
                            <Text style={styles.mauAoText}>{item.mauAo}</Text>
                        </View>

                        <Text style={styles.label}>Trích Sách Tin Mừng:</Text>
                        <Text style={styles.detailText}>{item.tinMung}</Text>

                        <Text style={styles.label}>Lời Chúa:</Text>
                        <Text style={styles.detailText}>{item.loiChua}</Text>
                    </View>
                </SafeAreaView>

            </ImageBackground>
        );
    };

    const wrapWidth = width * daysData.length;

    return (
        <GestureDetector gesture={gesture}>
            <View style={styles.container}>
                <StatusBar barStyle="dark-content" />
                <Animated.View style={[styles.wrap, { width: wrapWidth }, styleWrap]}>
                    {daysData.map((item, i) => (
                        <Slot key={i} item={item} />
                    ))}
                </Animated.View>

                {/* styles.hint ĐÃ ĐƯỢC XÓA KHỎI ĐÂY */}
            </View>
        </GestureDetector>
    );
}

// Styles (Đã tăng độ trong suốt cho nền và xóa hint)
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F5F5F5",
        overflow: 'hidden',
    },
    wrap: {
        flexDirection: "row",
        height: "100%",
    },
    slot: {
        width,
        height: "100%",
        justifyContent: "center",
        alignItems: "center",
    },

    contentWrapper: {
        flex: 1,
        width: '100%',
        paddingTop: 50,
        paddingBottom: 50,
        alignItems: 'center',
        justifyContent: 'space-between',
    },

    // --- Date Header (Trong suốt hơn) ---
    dateHeader: {
        flexDirection: 'column',
        alignItems: 'center',
        marginBottom: 30,
        paddingVertical: 15,
        paddingHorizontal: 30,
        // GIẢM OPACITY: Từ 0.95 xuống 0.75
        backgroundColor: 'rgba(255, 255, 255, 0.75)',
        borderRadius: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15, // Giảm shadow nhẹ
        shadowRadius: 4,
        elevation: 3,
    },
    dayOfWeekText: {
        fontSize: 24,
        color: "#333",
        fontWeight: "600",
        marginBottom: 5,
    },
    dateText: {
        fontSize: 120,
        color: "#000",
        fontWeight: "900",
        lineHeight: 120,
        marginBottom: 10,
    },
    subDateContainer: {
        alignItems: 'center',
    },
    monthYearText: {
        fontSize: 18,
        color: "#444",
        fontWeight: '500',
        marginBottom: 5,
    },

    // --- Ngày Âm Lịch ---
    lunarContainer: {
        flexDirection: 'row',
        alignItems: 'baseline',
        marginTop: 5,
    },
    lunarLabel: {
        fontSize: 16,
        color: '#666',
    },
    lunarDateText: {
        fontSize: 16,
        color: '#B8860B',
        fontWeight: 'bold',
    },

    // --- Info Container (Trong suốt hơn) ---
    infoContainer: {
        width: '90%',
        maxWidth: 500,
        // GIẢM OPACITY: Từ 0.95 xuống 0.75
        backgroundColor: 'rgba(255, 255, 255, 0.75)',
        padding: 25,
        borderRadius: 15,
        alignItems: 'center',
        marginTop: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15, // Giảm shadow nhẹ
        shadowRadius: 4,
        elevation: 4,
    },
    leText: {
        fontSize: 26,
        color: "#8B0000",
        fontWeight: "bold",
        marginBottom: 20,
        textAlign: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#ccc',
        paddingBottom: 10,
    },

    // Màu Áo Lễ
    mauAoContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    mauAoLabel: {
        fontSize: 16,
        color: '#555',
        marginRight: 10,
    },
    mauAoIndicator: {
        width: 35,
        height: 10,
        borderRadius: 5,
        marginRight: 10,
        borderWidth: 1,
        borderColor: '#999',
    },
    mauAoText: {
        fontSize: 18,
        color: '#333',
        fontWeight: 'bold',
    },

    // Chi tiết Sách/Lời Chúa
    label: {
        fontSize: 16,
        color: "#666",
        fontWeight: "600",
        marginTop: 15,
        marginBottom: 8,
    },
    detailText: {
        fontSize: 18,
        color: "#333",
        textAlign: "center",
        paddingHorizontal: 10,
        fontStyle: 'italic',
    },

    // Hint ĐÃ BỊ XÓA HOÀN TOÀN
});