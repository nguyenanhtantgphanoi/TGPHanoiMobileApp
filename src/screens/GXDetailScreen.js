import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import WebViewDetail from '../components/WebViewDetail'

export default function GXDetailScreen({ route }) {
    const { link } = route.params;
    return (
        <WebViewDetail linkWeb={link} />
    )
}

const styles = StyleSheet.create({})