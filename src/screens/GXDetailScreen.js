import { StyleSheet, Text, View, TouchableOpacity } from 'react-native'
import React from 'react'
import WebViewDetail from '../components/WebViewDetail'
import MaterialIcons from '@expo/vector-icons/MaterialIcons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

export default function GXDetailScreen({ route, navigation }) {
    const { link } = route.params;
    const insets = useSafeAreaInsets();
    return (
        <View style={styles.container}>
            <WebViewDetail linkWeb={link} />
            <TouchableOpacity 
                onPress={() => navigation.goBack()} 
                style={[styles.backButton, { top: insets.top, left: 10 }]}
            >
                <MaterialIcons name="arrow-back" size={28} color="#000" />
            </TouchableOpacity>
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