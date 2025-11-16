// src/components/ProtectedLayout.tsx
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const ProtectedLayout: React.FC = () => {
    const { accessToken, isLoading } = useAuth();

    // 1. Chờ kiểm tra token lúc tải trang
    // Đây là lúc AuthContext đang check 'refreshToken'
    if (isLoading) {
        // Hiển thị một spinner toàn màn hình
        return (
            <div className="flex min-h-screen items-center justify-center">
                <p className="text-2xl text-gray-600">Loading application...</p>
                {/* Bạn có thể thay bằng một component Spinner đẹp hơn */}
            </div>
        );
    }

    // 2. Nếu KHÔNG có token VÀ đã hết loading
    if (!accessToken) {
        // Chuyển hướng người dùng về trang login
        // 'replace' sẽ thay thế lịch sử, người dùng không thể "back" lại
        return <Navigate to="/login" replace />;
    }

    // 3. Nếu CÓ token, render các trang con
    // <Outlet /> sẽ là component con (ví dụ: DashboardPage)
    return <Outlet />;
};

export default ProtectedLayout;