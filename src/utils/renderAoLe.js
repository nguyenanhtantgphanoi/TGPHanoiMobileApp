export default function renderAoLe(mauAo) {
    switch (mauAo) {
        case 'white':
            return require('../../assets/images/ao-trang.png');
        case 'red':
            return require('../../assets/images/ao-do.png');
        case 'purple':
            return require('../../assets/images/ao-tim.png');
        case 'pink':
            return require('../../assets/images/ao-hong.png');
        default:
            return require('../../assets/images/ao-trang.png');
    }
}