import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

export async function registerForPushNotifications() {
    if (!Device.isDevice) {
        console.log('Must use physical device');
        return null;
    }

    const { status: existingStatus } =
        await Notifications.getPermissionsAsync();

    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
        const { status } =
            await Notifications.requestPermissionsAsync();
        finalStatus = status;
    }

    if (finalStatus !== 'granted') {
        console.log('Permission denied');
        return null;
    }

    const expoPushToken =
        (await Notifications.getExpoPushTokenAsync()).data;

    const deviceInfo = {
        expoPushToken,
        platform: Platform.OS, // ios | android
        deviceName: Device.deviceName,
        modelName: Device.modelName,
        osName: Device.osName,
        osVersion: Device.osVersion,
        manufacturer: Device.manufacturer,
        brand: Device.brand,
        appVersion: Constants.expoConfig?.version,
        appBuild: Constants.expoConfig?.ios?.buildNumber,
    };

    return deviceInfo;
}
