import React, { useState, useRef, useEffect } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    FlatList, KeyboardAvoidingView, Platform, SafeAreaView,
    ActivityIndicator, Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';

const AIChatModal = ({ visible, onClose }) => {
    const [messages, setMessages] = useState([
        { id: '1', text: 'Chào bạn! Mình là Trợ lý AI TGP Hà Nội. Hiện mình hỗ trợ tìm kiếm nhanh các bài Kinh. Bạn cần tìm gì không?', sender: 'ai' }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const flatListRef = useRef(null);

    useEffect(() => {
        if (visible) {
            setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 200);
        }
    }, [messages, visible]);

    const sendMessage = async () => {
        if (!input.trim() || loading) return;
        const userMsg = { id: Date.now().toString(), text: input, sender: 'user' };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setLoading(true);

        try {
            const response = await axios.post('https://mapp.tgphanoi.org/api/news/chat', { message: input });
            const aiMsg = { id: (Date.now() + 1).toString(), text: response.data.reply, sender: 'ai' };
            setMessages(prev => [...prev, aiMsg]);
        } catch (error) {
            setMessages(prev => [...prev, { id: 'err', text: 'Kết nối gián đoạn. Bạn thử lại nhé!', sender: 'ai' }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
            <SafeAreaView style={{ flex: 1, backgroundColor: '#FFF' }}>
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                    <View style={styles.header}>
                        <View>
                            <Text style={styles.headerTitle}>Trợ lý AI TGP Hà Nội</Text>
                            <Text style={styles.subTitle}>Hỗ trợ tìm kiếm Kinh nhanh</Text>
                        </View>
                        <TouchableOpacity onPress={onClose}><Ionicons name="close-circle" size={32} color="#8B0000" /></TouchableOpacity>
                    </View>

                    <FlatList
                        ref={flatListRef}
                        data={messages}
                        keyExtractor={item => item.id}
                        renderItem={({ item }) => (
                            <View style={[styles.msg, item.sender === 'user' ? styles.msgUser : styles.msgAI]}>
                                <Text style={{ color: item.sender === 'user' ? '#FFF' : '#000', fontSize: 16 }}>{item.text}</Text>
                            </View>
                        )}
                        contentContainerStyle={{ padding: 15 }}
                        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
                    />

                    <View style={styles.inputArea}>
                        <TextInput style={styles.input} value={input} onChangeText={setInput} placeholder="Nhập tên Kinh..." multiline />
                        <TouchableOpacity onPress={sendMessage} disabled={loading}>
                            {loading ? <ActivityIndicator color="#8B0000" /> : <Ionicons name="send" size={28} color="#8B0000" />}
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    header: { flexDirection: 'row', justifyContent: 'space-between', padding: 15, borderBottomWidth: 1, borderColor: '#EEE', alignItems: 'center' },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#8B0000' },
    subTitle: { fontSize: 12, color: '#666' },
    msg: { padding: 12, borderRadius: 15, marginVertical: 5, maxWidth: '85%' },
    msgUser: { alignSelf: 'flex-end', backgroundColor: '#8B0000' },
    msgAI: { alignSelf: 'flex-start', backgroundColor: '#F0F0F0' },
    inputArea: { flexDirection: 'row', padding: 15, borderTopWidth: 1, borderColor: '#EEE', alignItems: 'center' },
    input: { flex: 1, backgroundColor: '#F9F9F9', borderRadius: 20, paddingHorizontal: 15, paddingVertical: 8, marginRight: 10, maxHeight: 100 }
});

export default AIChatModal;