export default function renderAoLe(mauAo) {
    switch (mauAo) {
        case 'white':
            return require('../../assets/images/trang.jpg');
        case 'red':
            return require('../../assets/images/do.jpg');
        case 'purple':
            return require('../../assets/images/tim.jpg');
        case 'pink':
            return require('../../assets/images/hong.jpg');
        default:
            return require('../../assets/images/xanh.jpg');
    }
}