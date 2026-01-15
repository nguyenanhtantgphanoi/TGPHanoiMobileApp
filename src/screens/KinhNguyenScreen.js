import axios from "axios";
import React, { use, useEffect, useState } from "react";
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    ScrollView,
} from "react-native";

export default function KinhNguyenScreen({ navigation }) {
    const [listKinhNguyen, setListKinhNguyen] = useState([])
    useEffect(() => {
        const getListKinhnguyen = async () => {
            try {
                const response = await axios.get('https://service-tgphn.lamgs.io.vn/get-kinh-nguyen');
                const data = response.data;
                setListKinhNguyen(data)
            } catch (error) {
                console.log("Có lỗi khi get list kinh nguyện: ", error)
            }
        }
        getListKinhnguyen()
    }, []);
    return (
        <View style={styles.container}>
            <Text style={styles.header}>Kinh nguyện</Text>
            <ScrollView
                contentContainerStyle={styles.list}
                showsVerticalScrollIndicator={false}
            >
                {
                    listKinhNguyen.map((kinhnguyen) => (
                        <TouchableOpacity
                            key={kinhnguyen._id}
                            style={styles.card}
                            onPress={() =>
                                navigation.navigate("ChiTietKinh", {
                                    title: kinhnguyen.title,
                                    // contentId: kinhnguyen.id,
                                    type: null,
                                    html: kinhnguyen.html
                                })
                            }
                        >
                            <View style={styles.cardContent}>
                                <Text style={styles.cardTitle}>
                                    {kinhnguyen.title}
                                </Text>
                                <Text style={styles.arrow}>›</Text>
                            </View>
                        </TouchableOpacity>
                    ))
                }

                {/* <TouchableOpacity style={styles.card} onPress={() => navigation.navigate("ChiTietKinh", { title: "Các kinh đọc sáng tối ngày thường và Chúa Nhật", contentId: null, type: 1 })}>
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
                </TouchableOpacity> */}
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
