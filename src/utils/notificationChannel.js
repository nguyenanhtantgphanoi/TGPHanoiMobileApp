import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

export async function setupNotificationChannel() {
    if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('high-priority', {
            name: 'Thông báo quan trọng',
            importance: Notifications.AndroidImportance.HIGH,
            vibrationPattern: [0, 300, 300, 300],
            lightColor: '#FF231F7C',
            lockscreenVisibility:
                Notifications.AndroidNotificationVisibility.PUBLIC,
        });
    }
}
