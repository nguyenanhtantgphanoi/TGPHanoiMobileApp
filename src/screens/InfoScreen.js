import { StyleSheet, TouchableOpacity, View } from 'react-native'
import React from 'react'
import MaterialIcons from '@expo/vector-icons/MaterialIcons'
import WebViewDetail from '../components/WebViewDetail'

export default function InfoScreen({ navigation }) {
    return (
        <View style={styles.container}>
            <WebViewDetail linkWeb={'https://www.tonggiaophanhanoi.org/luoc-su-tong-giao-phan-ha-noi/'} />
            {/* <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                <MaterialIcons name="arrow-back" size={24} color="#000" />
            </TouchableOpacity> */}
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    backButton: {
        position: 'absolute',
        top: 50,
        left: 16,
        zIndex: 10,
        backgroundColor: '#ffffffd9',
        borderRadius: 20,
        padding: 8,
    },
})