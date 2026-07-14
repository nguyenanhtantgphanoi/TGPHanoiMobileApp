import { StyleSheet, Text, View, TouchableOpacity } from 'react-native'
import React from 'react'
import WebViewDetail from '../components/WebViewDetail'
import MaterialIcons from '@expo/vector-icons/MaterialIcons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

export default function DangBanQuyenScreen({ navigation }) {
    const insets = useSafeAreaInsets();
    return (
        <View style={styles.container}>
            <WebViewDetail linkWeb={'https://www.tonggiaophanhanoi.org/category/to-chuc-tgp/dang-ban-quyen/'} />

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
        
        
    },
})