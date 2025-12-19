import React from "react";
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    ScrollView,
} from "react-native";

export default function KinhNguyenScreen({ navigation }) {
    return (
        <View style={styles.container}>
            {/* Header */}
            <Text style={styles.header}>Kinh nguyện</Text>

            {/* Scrollable content */}
            <ScrollView
                contentContainerStyle={styles.list}
                showsVerticalScrollIndicator={false}
            >
                <TouchableOpacity
                    style={styles.card}
                    onPress={() => navigation.navigate("KinhCacThanhTuDao")}
                >
                    <View style={styles.cardContent}>
                        <Text style={styles.cardTitle}>
                            Kinh kính các thánh tử đạo quê hương TGP Hà Nội
                        </Text>
                        <Text style={styles.arrow}>›</Text>
                    </View>
                </TouchableOpacity>

                <TouchableOpacity style={styles.card} onPress={() => navigation.navigate("ChiTietKinh", { title: "Các kinh đọc sáng tối ngày thường và Chúa Nhật", contentId: null, type: 1 })}>
                    <View style={styles.cardContent}>
                        <Text style={styles.cardTitle}>
                            Các kinh đọc sáng tối ngày thường và Chúa Nhật
                        </Text>
                        <Text style={styles.arrow}>›</Text>
                    </View>
                </TouchableOpacity>

                <TouchableOpacity style={styles.card} onPress={() => navigation.navigate("ChiTietKinh", { title: "Các kinh cầu", contentId: null, type: 2 })}>
                    <View style={styles.cardContent}>
                        <Text style={styles.cardTitle}>Các kinh cầu</Text>
                        <Text style={styles.arrow}>›</Text>
                    </View>
                </TouchableOpacity>

                <TouchableOpacity style={styles.card} onPress={() => navigation.navigate("ChiTietKinh", { title: "Ngắm các phép lần hạt", contentId: null, type: 3 })}>
                    <View style={styles.cardContent}>
                        <Text style={styles.cardTitle}>
                            Ngắm các phép lần hạt
                        </Text>
                        <Text style={styles.arrow}>›</Text>
                    </View>
                </TouchableOpacity>

                <TouchableOpacity style={styles.card} onPress={() => navigation.navigate("ChiTietKinh", { title: "Kinh dâng lễ, những kinh dọn mình chịu lễ và những kinh cám ơn", contentId: null, type: 4 })}>
                    <View style={styles.cardContent}>
                        <Text style={styles.cardTitle}>
                            Kinh dâng lễ, những kinh dọn mình chịu lễ và những kinh cám ơn
                        </Text>
                        <Text style={styles.arrow}>›</Text>
                    </View>
                </TouchableOpacity>

                <TouchableOpacity style={styles.card} onPress={() => navigation.navigate("ChiTietKinh", { title: "Kinh ngắm Đàng Thánh Giá và ít nhiều kinh khác", contentId: null, type: 5 })}>
                    <View style={styles.cardContent}>
                        <Text style={styles.cardTitle}>
                            Kinh ngắm Đàng Thánh Giá và ít nhiều kinh khác
                        </Text>
                        <Text style={styles.arrow}>›</Text>
                    </View>
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
}
const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingTop: 60,
        backgroundColor: "#fff",
    },

    header: {
        fontSize: 28,
        fontWeight: "bold",
        paddingHorizontal: 20,
        marginBottom: 16,
        color: "#000",
    },

    list: {
        paddingBottom: 32,
    },

    card: {
        marginHorizontal: 20,
        marginBottom: 12,
        backgroundColor: "#f7f7f7",
        borderRadius: 14,
        paddingVertical: 16,
        paddingHorizontal: 16,
    },

    cardContent: {
        flexDirection: "row",
        alignItems: "center",
    },

    cardTitle: {
        flex: 1,
        fontSize: 16,
        fontWeight: "600",
        color: "#222",
        lineHeight: 22,
    },

    arrow: {
        fontSize: 22,
        color: "#999",
        marginLeft: 12,
    },
});
