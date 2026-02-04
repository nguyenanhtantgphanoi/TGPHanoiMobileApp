// UpdateOverlay.js
import React from "react";
import PropTypes from "prop-types";
import { ActivityIndicator, Modal, StyleSheet, Text, View } from "react-native";

export const UpdateOverlay = React.memo(({ isUpdating, progress }) => {
    const [visible, setVisible] = React.useState(isUpdating);

    // Giữ Modal không bị unmount khi progress thay đổi
    React.useEffect(() => {
        if (isUpdating) setVisible(true);
        else setVisible(false);
    }, [isUpdating]);

    if (!visible) return null;

    return (
        <Modal transparent visible animationType="fade">
            <View style={styles.overlay}>
                <View style={styles.modal}>
                    <Text style={styles.title}>Đang cập nhật...</Text>
                    <Text style={styles.progress}>{progress}%</Text>
                    <ActivityIndicator size="large" color="#007AFF" />
                </View>
            </View>
        </Modal>
    );
});

UpdateOverlay.propTypes = {
    isUpdating: PropTypes.bool.isRequired,
    progress: PropTypes.number.isRequired,
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.6)",
        justifyContent: "center",
        alignItems: "center",
    },
    modal: {
        backgroundColor: "white",
        padding: 20,
        borderRadius: 10,
        alignItems: "center",
    },
    title: {
        fontSize: 18,
        fontWeight: "bold",
        marginBottom: 8,
    },
    progress: {
        fontSize: 16,
        marginBottom: 10,
    },
});
