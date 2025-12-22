import React, { useEffect, useState, useRef, memo } from "react";
import {
    View,
    Text,
    ImageBackground,
    StyleSheet,
    Dimensions,
    StatusBar,
    Image,
    ActivityIndicator,
} from "react-native";
import { GestureDetector, Gesture } from "react-native-gesture-handler";
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    runOnJS,
    useDerivedValue,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import axios from "axios";
import renderAoLe from "../utils/renderAoLe";

const { width } = Dimensions.get("window");

/* =======================
   OPTIMIZED SLOT COMPONENT
======================= */
const Slot = memo(({ item }) => {
    const [dayOfWeek, dayOfMonth] = item.date.split(", ");
    return (
        <ImageBackground source={item.background} style={styles.slot} resizeMode="cover">
            <SafeAreaView style={styles.contentWrapper}>
                <View style={styles.dateHeader}>
                    <Text style={styles.dayOfWeekText}>{dayOfWeek}</Text>
                    <Text style={styles.dateText}>{dayOfMonth}</Text>
                    <Text style={styles.monthYearText}>{item.monthYear}</Text>
                </View>

                <View style={styles.infoContainer}>
                    <Text style={styles.leText}>{item.le}</Text>
                    <View style={styles.mauAoContainer}>
                        {/* Hiển thị áo lễ dựa trên color key đã format */}
                        <Image source={renderAoLe(item.color)} style={styles.aoImage} />
                        {/* <Text style={styles.mauAoText}>Màu: {item.mauAoRaw}</Text> */}
                    </View>

                    {!!item.tinMung && (
                        <View style={styles.textBlock}>
                            <Text style={styles.label}>Trích Sách Tin Mừng:</Text>
                            <Text style={styles.detailText}>{item.tinMung}</Text>
                        </View>
                    )}

                    {!!item.loiChua && (
                        <View style={styles.textBlock}>
                            <Text style={styles.label}>Lời Chúa:</Text>
                            <Text style={styles.detailText}>{item.loiChua}</Text>
                        </View>
                    )}
                </View>
            </SafeAreaView>
        </ImageBackground>
    );
});

export default function LichCongGiaoScreen() {
    const [dateData, setDateData] = useState([]);
    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const loadingRef = useRef(false);
    const loadedMonths = useRef(new Set());

    const currentIndex = useSharedValue(0);
    const position = useSharedValue(0);

    /* =======================
       FORMAT DATA & COLOR LOGIC
    ======================= */
    const formatDateItem = (item) => {
        const d = new Date(item.date);
        const mauAoRaw = item.mau_ao_le || "";

        // Logic nhận diện màu chuẩn xác hơn
        let colorKey = "white";
        if (mauAoRaw.includes("Tím")) colorKey = "purple";
        else if (mauAoRaw.includes("Đỏ")) colorKey = "red";
        else if (mauAoRaw.includes("Xanh")) colorKey = "green";
        else if (mauAoRaw.includes("Trắng")) colorKey = "white";
        else if (mauAoRaw.includes("Vàng")) colorKey = "yellow";

        return {
            id: item.date,
            rawDate: item.date,
            mauAoRaw: mauAoRaw,
            date: `${d.toLocaleDateString("vi-VN", { weekday: "long" }).charAt(0).toUpperCase() + d.toLocaleDateString("vi-VN", { weekday: "long" }).slice(1)}, ${d.getDate()}`,
            monthYear: d.toLocaleDateString("vi-VN", { month: "long", year: "numeric" }),
            le: item.title,
            tinMung: item.tin_mung || "",
            loiChua: item.cau_loi_chua || "",
            color: colorKey,
            background: require("../../assets/images/background.jpg"),
        };
    };

    /* =======================
       FETCH API LOGIC
    ======================= */
    const fetchCalendarData = async (targetDate, direction = "append") => {
        const monthKey = targetDate.substring(0, 7);
        if (loadedMonths.current.has(monthKey) || loadingRef.current) return;

        loadingRef.current = true;
        try {
            const res = await axios.get(`https://service-tgphn.lamgs.io.vn/get-calendar?date=${targetDate}`);
            const combinedRaw = [
                ...(res.data.prev_month || []),
                ...(res.data.cur_month || []),
                ...(res.data.next_month || [])
            ];

            const newItems = combinedRaw.map(formatDateItem);

            setDateData(prev => {
                const merged = direction === "prepend" ? [...newItems, ...prev] : [...prev, ...newItems];

                // Khử trùng bằng Map để tránh lỗi Duplicate Keys
                const uniqueMap = new Map();
                merged.forEach(item => uniqueMap.set(item.rawDate, item));
                const sorted = Array.from(uniqueMap.values()).sort((a, b) => new Date(a.rawDate) - new Date(b.rawDate));

                // Bù trừ Index khi thêm dữ liệu về phía trước
                if (direction === "prepend" && prev.length > 0) {
                    const firstOldDate = prev[0].rawDate;
                    const newPos = sorted.findIndex(d => d.rawDate === firstOldDate);
                    if (newPos > 0) currentIndex.value = currentIndex.value + newPos;
                }
                return sorted;
            });

            loadedMonths.current.add(monthKey);
        } catch (error) {
            console.error("Fetch Error:", error.message);
        } finally {
            loadingRef.current = false;
        }
    };

    useEffect(() => {
        (async () => {
            const todayStr = new Date().toISOString().split('T')[0];
            await fetchCalendarData(todayStr, "append");
            setIsInitialLoading(false);
        })();
    }, []);

    useEffect(() => {
        if (!isInitialLoading && dateData.length > 0) {
            const todayStr = new Date().toISOString().split('T')[0];
            const todayIdx = dateData.findIndex(item => item.rawDate === todayStr);
            if (todayIdx !== -1) currentIndex.value = todayIdx;
        }
    }, [isInitialLoading]);

    /* =======================
       GESTURE & ANIMATION
    ======================= */
    const onFinishSwipe = (newIndex) => {
        currentIndex.value = newIndex;
        position.value = 0;

        // Load trước dữ liệu gối đầu (cách biên 5 ngày)
        if (newIndex >= dateData.length - 5) {
            const d = new Date(dateData[dateData.length - 1].rawDate);
            d.setMonth(d.getMonth() + 1);
            runOnJS(fetchCalendarData)(d.toISOString().split('T')[0], "append");
        } else if (newIndex <= 5) {
            const d = new Date(dateData[0].rawDate);
            d.setMonth(d.getMonth() - 1);
            runOnJS(fetchCalendarData)(d.toISOString().split('T')[0], "prepend");
        }
    };

    const gesture = Gesture.Pan()
        .onUpdate((e) => { position.value = e.translationX; })
        .onEnd((e) => {
            const THRESH = 50;
            if (e.translationX < -THRESH && currentIndex.value < dateData.length - 1) {
                position.value = withTiming(-width, { duration: 200 }, () => runOnJS(onFinishSwipe)(currentIndex.value + 1));
            } else if (e.translationX > THRESH && currentIndex.value > 0) {
                position.value = withTiming(width, { duration: 200 }, () => runOnJS(onFinishSwipe)(currentIndex.value - 1));
            } else {
                position.value = withTiming(0, { duration: 200 });
            }
        });

    const styleWrap = useAnimatedStyle(() => ({
        transform: [{ translateX: Math.round(-width * currentIndex.value + position.value) }],
    }));

    if (isInitialLoading) return (
        <View style={styles.center}>
            <ActivityIndicator size="large" color="red" />
            <Text style={{ marginTop: 10 }}>Đang tải lịch Công giáo...</Text>
        </View>
    );

    return (
        <GestureDetector gesture={gesture}>
            <View style={styles.container}>
                <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
                <Animated.View style={[styles.wrap, { width: width * dateData.length }, styleWrap]}>
                    {dateData.map((item) => (
                        <Slot key={item.rawDate} item={item} />
                    ))}
                </Animated.View>
            </View>
        </GestureDetector>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#000", overflow: "hidden" },
    center: { flex: 1, justifyContent: "center", alignItems: "center" },
    wrap: { flexDirection: "row", height: "100%" },
    slot: { width, height: "100%" },
    contentWrapper: { flex: 1, alignItems: "center", justifyContent: "space-between", paddingVertical: 40 },
    dateHeader: { alignItems: "center", padding: 20, backgroundColor: "rgba(255,255,255,0.85)", borderRadius: 20, width: "85%" },
    dayOfWeekText: { fontSize: 24, fontWeight: "600", color: "#333" },
    dateText: { fontSize: 100, fontWeight: "900", lineHeight: 110, color: "#000" },
    monthYearText: { fontSize: 18, color: "#555" },
    infoContainer: { width: "90%", backgroundColor: "rgba(255,255,255,0.85)", padding: 20, borderRadius: 20, alignItems: "center" },
    leText: { fontSize: 20, fontWeight: "bold", textAlign: "center", color: "#CC0000", marginBottom: 10 },
    mauAoContainer: { alignItems: 'center', marginBottom: 10 },
    aoImage: { width: 50, height: 50 },
    mauAoText: { fontSize: 12, color: '#666', marginTop: 4 },
    textBlock: { width: "100%", marginTop: 8 },
    label: { fontSize: 14, fontWeight: "700", color: "#444" },
    detailText: { fontSize: 16, textAlign: "center", fontStyle: "italic", color: "#222" },
});