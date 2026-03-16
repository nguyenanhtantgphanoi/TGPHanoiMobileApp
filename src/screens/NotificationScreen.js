import React, { useMemo } from 'react';
import {
    StyleSheet,
    Text,
    View,
    ScrollView,
    TouchableOpacity,
    useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import RenderHTML from 'react-native-render-html';

export default function NotificationScreen({ route, navigation }) {
    const insets = useSafeAreaInsets();
    const { width } = useWindowDimensions();

    const notification = route?.params?.notification || {};
    const title = notification?.title || 'Thong bao';
    const body = notification?.body || 'Khong co noi dung';
    const data = notification?.data || {};

    const prettyData = useMemo(() => {
        try {
            return JSON.stringify(data, null, 2);
        } catch {
            return '{}';
        }
    }, [data]);

    const htmlBody = useMemo(() => {
        if (!body || typeof body !== 'string') return '<p>Khong co noi dung</p>';
        return body;
    }, [body]);

    const tagsStyles = useMemo(() => ({
        p: {
            fontSize: 16,
            color: '#111827',
            lineHeight: 24,
            marginTop: 0,
            marginBottom: 10,
        },
        body: {
            color: '#111827',
        },
        b: {
            fontWeight: '700',
        },             
    }), []);

    return (
        <View style={[styles.container, { paddingTop: insets.top + 10, paddingBottom: insets.bottom + 10 }]}>
            <View style={styles.headerRow}>
                <Text style={styles.headerTitle}>Thông báo</Text>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeBtn}>
                    <Text style={styles.closeBtnText}>Đóng</Text>
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                
                <Text style={styles.label}>{title}</Text>
                
                <View style={styles.value}>
                    <RenderHTML
                        contentWidth={width - 56}
                        source={{ html: htmlBody }}
                        tagsStyles={tagsStyles}
                    />
                </View>

                {/* <Text style={styles.label}>Payload</Text>
                <View style={styles.codeBox}>
                    <Text style={styles.codeText}>{prettyData}</Text>
                </View> */}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f6ef',
        paddingHorizontal: 16,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#2c3e50',
    },
    closeBtn: {
        backgroundColor: '#0f766e',
        borderRadius: 8,
        paddingVertical: 8,
        paddingHorizontal: 12,
    },
    closeBtnText: {
        color: '#fff',
        fontWeight: '700',
    },
    content: {
        paddingBottom: 24,
    },
    label: {
        marginTop: 12,
        marginBottom: 6,
        fontSize: 14,
        fontWeight: '700',
        color: '#1f2937',
        textTransform: 'uppercase',
    },
    value: {
        fontSize: 16,
        color: '#111827',
        lineHeight: 24,
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 12,
    },
    codeBox: {
        backgroundColor: '#111827',
        borderRadius: 10,
        padding: 12,
        marginTop: 4,
    },
    codeText: {
        color: '#e5e7eb',
        fontFamily: 'Courier',
        fontSize: 13,
        lineHeight: 20,
    },
});
