// src/api/apiClient.ts
import axios, { AxiosError } from 'axios';
import type { InternalAxiosRequestConfig } from 'axios';
import {
    getRefreshToken,
    saveRefreshToken,
    clearAllTokens, // Import hàm dọn dẹp tổng
} from '../lib/tokenManager';

// 1. BIẾN "CẦU NỐI" (BRIDGE)
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
// 'AuthContext' sẽ chịu trách nhiệm cập nhật biến này.
let inMemoryAccessToken: string | null = null;

// 2. TẠO AXIOS INSTANCE
const apiClient = axios.create({
    baseURL: API_BASE_URL,
});

// 3. HÀM CẬP NHẬT "CẦU NỐI"
// AuthContext sẽ gọi hàm này khi login/logout/refresh
export const setInMemoryAccessToken = (token: string | null) => {
    inMemoryAccessToken = token;
};

// 4. REQUEST INTERCEPTOR (Gửi request đi)
apiClient.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        // Nếu có token trong bộ nhớ, đính kèm vào header
        if (inMemoryAccessToken) {
            config.headers.Authorization = `Bearer ${inMemoryAccessToken}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    },
);

// --- Logic xử lý Refresh Token phức tạp ---

// Cờ để đánh dấu có đang refresh token hay không
let isRefreshing = false;
// Hàng đợi chứa các request đang chờ token mới
let refreshSubscribers: ((token: string | null) => void)[] = [];

// Hàm thêm request vào hàng đợi
const addRefreshSubscriber = (callback: (token: string | null) => void) => {
    refreshSubscribers.push(callback);
};

// Hàm xử lý hàng đợi khi có token mới
const onRefreshed = (token: string) => {
    refreshSubscribers.forEach((callback) => callback(token));
    refreshSubscribers = []; // Xóa hàng đợi
};

// Hàm xử lý khi refresh token thất bại
const onRefreshFailed = (error: any) => {
    refreshSubscribers.forEach((callback) => callback(null)); // Gửi tín hiệu thất bại
    refreshSubscribers = []; // Xóa hàng đợi

    // Dọn dẹp tất cả token
    clearAllTokens(); // Xóa cả local và session storage
    setInMemoryAccessToken(null); // Xóa token khỏi "cầu nối"

    // Chỉ redirect nếu chúng ta không ở trang login
    if (window.location.pathname !== '/login') {
        window.location.href = '/login';
    }
};

// 5. RESPONSE INTERCEPTOR (Nhận response về)
apiClient.interceptors.response.use(
    (response) => {
        // Mọi response 2xx sẽ đi qua đây
        return response;
    },
    async (error: AxiosError) => {
        // Mọi response lỗi (non-2xx) sẽ đi qua đây
        const originalRequest = error.config as InternalAxiosRequestConfig & {
            _retry?: boolean;
        };

        // Lấy URL của request gốc
        const url = originalRequest.url;

        // --- SỬA LỖI QUAN TRỌNG ---
        // Nếu lỗi 401 xảy ra từ chính trang login HOẶC refresh,
        // chúng ta KHÔNG xử lý.
        // Hãy để cho useMutation của trang Login tự bắt lỗi và hiển thị.
        if (
            (error.response?.status === 401) &&
            (url === '/auth/login' || url === '/auth/refresh')
        ) {
            return Promise.reject(error);
        }
        // --- KẾT THÚC SỬA LỖI ---

        // Nếu lỗi là 401 VÀ request này KHÔNG PHẢI từ login/refresh
        if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
            originalRequest._retry = true; // Đánh dấu là đã thử lại

            const refreshToken = getRefreshToken();
            if (!refreshToken) {
                // Không có refresh token, không thể làm gì, logout
                console.error('No refresh token. Logging out.');
                onRefreshFailed(error); // Logout và redirect
                return Promise.reject(error);
            }

            // Nếu CHƯA có request nào đang refresh, thì mình refresh
            if (!isRefreshing) {
                isRefreshing = true;
                try {
                    // **QUAN TRỌNG**: Dùng 'axios' (instance gốc) để gọi refresh,
                    // vì 'apiClient' (instance của mình) sẽ bị lặp vô tận.
                    // Thêm '' để xử lý khi baseURL là undefined (khi dùng mock)
                    const { data } = await axios.post(
                        `${API_BASE_URL || ''}/auth/refresh`,
                        { refreshToken },
                    );

                    const { accessToken: newAccessToken } = data;
                    // (Tùy chọn) Nếu backend trả về refresh token mới, lưu lại
                    if (data.refreshToken) {
                        saveRefreshToken(data.refreshToken);
                    }

                    // Cập nhật token mới vào "cầu nối"
                    setInMemoryAccessToken(newAccessToken);

                    // **QUAN TRỌNG**: Cũng phải lưu accessToken mới vào sessionStorage
                    // để nó tồn tại khi F5 tab.
                    // Chúng ta cần import hàm này...
                    // A, không cần, AuthContext sẽ làm việc này khi gọi lại request.
                    // Chỉ cần onRefreshed là đủ.

                    // Xử lý hàng đợi: Thực thi lại các request đã chờ
                    onRefreshed(newAccessToken);
                    isRefreshing = false; // Mở khóa

                    // Thử lại request gốc với token mới
                    if (originalRequest.headers) {
                        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
                    }
                    return apiClient(originalRequest);
                } catch (refreshError) {
                    // Nếu refresh token cũng HẾT HẠN hoặc lỗi
                    console.error('Refresh token failed.', refreshError);
                    isRefreshing = false; // Mở khóa
                    onRefreshFailed(refreshError); // Logout
                    return Promise.reject(refreshError);
                }
            }

            // Nếu ĐANG có một request khác refresh, thêm request này vào hàng đợi
            return new Promise((resolve) => {
                addRefreshSubscriber((token: string | null) => {
                    if (token && originalRequest.headers) {
                        // Refresh thành công, thử lại request
                        originalRequest.headers.Authorization = `Bearer ${token}`;
                        resolve(apiClient(originalRequest));
                    } else {
                        // Refresh thất bại
                        resolve(Promise.reject(error));
                    }
                });
            });
        }

        // Trả về các lỗi khác (500, 404, 403...)
        return Promise.reject(error);
    },
);

export default apiClient;