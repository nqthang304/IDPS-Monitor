import { useState, useEffect } from 'react';

export const useResponsiveFont = () => {
  const [fontSize, setFontSize] = useState(14); // Mặc định 14px

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      let newSize = 14;

      // Linh hoạt thay đổi cỡ chữ gốc theo độ phân giải
      if (width >= 1920) {
        newSize = 16; // Màn hình Full HD, 2K, 4K -> Chữ to 16px
      } else if (width >= 1366) {
        newSize = 14; // Màn hình Laptop thường -> Chữ vừa 14px
      } else {
        newSize = 13; // Màn hình bé -> Chữ 13px
      }

      setFontSize(newSize);

      // THÊM DÒNG NÀY: Đồng bộ cỡ chữ này ra ngoài CSS thuần (:root)
      document.documentElement.style.fontSize = `${newSize}px`;
    };

    // Chạy lần đầu
    handleResize();

    // Lắng nghe khi người dùng kéo thả cửa sổ
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return fontSize;
};