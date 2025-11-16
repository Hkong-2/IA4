// src/hooks/useAuth.ts
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext'; // Import Context mà bạn đã tạo

/**
 * Custom hook để truy cập AuthContext một cách an toàn.
 */
export const useAuth = () => {
    // 1. Lấy context
    const context = useContext(AuthContext);

    // 2. Kiểm tra an toàn
    // Nếu component dùng hook này nằm ngoài <AuthProvider>,
    // context sẽ là 'undefined'.
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }

    // 3. Trả về context nếu mọi thứ ổn
    return context;
};