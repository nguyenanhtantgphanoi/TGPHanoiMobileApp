import React, { useEffect, useState } from "react";
import {
    View,
    ScrollView,
    Text,
    ActivityIndicator,
    useWindowDimensions,
} from "react-native";
import RenderHTML from "react-native-render-html";
import axios from "axios";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ChiTietKinhScreen({ route }) {
    const { title, contentId, type } = route.params;
    const [html, setHtml] = useState("");
    const [loading, setLoading] = useState(true);
    const { width } = useWindowDimensions();

    useEffect(() => {
        let url;
        if (!type) {
            url = `https://news-tgphn.lamgs.io.vn/kinhNguyen/chiTietKinhNguyen/${contentId}`;
        } else {
            url = `https://news-tgphn.lamgs.io.vn/kinhNguyen/chiTietKinhNguyen/${contentId}?type=${type}`;
        }

        setLoading(true);

        axios
            .get(url)
            .then((res) => {
                if (res.data.success) {
                    setHtml(res.data.data);
                }
            })
            .catch((err) => {
                console.error("Lỗi load chi tiết kinh:", err);
            })
            .finally(() => {
                setLoading(false);
            });
    }, [contentId, type]);

    return (
        <View style={{ flex: 1, backgroundColor: "#fff" }}>
            {/* Header */}
            <SafeAreaView edges={["top"]} style={{ backgroundColor: "#fff" }}>
                <Text
                    style={{
                        fontSize: 22,
                        fontWeight: "bold",
                        paddingHorizontal: 16,
                        paddingBottom: 12,
                    }}
                >
                    {title}
                </Text>
            </SafeAreaView>

            {/* Loading */}
            {loading ? (
                <View
                    style={{
                        flex: 1,
                        justifyContent: "center",
                        alignItems: "center",
                    }}
                >
                    <ActivityIndicator size="large" color="#c62828" />
                </View>
            ) : (
                <ScrollView contentContainerStyle={{ padding: 16 }}>
                    <RenderHTML
                        contentWidth={width}
                        source={{ html }}
                        enableCSSInlineProcessing
                        tagsStyles={{
                            p: {
                                fontSize: 16,
                                lineHeight: 26,
                                marginBottom: 10,
                            },
                            div: {
                                marginBottom: 10,
                            },
                            h2: {
                                fontSize: 18,
                                fontWeight: "bold",
                                marginVertical: 10,
                            },
                            h3: {
                                fontSize: 17,
                                fontWeight: "bold",
                                marginVertical: 10,
                            },
                            strong: {
                                fontWeight: "bold",
                            },
                            span: {
                                marginBottom: 10,
                                display: "flex",
                            },
                            br: {
                                height: 10,
                            },
                        }}
                        defaultTextProps={{
                            selectable: true,
                        }}
                    />
                </ScrollView>
            )}
        </View>
    );
}