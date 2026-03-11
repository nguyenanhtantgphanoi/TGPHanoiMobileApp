import React from 'react';
import HotUpdate from 'react-native-ota-hot-update';
import { Alert, Linking, Platform } from 'react-native';
import ReactNativeBlobUtil from 'react-native-blob-util';
import axios from 'axios';
import { requestUpdateBundle } from '../apis/api';
import Constants from 'expo-constants';

export const useUpdateVersion = () => {
    const [progress, setProgress] = React.useState(0);
    const [isUpdating, setIsUpdating] = React.useState(false);

    const startUpdateBundle = (url, version) => {
        setIsUpdating(true);

        HotUpdate.downloadBundleUri(ReactNativeBlobUtil, url, version, {
            updateSuccess: () => {
                setIsUpdating(false);
                HotUpdate.resetApp();
            },
            updateFail: err => {
                setIsUpdating(false);
                console.log(err);
            },
            restartAfterInstall: true,
            progress: (received, total) => {
                const percent = Math.round((+received / +total) * 100);
                setProgress(percent);
            },
        });
    };

    // KIỂM TRA OTA BUNDLE
    const checkUpdate = async () => {
        const bundle = await requestUpdateBundle();
        const currentVersion = await HotUpdate.getCurrentVersion();
        console.log('Current bundle version:', currentVersion);
        if (bundle?.data?.length) {
            const [itemVersion] = bundle.data.filter(
                (item) => item.enable,
            );
            const latestVersion = itemVersion?.id || 0;

            if (latestVersion > currentVersion) {
                Alert.alert(
                    'Thông báo!',
                    'Ứng dụng có phiên bản mới, vui lòng cập nhật để tiếp tục sử dụng.',
                    [
                        {
                            text: 'Cập nhật',
                            onPress: () =>
                                startUpdateBundle(
                                    `https://codepush.tgphanoi.org${itemVersion?.bundle?.url}`,
                                    latestVersion,
                                ),
                        },
                    ],
                    { cancelable: false },
                );
            }
        }
    };

    React.useEffect(() => {
        const version = Constants.expoConfig?.version;

        const compareVersion = async () => {
            try {
                const res = await axios.get(
                    'https://mapp.tgphanoi.org/api/version/getVersion',
                );
                console.log(res.data);

                const currentVersion = version.split('.').map(Number);
                const incomingVersion = res.data.version.split('.').map(Number);
                console.log('Current app version:', currentVersion);
                console.log('Incoming store version:', incomingVersion);
                // So sánh version app với version store
                for (let i = 0; i < 3; i++) {
                    if (currentVersion[i] < incomingVersion[i]) {
                        // CÓ PHIÊN BẢN MỚI TRÊN STORE → ép cập nhật → KHÔNG CHẠY checkUpdate()
                        Alert.alert(
                            'Cập nhật ứng dụng',
                            'Đã có phiên bản mới trên Store. Vui lòng cập nhật để tiếp tục sử dụng.',
                            [
                                {
                                    text: 'Cập nhật ngay',
                                    onPress: () => {
                                        Platform.OS === 'android'
                                            ? Linking.openURL(
                                                'https://play.google.com/store/apps/details?id=com.application.tgphn',
                                            )
                                            : Linking.openURL(
                                                'https://apps.apple.com/us/app/truy%E1%BB%81n-th%C3%B4ng-tgp-h%C3%A0-n%E1%BB%99i/id6756556449',
                                            );
                                    },
                                },
                            ],
                            { cancelable: false },
                        );
                        return;
                    }

                    if (currentVersion[i] > incomingVersion[i]) {
                        break;
                    }
                }

                // Không có update store → MỚI CHẠY OTA update
                checkUpdate();
            } catch (error) {
                console.log(error);
                checkUpdate(); // fallback
            }
        };
        if (!__DEV__) {
            // Automatically check for updates when the app starts in production mode
            //   checkUpdate();
            compareVersion();
        }else {
            checkUpdate();
            compareVersion();
            console.log('Running in development mode, skipping update check.');
        }
    }, []);

    return {
        data: {
            checkUpdate,
            state: {
                progress,
                isUpdating,
            },
        },
    };
};
