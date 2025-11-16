// src/lib/tokenManager.ts

const ACCESS_TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';

// --- Access Token (sessionStorage) ---

/**
 * Lưu access token vào sessionStorage
 * @param token Access token
 */
export const saveAccessToken = (token: string): void => {
    try {
        sessionStorage.setItem(ACCESS_TOKEN_KEY, token);
    } catch (error) {
        console.error('Error saving access token to sessionStorage', error);
    }
};

/**
 * Lấy access token từ sessionStorage
 * @returns Access token hoặc null nếu không tìm thấy
 */
export const getAccessToken = (): string | null => {
    try {
        return sessionStorage.getItem(ACCESS_TOKEN_KEY);
    } catch (error) {
        console.error('Error getting access token from sessionStorage', error);
        return null;
    }
};

/**
 * Xóa access token khỏi sessionStorage
 */
export const clearAccessToken = (): void => {
    try {
        sessionStorage.removeItem(ACCESS_TOKEN_KEY);
    } catch (error) {
        console.error('Error clearing access token from sessionStorage', error);
    }
};

// --- Refresh Token (localStorage) ---

/**
 * Lưu refresh token vào localStorage
 * @param token Refresh token
 */
export const saveRefreshToken = (token: string): void => {
    try {
        localStorage.setItem(REFRESH_TOKEN_KEY, token);
    } catch (error) {
        console.error('Error saving refresh token to localStorage', error);
    }
};

/**
 * Lấy refresh token từ localStorage
 * @returns Refresh token hoặc null nếu không tìm thấy
 */
export const getRefreshToken = (): string | null => {
    try {
        return localStorage.getItem(REFRESH_TOKEN_KEY);
    } catch (error) {
        console.error('Error getting refresh token from localStorage', error);
        return null;
    }
};

/**
 * Xóa refresh token khỏi localStorage
 */
export const clearRefreshToken = (): void => {
    try {
        localStorage.removeItem(REFRESH_TOKEN_KEY);
    } catch (error) {
        console.error('Error clearing refresh token from localStorage', error);
    }
};

// --- Xóa tất cả ---

/**
 * Xóa tất cả token khỏi cả hai storage
 */
export const clearAllTokens = (): void => {
    clearAccessToken(); // Xóa khỏi session
    clearRefreshToken(); // Xóa khỏi local
};