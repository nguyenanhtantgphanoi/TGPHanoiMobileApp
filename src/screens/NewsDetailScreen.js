import { StyleSheet, Text, View, TouchableOpacity } from 'react-native'
import React from 'react'
import WebViewDetail from '../components/WebViewDetail'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import NewsDetail from '../components/NewsDetail';

export default function NewsDetailScreen({ route, navigation }) {
    const { link, postId } = route.params;
    const insets = useSafeAreaInsets();
    return (
        <View style={styles.container}>
            <NewsDetail linkWeb={link} postId={postId} />
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    backButton: {
        position: 'absolute',
        zIndex: 100,
        padding: 10,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderRadius: 24,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
})