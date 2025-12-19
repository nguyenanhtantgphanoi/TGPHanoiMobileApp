import React, { useEffect, useState } from "react";
import {
    View,
    ScrollView,
    Text,
    useWindowDimensions,
} from "react-native";
import RenderHTML from "react-native-render-html";
import axios from "axios";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ChiTietKinhScreen({ route }) {
    const { title, contentId } = route.params;
    const [html, setHtml] = useState("");
    const { width } = useWindowDimensions();

    useEffect(() => {
        axios
            .get(
                `https://news-tgphn.lamgs.io.vn/kinhNguyen/chiTietKinhNguyen/${contentId}`
            )
            .then((res) => {
                if (res.data.success) {
                    setHtml(res.data.data);
                }
            });
    }, [contentId]);

    return (
        <View style={{ flex: 1, backgroundColor: "#fff" }}>
            <SafeAreaView edges={["top"]} style={{ backgroundColor: "#fff" }}>
                <Text
                    style={{
                        fontSize: 22,
                        fontWeight: "bold",
                        marginBottom: 16,
                        paddingHorizontal: 16,
                    }}
                >
                    {title}
                </Text>
            </SafeAreaView>

            <ScrollView contentContainerStyle={{ padding: 16 }}>
                <RenderHTML
                    contentWidth={width}
                    source={{ html }}
                    enableExperimentalMarginCollapsing={true}
                    enableCSSInlineProcessing={true}
                    tagsStyles={{
                        p: { fontSize: 16, lineHeight: 24 },
                        strong: { fontWeight: "bold" },
                    }}
                />
            </ScrollView>
        </View>
    );
}
