import axios from "axios";
import React, { use, useEffect, useState } from "react";
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    ScrollView,
} from "react-native";
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

export default function CacNghiThucScreen({ navigation }) {
    const [listKinhNguyen, setListKinhNguyen] = useState([])
    const [expandedId, setExpandedId] = useState(null)
    
    useEffect(() => {
        const getListKinhnguyen = async () => {
            try {
                const response = await axios.get('https://service-tgphn.lamgs.io.vn/get-nghi-thuc-grouped');
                const data = response.data;
                setListKinhNguyen(data)
                console.log("List nghi thức: ", data)
            } catch (error) {
                console.log("Có lỗi khi get list nghi thức: ", error)
            }
        }
        getListKinhnguyen()
    }, []);

    const toggleExpanded = (id) => {
        setExpandedId(expandedId === id ? null : id)
    };
    return (
        <View style={styles.container}>
            <View style={styles.headerContainer}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <MaterialIcons name="arrow-back" size={24} color="#000" />
                </TouchableOpacity>
                <Text style={styles.header}>Nghi Thức</Text>
            </View>
            <ScrollView
                contentContainerStyle={styles.list}
                showsVerticalScrollIndicator={false}
            >
                {
                    Object.values(listKinhNguyen).map((kinhnguyen) => {
                        const isMultiLevel = kinhnguyen.data && Object.keys(kinhnguyen.data).length > 1;
                        
                        return (
                            <View key={kinhnguyen._id}>
                                <TouchableOpacity
                                    style={styles.card}
                                    onPress={() => {
                                        if (isMultiLevel) {
                                            toggleExpanded(kinhnguyen._id);
                                        } else {
                                            navigation.navigate("ChiTietKinh", {
                                                title: kinhnguyen.data[0].title,
                                                type: null,    
                                                html: kinhnguyen.data[0].html
                                            });
                                        }
                                    }}
                                >
                                    <View style={styles.cardContent}>
                                        <Text style={styles.cardTitle}>
                                            {isMultiLevel ? kinhnguyen.title : kinhnguyen.data[0].title}
                                        </Text>
                                        {isMultiLevel && (
                                            <Text style={[styles.arrow, expandedId === kinhnguyen._id && styles.arrowExpanded]}>
                                                {expandedId === kinhnguyen._id ? '‹' : '›'}
                                            </Text>
                                        )}
                                    </View>
                                </TouchableOpacity>
                                {isMultiLevel && expandedId === kinhnguyen._id && (                                                                    
                                    Object.values(kinhnguyen.data).map((item) => (
                                        <View style={styles.expandedContent} key={item._id}>
                                        <TouchableOpacity 
                                            style={styles.viewDetailsBtn}
                                            onPress={() => 
                                                navigation.navigate("ChiTietKinh", {
                                                    title: item.title,
                                                    type: null,    
                                                    html: item.html
                                                })
                                            }
                                        >
                                            <Text style={styles.viewDetailsBtnText}>{item.title}</Text>
                                        </TouchableOpacity>
                                        </View>
                                    ))                                 
                                )}
                            </View>
                        );
                    })
                }

                
            </ScrollView>
        </View>
    );
}
const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingTop: 60,
        backgroundColor: "#c2850bde",
    },

    headerContainer: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 20,
        marginBottom: 16,
    },

    backButton: {
        padding: 8,
        marginRight: 10,
    },

    header: {
        fontSize: 28,
        fontWeight: "bold",
        color: "#000000ce",
        flex: 1,
    },

    list: {
        paddingBottom: 32,
    },

    card: {
        marginHorizontal: 20,
        marginBottom: 12,
        backgroundColor: "#f7f7f7e1",
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

    arrowExpanded: {
        transform: [{ rotate: '180deg' }],
    },

    expandedContent: {
        marginHorizontal: 20,
        marginBottom: 12,
        backgroundColor: "#ffffffa8",
        borderRadius: 14,
        paddingVertical: 5,
        paddingHorizontal: 10,
        borderLeftWidth: 4,
        borderLeftColor: "#E68619",
    },

    contentText: {
        fontSize: 20,
        color: "#555",
        lineHeight: 40,
        marginBottom: 5,
    },

    viewDetailsBtn: {
        marginTop: 5,
        paddingVertical: 5,
        paddingHorizontal: 16,
        backgroundColor: "#c56901",
        borderRadius: 8,
        alignItems: "center",
    },

    viewDetailsBtnText: {
        fontSize: 20,
        paddingVertical: 3,
        textAlign: "center",
        fontWeight: "600",
        color: "#fff",
    },
});
