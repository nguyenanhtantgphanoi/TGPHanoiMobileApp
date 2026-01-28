import React, { useMemo, memo, useState, useEffect } from "react";
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
    useWindowDimensions,
    TextInput,
    KeyboardAvoidingView,
    Platform,
    Alert,
} from "react-native";
import PagerView from "react-native-pager-view";
import RenderHTML from "react-native-render-html";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Ionicons } from "@expo/vector-icons";

const { width, height } = Dimensions.get("window");
const NOTES_KEY = "@kinh_user_notes_v6";
const ITEM_HEIGHT = 40;

const mapColor = (colorName) => {
    switch (colorName) {
        case "Tím":
            return "#8e44ad";
        case "Trắng":
            return "#ecf0f1";
        case "Đỏ":
            return "#e74c3c";
        case "Xanh":
            return "#27ae60";
        case "Vàng":
            return "#f1c40f";
        case "Hồng":
            return "#ff9ff3";
        default:
            return "transparent";
    }
};

const VerticalWheel = ({ data, selectedValue, onValueChange }) => {
    const initialIdx = data.indexOf(selectedValue);
    return (
        <View style={styles.wheelWrapper}>
            <FlatList
                data={["", ...data, ""]}
                keyExtractor={(item, index) => `wheel-${item}-${index}`}
                showsVerticalScrollIndicator={false}
                snapToInterval={ITEM_HEIGHT}
                decelerationRate="fast"
                initialScrollIndex={initialIdx > 0 ? initialIdx : 0}
                getItemLayout={(_, index) => ({
                    length: ITEM_HEIGHT,
                    offset: ITEM_HEIGHT * index,
                    index,
                })}
                onMomentumScrollEnd={(e) => {
                    const index = Math.round(e.nativeEvent.contentOffset.y / ITEM_HEIGHT);
                    if (data[index]) onValueChange(data[index]);
                }}
                renderItem={({ item }) => (
                    <View style={styles.wheelItem}>
                        <Text
                            style={[
                                styles.wheelItemTxt,
                                item === selectedValue && styles.wheelItemTxtActive,
                            ]}
                        >
                            {item}
                        </Text>
                    </View>
                )}
            />
            <View style={styles.wheelHighlight} pointerEvents="none" />
        </View>
    );
};

const MonthCell = memo(
    ({ item, isToday, isClicked, dayInfo, onPress, hasNote }) => {
        if (!item) return <View style={styles.cellWrapper} />;
        const dotColor = dayInfo ? mapColor(dayInfo.mau_ao_le) : "transparent";
        const isTrong = dayInfo?.bac_le === "Trọng";
        const isSunday = item.date.getDay() === 0;
        return (
            <View style={styles.cellWrapper}>
                <TouchableOpacity
                    activeOpacity={0.7}
                    style={[
                        styles.dayCell,
                        isToday && styles.todayCell,
                        isTrong && styles.cellLeTrong,
                        isClicked && styles.clickedCell,
                    ]}
                    onPress={() => onPress(item.date)}
                >
                    <Text
                        style={[
                            styles.dayCellText,
                            isSunday && { color: "#c0392b" },
                            isTrong && { fontWeight: "bold" },
                        ]}
                    >
                        {item.day}
                    </Text>
                    {hasNote && <View style={styles.noteIndicator} />}
                    <View
                        style={[
                            styles.dotMauAo,
                            {
                                backgroundColor: dotColor,
                                borderColor: dotColor === "#ecf0f1" ? "#bdc3c7" : "transparent",
                                borderWidth: dotColor === "#ecf0f1" ? 0.5 : 0,
                            },
                        ]}
                    />
                </TouchableOpacity>
            </View>
        );
    },
);

const MonthGrid = memo(
    ({ month, year, clickedDate, yearData, onDayPress, notes }) => {
        const grid = useMemo(() => {
            const daysInMonth = new Date(year, month + 1, 0).getDate();
            const firstDay = new Date(year, month, 1).getDay();
            const cells = [];
            for (let i = 0; i < firstDay; i++) cells.push(null);
            for (let d = 1; d <= daysInMonth; d++)
                cells.push({ day: d, date: new Date(year, month, d) });
            return cells;
        }, [month, year]);
        return (
            <View style={{ width: "100%" }}>
                <View style={styles.weekHeader}>
                    {["CN", "T2", "T3", "T4", "T5", "T6", "T7"].map((d) => (
                        <Text
                            key={d}
                            style={[styles.weekDay, d === "CN" && { color: "#c0392b" }]}
                        >
                            {d}
                        </Text>
                    ))}
                </View>
                <FlatList
                    data={grid}
                    numColumns={7}
                    scrollEnabled={false}
                    keyExtractor={(_, i) => `g-${month}-${year}-${i}`}
                    renderItem={({ item }) => {
                        const dateKey = item
                            ? `${item.date.getFullYear()}-${String(item.date.getMonth() + 1).padStart(2, "0")}-${String(item.date.getDate()).padStart(2, "0")}`
                            : "";
                        return (
                            <MonthCell
                                item={item}
                                isToday={
                                    item && new Date().toDateString() === item.date.toDateString()
                                }
                                isClicked={
                                    item &&
                                    clickedDate?.toDateString() === item.date.toDateString()
                                }
                                dayInfo={yearData.find((x) => x.date === dateKey)}
                                hasNote={notes[dateKey]?.length > 0}
                                onPress={onDayPress}
                            />
                        );
                    }}
                />
            </View>
        );
    },
);

const MonthCalendarModal = ({
    visible,
    onClose,
    insets,
    GENERATED_MONTHS,
    monthPagerIndex,
    setMonthPagerIndex,
    clickedDate,
    setClickedDate,
    yearData,
    fullDayData,
    loadingDay,
    fontScale,
    setFontScale,
    darkMode,
    setDarkMode,
}) => {
    const [activeLeIdx, setActiveLeIdx] = useState(0);
    const [detailVisible, setDetailVisible] = useState(false);
    const [selectedLe, setSelectedLe] = useState(null);
    const { width: contentWidth } = useWindowDimensions();
    const [notes, setNotes] = useState({});
    const [viewMode, setViewMode] = useState("INFO");
    const [isNoteEditVisible, setNoteEditVisible] = useState(false);
    const [noteInput, setNoteInput] = useState("");
    const [selHour, setSelHour] = useState("05");
    const [selMinute, setSelMinute] = useState("00");
    const [editingId, setEditingId] = useState(null);
    const [pagerHeight, setPagerHeight] = useState(120);

    // Khởi tạo notifications khi component mount
    useEffect(() => {
        if (visible) {
            loadNotes();
            checkAndRequestPermissions();

            // KIỂM TRA VÀ RESCHEDULE NOTIFICATIONS KHI MỞ APP
            checkAndRescheduleAllNotifications();
        }
    }, [visible]);

    // Kiểm tra và yêu cầu quyền notifications
    const checkAndRequestPermissions = async () => {
        if (!Device.isDevice) return;

        const { status: existingStatus } =
            await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== "granted") {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }

        if (finalStatus !== "granted") {
            console.log("Chưa cấp quyền thông báo");
        }
    };

    const loadNotes = async () => {
        const saved = await AsyncStorage.getItem(NOTES_KEY);
        if (saved) setNotes(JSON.parse(saved));
    };

    const currentDateKey = clickedDate
        ? `${clickedDate.getFullYear()}-${String(clickedDate.getMonth() + 1).padStart(2, "0")}-${String(clickedDate.getDate()).padStart(2, "0")}`
        : "";

    // HÀM CHÍNH: Schedule notification cho 18:31 ngày hôm trước sự kiện
    const scheduleNotificationForEvent = async (eventDate, eventCount) => {
        try {
            // Tạo thời điểm thông báo: 18:31 ngày hôm trước
            const notificationTime = new Date(eventDate);
            notificationTime.setDate(notificationTime.getDate() - 1); // Ngày hôm trước
            notificationTime.setHours(21, 0, 0, 0);

            // Kiểm tra nếu thời gian trong quá khứ thì không schedule
            if (notificationTime <= new Date()) {
                console.log("Thời gian thông báo đã qua, không schedule");
                return null;
            }

            // Tạo ID duy nhất cho notification (dùng date làm key)
            const notificationId = `event_${eventDate.getFullYear()}_${eventDate.getMonth() + 1}_${eventDate.getDate()}`;

            // Schedule notification
            await Notifications.scheduleNotificationAsync({
                content: {
                    title: "Sự kiện ngày mai",
                    body: `Bạn có ${eventCount} sự kiện vào ngày mai`,
                    data: {
                        type: "daily_reminder",
                        date: eventDate.toISOString(),
                        dateKey: `${eventDate.getFullYear()}-${String(eventDate.getMonth() + 1).padStart(2, "0")}-${String(eventDate.getDate()).padStart(2, "0")}`,
                        count: eventCount,
                    },
                    sound: true,
                    priority: Notifications.AndroidNotificationPriority.HIGH,
                },
                trigger: {
                    type: "date",
                    date: notificationTime,
                },
            });

            console.log(
                `✅ Đã lên lịch thông báo cho ngày ${eventDate.toLocaleDateString("vi-VN")} lúc 18:31`,
            );
            console.log(
                `   Thông báo vào: ${notificationTime.toLocaleString("vi-VN")}`,
            );
            return notificationId;
        } catch (error) {
            console.error("❌ Lỗi schedule notification:", error);
            return null;
        }
    };

    // Hàm kiểm tra và schedule notification khi có sự kiện mới
    const checkAndScheduleNotifications = async (updatedNotes) => {
        try {
            console.log("🔄 Bắt đầu kiểm tra và schedule notifications...");

            // Lấy tất cả notification đã schedule để tránh trùng lặp
            const existingNotifications =
                await Notifications.getAllScheduledNotificationsAsync();
            console.log(
                `📋 Có ${existingNotifications.length} notifications đang chờ`,
            );

            // Duyệt qua tất cả các ngày có sự kiện
            Object.keys(updatedNotes).forEach((dateKey) => {
                const eventCount = updatedNotes[dateKey].length;
                if (eventCount > 0) {
                    // Parse date từ key
                    const [year, month, day] = dateKey.split("-").map(Number);
                    const eventDate = new Date(year, month - 1, day);

                    // Kiểm tra nếu đã có notification cho ngày này chưa
                    const alreadyScheduled = existingNotifications.some(
                        (notif) => notif.content.data?.dateKey === dateKey,
                    );

                    if (!alreadyScheduled) {
                        console.log(
                            `Schedule notification cho ngày ${dateKey} (${eventCount} sự kiện)`,
                        );
                        scheduleNotificationForEvent(eventDate, eventCount);
                    } else {
                        console.log(`Đã có notification cho ngày ${dateKey}, bỏ qua`);
                    }
                }
            });

            console.log("✅ Hoàn thành kiểm tra notifications");
        } catch (error) {
            console.error("Lỗi kiểm tra notifications:", error);
        }
    };

    // Hàm reschedule tất cả notifications (khi mở app)
    const checkAndRescheduleAllNotifications = async () => {
        try {
            console.log("Kiểm tra và reschedule tất cả notifications...");

            // Load notes từ AsyncStorage
            const savedNotes = await AsyncStorage.getItem(NOTES_KEY);
            if (!savedNotes) return;

            const notesData = JSON.parse(savedNotes);

            // Xóa tất cả notifications cũ
            await Notifications.cancelAllScheduledNotificationsAsync();
            console.log("Đã xóa tất cả notifications cũ");

            // Schedule lại notifications mới
            await checkAndScheduleNotifications(notesData);

            console.log("✅ Đã reschedule tất cả notifications");
        } catch (error) {
            console.error("Lỗi reschedule notifications:", error);
        }
    };

    // Hàm xóa notification khi xóa hết sự kiện của một ngày
    const removeNotificationForDate = async (dateKey) => {
        try {
            const scheduledNotifications =
                await Notifications.getAllScheduledNotificationsAsync();

            // Tìm notification cho dateKey này
            const notificationToRemove = scheduledNotifications.find(
                (notif) => notif.content.data?.dateKey === dateKey,
            );

            if (notificationToRemove) {
                // Tìm ID của notification (trong data hoặc dùng trigger date)
                // Expo không cung cấp ID trực tiếp, nên cần cancel bằng cách khác
                // Ở đây chúng ta sẽ cancel all và reschedule lại (đơn giản nhất)
                await checkAndRescheduleAllNotifications();
                console.log(`🗑️ Đã xóa notification cho ngày ${dateKey}`);
            }
        } catch (error) {
            console.error("Lỗi xóa notification:", error);
        }
    };

    const saveEvent = async () => {
        if (!noteInput.trim()) {
            Alert.alert("Lỗi", "Vui lòng nhập nội dung sự kiện");
            return;
        }

        try {
            const newNotes = { ...notes };
            const dayEvents = newNotes[currentDateKey] || [];
            const newEv = {
                id: editingId || Date.now().toString(),
                text: noteInput,
                time: `${selHour}:${selMinute}`,
            };

            if (editingId) {
                newNotes[currentDateKey] = dayEvents.map((e) =>
                    e.id === editingId ? newEv : e,
                );
            } else {
                newNotes[currentDateKey] = [...dayEvents, newEv].sort((a, b) =>
                    a.time.localeCompare(b.time),
                );
            }

            setNotes(newNotes);
            await AsyncStorage.setItem(NOTES_KEY, JSON.stringify(newNotes));

            // Sau khi lưu sự kiện, kiểm tra và schedule notification
            await checkAndScheduleNotifications(newNotes);

            setNoteEditVisible(false);
            setEditingId(null);
            setNoteInput("");
            setSelHour("05");
            setSelMinute("00");

            Alert.alert(
                "Thành công",
                editingId ? "Đã cập nhật sự kiện" : "Đã thêm sự kiện mới",
            );
        } catch (error) {
            console.error("Lỗi lưu sự kiện:", error);
            Alert.alert("Lỗi", "Không thể lưu sự kiện");
        }
    };

    const deleteEvent = (id) => {
        Alert.alert("Xóa sự kiện", "Bạn có chắc chắn?", [
            { text: "Hủy" },
            {
                text: "Xóa",
                style: "destructive",
                onPress: async () => {
                    try {
                        const newNotes = { ...notes };
                        newNotes[currentDateKey] = newNotes[currentDateKey].filter(
                            (e) => e.id !== id,
                        );

                        // Kiểm tra nếu ngày này không còn sự kiện nào
                        if (newNotes[currentDateKey].length === 0) {
                            // Xóa notification cho ngày này
                            await removeNotificationForDate(currentDateKey);
                            delete newNotes[currentDateKey];
                        }

                        setNotes(newNotes);
                        await AsyncStorage.setItem(NOTES_KEY, JSON.stringify(newNotes));

                        // Cập nhật notifications sau khi xóa
                        await checkAndScheduleNotifications(newNotes);

                        Alert.alert("Thành công", "Đã xóa sự kiện");
                    } catch (error) {
                        console.error("Lỗi xóa sự kiện:", error);
                        Alert.alert("Lỗi", "Không thể xóa sự kiện");
                    }
                },
            },
        ]);
    };

    const listLe = useMemo(() => {
        if (!fullDayData) return [];
        const arr = fullDayData.arr_cac_le || [];
        if (arr.length === 0) return [fullDayData];
        return arr.map((le, index) =>
            index === 0
                ? {
                    ...le,
                    bd_1: fullDayData.bd_1 || le.bd_1,
                    bd_2: fullDayData.bd_2 || le.bd_2,
                    tin_mung: fullDayData.tin_mung || le.tin_mung,
                }
                : le,
        );
    }, [fullDayData]);

    const modalColors = useMemo(
        () => ({
            bg: darkMode ? "#121212" : "#FFFFFF",
            text: darkMode ? "#EAEAEA" : "#000000",
            title: darkMode ? "#FFB3B3" : "#c0392b",
            controlBg: darkMode ? "#1E1E1E" : "#F4F4F4",
            border: darkMode ? "#333" : "#DDD",
        }),
        [darkMode],
    );

    const tagsStyles = useMemo(
        () => ({
            body: {
                color: modalColors.text,
                fontSize: 17 * fontScale,
                lineHeight: 28 * fontScale,
            },
            p: {
                marginBottom: 10,
                color: modalColors.text,
                fontSize: 17 * fontScale,
                textAlign: "justify",

            },
            strong: { fontWeight: "bold", color: modalColors.text },
            em: { fontStyle: "italic", color: modalColors.text },
        }),
        [fontScale, modalColors],
    );

    const hoursData = Array.from({ length: 24 }, (_, i) =>
        String(i).padStart(2, "0"),
    );
    const minutesData = Array.from({ length: 60 }, (_, i) =>
        String(i).padStart(2, "0"),
    );

    const openReading = (le) => {
        setSelectedLe(le);
        setDetailVisible(true);
    };

    return (
        <Modal animationType="slide" visible={visible}>
            <View style={[styles.fullModal, { paddingTop: insets.top }]}>
                <View style={styles.monthHeaderRow}>
                    <TouchableOpacity onPress={onClose}>
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
                            <View key={`m-${index}`} style={{ paddingHorizontal: 10 }}>
                                <Text style={styles.monthLabel}>
                                    Tháng {m.month + 1} - {m.year}
                                </Text>
                                <MonthGrid
                                    month={m.month}
                                    year={m.year}
                                    clickedDate={clickedDate}
                                    yearData={yearData}
                                    notes={notes}
                                    onDayPress={(d) => {
                                        setActiveLeIdx(0);
                                        setClickedDate(d);
                                    }}
                                />
                            </View>
                        ))}
                    </PagerView>
                </View>

                <View style={styles.infoBox}>
                    {/* KHU VỰC SWITCH - ĐÃ FIX MỜ */}
                    <View style={styles.switchContainer}>
                        <TouchableOpacity
                            activeOpacity={1}
                            style={[
                                styles.switchBtn,
                                viewMode === "INFO" && styles.switchBtnActive,
                            ]}
                            onPress={() => setViewMode("INFO")}
                        >
                            <Text
                                style={[
                                    styles.switchText,
                                    viewMode === "INFO" && styles.switchTextActive,
                                ]}
                            >
                                Thông tin Lễ
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            activeOpacity={1}
                            style={[
                                styles.switchBtn,
                                viewMode === "NOTE" && styles.switchBtnActive,
                            ]}
                            onPress={() => setViewMode("NOTE")}
                        >
                            <Text
                                style={[
                                    styles.switchText,
                                    viewMode === "NOTE" && styles.switchTextActive,
                                ]}
                            >
                                Sự kiện của bạn ({notes[currentDateKey]?.length || 0})
                            </Text>
                        </TouchableOpacity>
                    </View>

                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{ flexGrow: 1 }}
                    >
                        {loadingDay ? (
                            <ActivityIndicator
                                size="large"
                                color="#c0392b"
                                style={{ marginTop: 20 }}
                            />
                        ) : viewMode === "INFO" ? (
                            <View style={{ opacity: 1 }}>
                                <View style={{ height: 60, overflow: "hidden" }}>
                                    <PagerView
                                        key={`pager-${currentDateKey}-${listLe.length}`} // Key động để force render không bị mờ
                                        style={{ flex: 1 }}
                                        initialPage={0}
                                        onPageSelected={(e) =>
                                            setActiveLeIdx(e.nativeEvent.position)
                                        }
                                    >
                                        {listLe.map((le, idx) => (
                                            <TouchableOpacity
                                                key={`le-${idx}`}
                                                activeOpacity={0.7}
                                                delayPressIn={150} // Tăng delay để vuốt mượt hơn
                                                onPress={() => openReading(le)}
                                                onLayout={(e) => {
                                                    const { height: lh } = e.nativeEvent.layout;
                                                    if (idx === activeLeIdx && lh > 0) setPagerHeight(lh);
                                                }}
                                                style={{ alignItems: "center" }}
                                            >
                                                <Text style={styles.infoTextSub}>{le.title}</Text>
                                                <Text style={styles.summaryText}>
                                                    {le.ban_van?.bd1_le_trich_tu
                                                        ? `${le.ban_van.bd1_le_trich_tu}; `
                                                        : ""}
                                                    {le.ban_van?.bd2_trich_tu
                                                        ? `${le.ban_van.bd2_trich_tu};`
                                                        : ""}
                                                    {le.ban_van?.phuc_am_trich_tu
                                                        ? `${le.ban_van?.phuc_am_trich_tu}`
                                                        : ""}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </PagerView>
                                </View>

                                <TouchableOpacity
                                    activeOpacity={0.7}
                                    onPress={() => openReading(listLe[activeLeIdx])}
                                    style={{ alignItems: "center" }}
                                >
                                    {listLe.length > 1 && (
                                        <View style={styles.dotsContainer}>
                                            {listLe.map((_, i) => (
                                                <View
                                                    key={`d-${i}`}
                                                    style={[
                                                        styles.dot,
                                                        activeLeIdx === i
                                                            ? styles.activeDot
                                                            : styles.inactiveDot,
                                                    ]}
                                                />
                                            ))}
                                        </View>
                                    )}
                                    <Text style={styles.underTitle}>
                                        {fullDayData?.under_title}
                                    </Text>
                                    {fullDayData?.xu_chau_luot && (
                                        <View style={styles.chauLuotContainer}>
                                            <Text style={styles.chauLuotTitle}>⛪ Chầu lượt:</Text>
                                            <Text style={styles.chauLuotText}>
                                                {fullDayData.xu_chau_luot.trim()} Chầu Mình Thánh
                                            </Text>
                                        </View>
                                    )}
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <View style={styles.noteArea}>
                                {notes[currentDateKey]?.map((item) => (
                                    <TouchableOpacity
                                        key={item.id}
                                        style={styles.noteCard}
                                        onPress={() => {
                                            setEditingId(item.id);
                                            setNoteInput(item.text);
                                            const [h, m] = item.time.split(":");
                                            setSelHour(h);
                                            setSelMinute(m);
                                            setNoteEditVisible(true);
                                        }}
                                    >
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.noteTime}>⏰ {item.time}</Text>
                                            <Text style={styles.noteText}>{item.text}</Text>
                                        </View>
                                        <View style={styles.noteActionCol}>
                                            <TouchableOpacity onPress={() => deleteEvent(item.id)}>
                                                <Ionicons
                                                    name="trash-outline"
                                                    size={20}
                                                    color="#ff4d4d"
                                                />
                                            </TouchableOpacity>
                                        </View>
                                    </TouchableOpacity>
                                ))}
                                <TouchableOpacity
                                    style={styles.addBtn}
                                    onPress={() => {
                                        setEditingId(null);
                                        setNoteInput("");
                                        setSelHour("05");
                                        setSelMinute("00");
                                        setNoteEditVisible(true);
                                    }}
                                >
                                    <Text style={styles.addBtnTxt}>+ Thêm sự kiện</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                        <View style={{ height: 50 }} />
                    </ScrollView>
                </View>

                {/* MODAL CHI TIẾT */}
                <Modal animationType="slide" visible={detailVisible}>
                    <View
                        style={[
                            styles.detailModal,
                            { paddingTop: insets.top, backgroundColor: modalColors.bg },
                        ]}
                    >
                        <StatusBar barStyle={darkMode ? "light-content" : "dark-content"} />
                        <View
                            style={[
                                styles.detailHeader,
                                {
                                    backgroundColor: modalColors.controlBg,
                                    borderBottomColor: modalColors.border,
                                },
                            ]}
                        >
                            <View style={{ flexDirection: "row", alignItems: "center" }}>
                                <TouchableOpacity
                                    onPress={() =>
                                        setFontScale((prev) => Math.max(0.8, prev - 0.1))
                                    }
                                >
                                    <Text style={{ color: modalColors.text, padding: 10 }}>
                                        A-
                                    </Text>
                                </TouchableOpacity>
                                <Text style={{ color: modalColors.text }}>
                                    {Math.round(fontScale * 100)}%
                                </Text>
                                <TouchableOpacity
                                    onPress={() =>
                                        setFontScale((prev) => Math.min(1.8, prev + 0.1))
                                    }
                                >
                                    <Text style={{ color: modalColors.text, padding: 10 }}>
                                        A+
                                    </Text>
                                </TouchableOpacity>
                            </View>
                            <TouchableOpacity onPress={() => setDarkMode(!darkMode)}>
                                <Text style={{ fontSize: 18 }}>{darkMode ? "🌙" : "☀️"}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => setDetailVisible(false)}>
                                <Text style={{ color: modalColors.title, fontWeight: "bold" }}>
                                    ✕ Đóng
                                </Text>
                            </TouchableOpacity>
                        </View>
                        <ScrollView contentContainerStyle={{ padding: 20 }}>
                            {selectedLe?.ban_van ? (
                                <>
                                    {selectedLe.ban_van.bd1_le && (
                                        <>
                                            <Text
                                                style={[styles.secTitle, { color: modalColors.title }]}
                                            >
                                                Bài đọc I: {selectedLe.ban_van.bd1_le_trich_tu}
                                            </Text>
                                            <RenderHTML
                                                contentWidth={contentWidth}
                                                source={{ html: selectedLe.ban_van.bd1_le }}
                                                tagsStyles={tagsStyles}
                                            />
                                        </>
                                    )}
                                    {selectedLe.ban_van.dap_ca_le && (
                                        <>
                                            <Text
                                                style={[styles.secTitle, { color: modalColors.title }]}
                                            >
                                                Đáp ca: {selectedLe.ban_van.dap_ca_le_trich_tu}
                                            </Text>
                                            <RenderHTML
                                                contentWidth={contentWidth}
                                                source={{ html: selectedLe.ban_van.dap_ca_le }}
                                                tagsStyles={tagsStyles}
                                            />
                                        </>
                                    )}
                                    {selectedLe.ban_van.bd2 && (
                                        <>
                                            <Text
                                                style={[styles.secTitle, { color: modalColors.title }]}
                                            >
                                                Bài đọc II: {selectedLe.ban_van.bd2_trich_tu}
                                            </Text>
                                            <RenderHTML
                                                contentWidth={contentWidth}
                                                source={{ html: selectedLe.ban_van.bd2 }}
                                                tagsStyles={tagsStyles}
                                            />
                                        </>
                                    )}
                                    {selectedLe.ban_van.phuc_am && (
                                        <>
                                            <Text
                                                style={[styles.secTitle, { color: modalColors.title }]}
                                            >
                                                Phúc âm
                                            </Text>
                                            <RenderHTML
                                                contentWidth={contentWidth}
                                                source={{ html: selectedLe.ban_van.phuc_am }}
                                                tagsStyles={tagsStyles}
                                            />
                                        </>
                                    )}
                                </>
                            ) : (
                                <Text style={{ color: modalColors.text, textAlign: "center" }}>
                                    Đang cập nhật nội dung...
                                </Text>
                            )}
                        </ScrollView>
                    </View>
                </Modal>

                <Modal visible={isNoteEditVisible} transparent animationType="slide">
                    <KeyboardAvoidingView behavior="padding" style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                            <Text style={styles.modalTitle}>
                                {editingId ? "Sửa" : "Thêm"} sự kiện {clickedDate?.getDate()}/
                                {clickedDate?.getMonth() + 1}
                            </Text>
                            <View style={styles.wheelContainer}>
                                <VerticalWheel
                                    data={hoursData}
                                    selectedValue={selHour}
                                    onValueChange={setSelHour}
                                />
                                <Text style={styles.wheelSep}>:</Text>
                                <VerticalWheel
                                    data={minutesData}
                                    selectedValue={selMinute}
                                    onValueChange={setSelMinute}
                                />
                            </View>
                            <TextInput
                                style={styles.input}
                                placeholder="Nội dung sự kiện..."
                                value={noteInput}
                                onChangeText={setNoteInput}
                                multiline
                            />
                            <View style={styles.modalButtons}>
                                <TouchableOpacity
                                    onPress={() => setNoteEditVisible(false)}
                                    style={styles.btnCancel}
                                >
                                    <Text>Hủy</Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={saveEvent} style={styles.btnSave}>
                                    <Text style={{ color: "#fff", fontWeight: "bold" }}>Lưu</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </KeyboardAvoidingView>
                </Modal>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    fullModal: { flex: 1, backgroundColor: "#fff" },
    monthHeaderRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: 10,
        borderBottomWidth: 0.5,
        borderBottomColor: "#eee",
    },
    closeBtnTxt: { fontSize: 16, color: "#2980b9", fontWeight: "bold" },
    headerTitle: { fontSize: 18, fontWeight: "bold" },
    calendarContainer: { height: height * 0.42 },
    monthLabel: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#c0392b",
        textAlign: "center",
        marginVertical: 8,
    },
    weekHeader: { flexDirection: "row", paddingVertical: 5 },
    weekDay: {
        flex: 1,
        textAlign: "center",
        fontWeight: "bold",
        fontSize: 13,
        color: "#7f8c8d",
    },
    cellWrapper: {
        flex: 1 / 7,
        aspectRatio: 1,
        alignItems: "center",
        justifyContent: "center",
    },
    dayCell: {
        width: "85%",
        height: "85%",
        alignItems: "center",
        justifyContent: "center",
    },
    dayCellText: { fontSize: 16 },
    todayCell: {
        backgroundColor: "#ffecec",
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "#c0392b",
    },
    clickedCell: {
        backgroundColor: "#e3f2fd",
        borderRadius: 8,
        borderWidth: 1.5,
        borderColor: "#3498db",
    },
    cellLeTrong: { backgroundColor: "#ebdb0569", borderRadius: 8 },
    dotMauAo: {
        width: 4,
        height: 4,
        borderRadius: 2,
        position: "absolute",
        bottom: 4,
    },
    noteIndicator: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: "#f39c12",
        position: "absolute",
        top: 2,
        right: 2,
    },
    infoBox: { flex: 1, paddingHorizontal: 20 },
    switchContainer: {
        flexDirection: "row",
        backgroundColor: "#f1f2f6",
        borderRadius: 10,
        padding: 4,
        marginVertical: 10,
    },
    switchBtn: {
        flex: 1,
        paddingVertical: 8,
        alignItems: "center",
        borderRadius: 8,
    },
    switchBtnActive: { backgroundColor: "#fff" },
    switchText: { fontSize: 14, color: "#7f8c8d" },
    switchTextActive: { color: "#c0392b", fontWeight: "bold" },
    infoTextSub: {
        fontSize: 17,
        color: "#34495e",
        textAlign: "center",
        fontWeight: "bold",
        marginBottom: 5,
    },
    summaryText: {
        textAlign: "center",
        color: "#555",
        fontSize: 14,
        paddingHorizontal: 15,
    },
    dotsContainer: {
        flexDirection: "row",
        justifyContent: "center",
        paddingVertical: 10,
    },
    dot: { width: 6, height: 6, borderRadius: 3, margin: 3 },
    activeDot: { backgroundColor: "#c0392b", width: 12 },
    inactiveDot: { backgroundColor: "#ddd" },
    underTitle: {
        fontSize: 15,
        color: "#555",
        marginTop: 5,
        textAlign: "center",
        lineHeight: 20,
    },
    chauLuotContainer: {
        marginTop: 10,
        backgroundColor: "#f0f7ff",
        padding: 10,
        borderRadius: 10,
        width: "100%",
    },
    chauLuotTitle: { fontSize: 13, fontWeight: "bold", color: "#2980b9" },
    chauLuotText: {
        fontSize: 14,
        color: "#444",
        fontStyle: "italic",
        marginTop: 5,
    },
    noteArea: { marginTop: 5 },
    noteCard: {
        backgroundColor: "#fffcf0",
        borderRadius: 12,
        padding: 12,
        marginBottom: 10,
        flexDirection: "row",
        borderLeftWidth: 4,
        borderLeftColor: "#f1c40f",
    },
    noteTime: { fontWeight: "bold", color: "#7e5109" },
    noteText: { color: "#333", marginTop: 2 },
    noteActionCol: { justifyContent: "space-around", paddingLeft: 10 },
    editBtn: { color: "#2980b9", marginBottom: 5 },
    delBtn: { color: "#e74c3c" },
    addBtn: {
        backgroundColor: "#c0392b",
        padding: 12,
        borderRadius: 10,
        alignItems: "center",
    },
    addBtnTxt: { color: "#fff", fontWeight: "bold" },
    detailModal: { flex: 1 },
    detailHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderBottomWidth: 1,
    },
    secTitle: {
        fontWeight: "bold",
        fontSize: 18,
        marginTop: 20,
        marginBottom: 5,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.5)",
        justifyContent: "center",
        alignItems: "center",
    },
    modalContent: {
        width: "85%",
        backgroundColor: "#fff",
        borderRadius: 20,
        padding: 20,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: "bold",
        textAlign: "center",
        marginBottom: 15,
    },
    wheelContainer: {
        flexDirection: "row",
        height: 120,
        backgroundColor: "#f9f9f9",
        borderRadius: 12,
        marginBottom: 15,
        overflow: "hidden",
    },
    wheelWrapper: { flex: 1, height: 120 },
    wheelItem: {
        height: ITEM_HEIGHT,
        justifyContent: "center",
        alignItems: "center",
    },
    wheelItemTxt: { color: "#bbb" },
    wheelItemTxtActive: { color: "#c0392b", fontWeight: "bold", fontSize: 20 },
    wheelHighlight: {
        position: "absolute",
        top: 40,
        left: 10,
        right: 10,
        height: 40,
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: "#ddd",
    },
    wheelSep: { fontSize: 20, fontWeight: "bold", alignSelf: "center" },
    input: {
        borderWidth: 1,
        borderColor: "#ddd",
        borderRadius: 10,
        padding: 10,
        height: 80,
        textAlignVertical: "top",
    },
    modalButtons: {
        flexDirection: "row",
        justifyContent: "flex-end",
        marginTop: 15,
    },
    btnCancel: { padding: 10, marginRight: 15 },
    btnSave: {
        backgroundColor: "#c0392b",
        padding: 10,
        paddingHorizontal: 20,
        borderRadius: 8,
    },
});

export default memo(MonthCalendarModal);
