import * as Updates from 'expo-updates';
import { Alert } from 'react-native';
import { IS_PRODUCTION, ENABLE_OTA } from '../utils/env';

export async function checkOTAUpdate() {
    try {
        // ❌ Không chạy dev
        if (!IS_PRODUCTION) return;

        // ❌ expo-updates chưa enable
        if (!Updates.isEnabled) {
            console.log('[OTA] Updates not enabled');
            return;
        }

        if (!ENABLE_OTA) return;

        const update = await Updates.checkForUpdateAsync();

        if (update.isAvailable) {
            Alert.alert(
                'Cập nhật ứng dụng',
                'TGP Hà Nội có phiên bản mới. Bạn có muốn cập nhật ngay?',
                [
                    { text: 'Để sau', style: 'cancel' },
                    {
                        text: 'Cập nhật',
                        onPress: async () => {
                            await Updates.fetchUpdateAsync();
                            await Updates.reloadAsync();
                        }
                    }
                ]
            );
        }
    } catch (err) {
        console.log('[OTA] error (safe):', err);
    }
}
