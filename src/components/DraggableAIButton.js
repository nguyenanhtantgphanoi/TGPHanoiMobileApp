import React from 'react';
import { StyleSheet, TouchableOpacity, Dimensions, View, Image } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

const DraggableAIButton = ({ onPress }) => {
    const translateX = useSharedValue(width - 80);
    const translateY = useSharedValue(height - 180);
    const context = useSharedValue({ x: 0, y: 0 });

    const gesture = Gesture.Pan()
        .onStart(() => {
            context.value = { x: translateX.value, y: translateY.value };
        })
        .onUpdate((event) => {
            translateX.value = event.translationX + context.value.x;
            translateY.value = event.translationY + context.value.y;
        })
        .onEnd(() => {
            const snapPoint = translateX.value > width / 2 ? width - 70 : 10;
            translateX.value = withSpring(snapPoint);
        });

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: translateX.value }, { translateY: translateY.value }],
    }));

    return (
        <GestureDetector gesture={gesture}>
            <Animated.View style={[styles.fab, animatedStyle]}>
                <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={styles.btn}>
                    <Image
                        source={require('../../assets/icon-tgp.png')}
                        style={styles.logo}
                        resizeMode="contain"
                    />

                    {/* Badge hình sao lấp lánh (AI) */}
                    <View style={styles.aiBadge}>
                        <MaterialCommunityIcons name="creation" size={14} color="white" />
                    </View>
                </TouchableOpacity>
            </Animated.View>
        </GestureDetector>
    );
};

const styles = StyleSheet.create({
    fab: {
        position: 'absolute',
        width: 64,
        height: 64,
        zIndex: 9999,
        left: 0,
        top: 0,
    },
    btn: {
        width: 60,
        height: 60,
        backgroundColor: 'white',
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
    },
    logo: {
        width: 42,
        height: 42,
    },
    aiBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: '#8B0000',
        width: 22,
        height: 22,
        borderRadius: 11,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'white',
    }
});

export default DraggableAIButton;