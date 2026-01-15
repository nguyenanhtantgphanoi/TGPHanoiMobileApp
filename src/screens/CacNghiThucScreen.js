import axios from "axios";
import React, { use, useEffect, useState } from "react";
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    ScrollView,
} from "react-native";


// Chưa có tgian sửa lại tên hàm :v
export default function CacNghiThucScreen({ navigation }) {
    const [listKinhNguyen, setListKinhNguyen] = useState([])
    useEffect(() => {
        const getListKinhnguyen = async () => {
            try {
                const response = await axios.get('https://service-tgphn.lamgs.io.vn/get-nghi-thuc');
                const data = response.data;
                setListKinhNguyen(data)
            } catch (error) {
                console.log("Có lỗi khi get list nghi thức: ", error)
            }
        }
        getListKinhnguyen()
    }, []);
    return (
        <View style={styles.container}>
            <Text style={styles.header}>Các nghi thức</Text>
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
