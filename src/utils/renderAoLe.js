export default function renderAoLe(mauAo) {
    switch (mauAo) {
        case 'Trắng':
            return require('../../assets/images/ao-trang.png');
        case 'Đỏ':
            return require('../../assets/images/ao-do.png');
        case 'Tím':
            return require('../../assets/images/ao-tim.png');
        case 'Hồng':
            return require('../../assets/images/ao-hong.png');
        default:
            return require('../../assets/images/ao-xanh.png');
    }
}