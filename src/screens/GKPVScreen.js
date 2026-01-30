import React, { useRef } from 'react';
import { View, StyleSheet, ActivityIndicator, SafeAreaView } from 'react-native';
import { WebView } from 'react-native-webview';

export default function GKPVScreen({ route }) {
    const webRef = useRef(null);

    // Cấu hình ngày bạn muốn hiển thị
    const target = {
        day: route.params?.day,
        month: route.params?.month,
        year: route.params?.year,
        // seldate: "Sat Feb 28 2026 00:00:00 GMT+0700 (Indochina Time)"
    };

    // Script này sẽ chạy TRƯỚC KHI trang web kịp load dữ liệu
    const runBefore = `
    (function() {
      // 1. Chặn hàm Ajax của jQuery
      const checkJQuery = setInterval(() => {
        if (window.$ && window.$.ajax) {
          clearInterval(checkJQuery);
          
          const originalAjax = window.$.ajax;
          window.$.ajax = function(settings) {
            // Nếu trang web gọi API lấy bài đọc
            if (settings.url && (settings.url.includes('/readings/prayer') || settings.url === '/readings/prayer')) {
              console.log("Bắt được request! Đang ép dữ liệu sang ngày ${target.day}/${target.month}");
              
              // Ép tham số ngày tháng
              if (typeof settings.data === 'string') {
                settings.data = settings.data
                  .replace(/day=\\d+/, "day=${target.day}")
                  .replace(/month=\\d+/, "month=${target.month}")
                  .replace(/year=\\d+/, "year=${target.year}")
                  .replace(/seldate=[^&]+/, "seldate=" + encodeURIComponent("${target.seldate}"));
              } else if (typeof settings.data === 'object') {
                settings.data.day = '${target.day}';
                settings.data.month = '${target.month}';
                settings.data.year = '${target.year}';
                settings.data.seldate = '${target.seldate}';
              }
            }
            return originalAjax.apply(this, arguments);
          };
        }
      }, 10);

      // 2. Ép trang web gọi lại hàm tải dữ liệu nếu nó đã lỡ load ngày hôm nay
      setTimeout(() => {
        if (window.$ && $('.active-prayer').length) {
          $('.active-prayer').click(); 
        }
      }, 1500);
    })();
    true;
  `;

    return (
        <SafeAreaView style={styles.container}>
            <WebView
                ref={webRef}
                source={{ uri: 'https://ktcgkpv.org/readings/prayer' }}
                javaScriptEnabled={true}
                domStorageEnabled={true}
                // inject sớm nhất có thể để chặn hàm khởi tạo của web
                injectedJavaScriptBeforeContentLoaded={runBefore}
                userAgent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"

                startInLoadingState={true}
                renderLoading={() => (
                    <View style={styles.loading}>
                        <ActivityIndicator size="large" color="#2196F3" />
                    </View>
                )}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    loading: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', backgroundColor: 'white' },
});