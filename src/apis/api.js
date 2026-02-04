import axios from 'axios';
import Constants from 'expo-constants';

// Function to request the latest OTA bundle from the CMS
export async function requestUpdateBundle() {
    const endpoint =
        Platform.OS === 'ios' ? 'ios-updates' : 'android-updates';
    const version = Constants.expoConfig?.version; // Get the current app version
    const response = await axios.get(
        `https://codepush.tgphanoi.org/api/${endpoint}?populate=*&filters[targetVersion][$eq]=${version}&sort=id:desc`,
    );
    return response.data;
}