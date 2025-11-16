// postcss.config.js (MỚI - ĐÃ SỬA)
import tailwindcss from '@tailwindcss/postcss' // <--- Import từ gói mới
import autoprefixer from 'autoprefixer'

export default {
  plugins: [
    tailwindcss, // <--- Sử dụng ở đây
    autoprefixer,
  ],
}