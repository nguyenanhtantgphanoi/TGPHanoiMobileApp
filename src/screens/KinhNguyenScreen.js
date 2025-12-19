import { StyleSheet, Text, View, TouchableOpacity } from "react-native";
import React from "react";

export default function KinhNguyenScreen({ navigation }) {
    return (
        <View style={styles.container}>
            <Text style={styles.header}>Kinh nguyện</Text>

            <TouchableOpacity
                style={styles.item}
                onPress={() => navigation.navigate("KinhCacThanhTuDao")}
            >
                <Text style={styles.itemText}>
                    Kính các thánh tử đạo quê hương TGP Hà Nội
                </Text>
            </TouchableOpacity>
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
        marginBottom: 24,
        color: "black",
    },
    item: {
        marginHorizontal: 20,
        padding: 16,
        borderRadius: 12,
        backgroundColor: "#f5f5f5",
    },
    itemText: {
        fontSize: 16,
        fontWeight: "600",
    },
});
