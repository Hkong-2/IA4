// src/api/types.ts
export interface LoginResponse {
    accessToken: string;
    refreshToken: string;
    // Thêm các thông tin khác nếu API của bạn trả về (ví dụ: user)
}