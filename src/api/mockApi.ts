// src/api/mockApi.ts
import MockAdapter from 'axios-mock-adapter';
import apiClient from './apiClient'; // Import instance Axios của bạn
import { getRefreshToken, saveRefreshToken } from '../lib/tokenManager';

// --- CƠ SỞ DỮ LIỆU GIẢ ---
// Một user hợp lệ
const MOCK_USER = {
    id: 1,
    email: 'user@example.com',
    name: 'Demo User',
};
const MOCK_PASSWORD = 'password123';

// Các token
const MOCK_ACCESS_TOKEN = 'mock-access-token-jwt';
const MOCK_REFRESH_TOKEN = 'mock-refresh-token-string';
const EXPIRED_ACCESS_TOKEN = 'expired-access-token';

// Hàm tạo token mới (chỉ để mô phỏng)
const generateNewToken = () => `new-access-token-${Date.now()}`;

// --- HÀM SET UP MOCKS ---
export const setupMockApi = () => {
    // 1. Tạo một mock adapter cho instance 'apiClient'
    const mock = new MockAdapter(apiClient, { delayResponse: 500 }); // Thêm 500ms delay

    // 2. Mock API Đăng nhập: POST /auth/login
    mock.onPost('/auth/login').reply((config) => {
        const { email, password } = JSON.parse(config.data);

        if (email === MOCK_USER.email && password === MOCK_PASSWORD) {
            // Đăng nhập thành công
            saveRefreshToken(MOCK_REFRESH_TOKEN); // Lưu refresh token vào ls
            return [
                200, // Status code
                {
                    // Body
                    accessToken: MOCK_ACCESS_TOKEN,
                    refreshToken: MOCK_REFRESH_TOKEN,
                },
            ];
        } else {
            // Đăng nhập thất bại
            return [
                401, // Unauthorized
                { message: 'Invalid email or password' },
            ];
        }
    });

    // 3. Mock API Lấy thông tin user: GET /users/me
    mock.onGet('/users/me').reply((config) => {
        const token = config.headers?.Authorization?.split(' ')[1];

        if (token === MOCK_ACCESS_TOKEN || token?.startsWith('new-access-token')) {
            // Token hợp lệ
            return [200, MOCK_USER];
        } else if (token === EXPIRED_ACCESS_TOKEN) {
            // Token hết hạn (để test)
            return [401, { message: 'Token expired' }];
        } else {
            // Không có token hoặc token sai
            return [401, { message: 'Unauthorized' }];
        }
    });

    // 4. Mock API Refresh Token: POST /auth/refresh
    mock.onPost('/auth/refresh').reply((config) => {
        const { refreshToken } = JSON.parse(config.data);
        const storedRefreshToken = getRefreshToken(); // Lấy từ ls

        if (refreshToken === MOCK_REFRESH_TOKEN && refreshToken === storedRefreshToken) {
            // Refresh token hợp lệ
            const newAccessToken = generateNewToken();
            return [
                200,
                {
                    accessToken: newAccessToken,
                },
            ];
        } else {
            // Refresh token không hợp lệ (ví dụ: đã bị thu hồi)
            return [401, { message: 'Invalid refresh token' }];
        }
    });

    // (Bạn có thể thêm các mock khác ở đây)
};