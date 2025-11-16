// src/pages/Dashboard.tsx
import React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import apiClient from '../api/apiClient';

// (Tùy chọn) Định nghĩa kiểu dữ liệu user
interface UserProfile {
    id: number;
    email: string;
    name: string;
}

// 1. Hàm gọi API lấy thông tin user (được bảo vệ)
// Interceptor của apiClient sẽ tự động đính kèm accessToken
const fetchUserProfile = async (): Promise<UserProfile> => {
    const { data } = await apiClient.get('/users/me'); // Endpoint của bạn
    return data;
};

const DashboardPage: React.FC = () => {
    const { logout } = useAuth();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    // 2. Lấy dữ liệu user bằng React Query
    // 'userProfile' là key để cache
    const {
        data: user,
        isLoading,
        isError,
        error,
    } = useQuery({
        queryKey: ['userProfile'],
        queryFn: fetchUserProfile,
    });

    // 3. Xử lý Logout
    const handleLogout = () => {
        // 3.1. Gọi hàm logout từ Context
        // (Sẽ xóa accessToken, refreshToken, và cập nhật state)
        logout();

        // 3.2. Xóa toàn bộ cache của React Query
        // Đảm bảo dữ liệu của user cũ không bị hiển thị khi user mới đăng nhập
        queryClient.clear();

        // 3.3. Chuyển hướng về trang login
        navigate('/login');
    };

    // 4. Xử lý trạng thái loading
    if (isLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <p className="text-xl">Loading user data...</p>
            </div>
        );
    }

    // 5. Xử lý trạng thái lỗi
    // (Lỗi 401 đã được interceptor xử lý và tự logout)
    // Lỗi này có thể là 500 (Server Error) hoặc 404 (Not Found)
    if (isError) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <p className="text-xl text-red-600">
                    Error loading data: {(error as Error).message}
                </p>
            </div>
        );
    }

    // 6. Giao diện chính khi có dữ liệu
    return (
        <div className="min-h-screen bg-gray-100 p-8">
            <header className="mb-8 flex items-center justify-between rounded bg-white p-6 shadow">
                <h1 className="text-3xl font-bold text-gray-800">
                    Welcome, {user?.name || 'User'}!
                </h1>
                <button
                    onClick={handleLogout}
                    className="rounded bg-red-600 px-4 py-2 text-white transition duration-200 hover:bg-red-700"
                >
                    Logout
                </button>
            </header>

            <main className="rounded bg-white p-6 shadow">
                <h2 className="mb-4 text-2xl font-semibold">Your Profile</h2>
                {user ? (
                    <div className="space-y-2">
                        <p>
                            <strong>Email:</strong> {user.email}
                        </p>
                        <p>
                            <strong>User ID:</strong> {user.id}
                        </p>
                        {/* Thêm các thông tin khác */}
                    </div>
                ) : (
                    <p>No user data available.</p>
                )}
            </main>
        </div>
    );
};

export default DashboardPage;