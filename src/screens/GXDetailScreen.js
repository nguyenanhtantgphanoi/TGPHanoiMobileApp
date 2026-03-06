import { StyleSheet, View } from 'react-native'
import React from 'react'
import WebViewDetail from '../components/WebViewDetail'

export default function GXDetailScreen({ route }) {
    const { link } = route.params;
    return (
        <View style={styles.container}>
            <WebViewDetail linkWeb={link} />
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
})