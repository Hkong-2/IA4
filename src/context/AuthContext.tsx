// src/context/AuthContext.tsx (Cập nhật)

import React, {
  createContext,
  useState,
  useEffect,
  useCallback,
} from 'react';
import type { ReactNode } from 'react';
import {
  setInMemoryAccessToken,
  default as apiClient,
} from '../api/apiClient';
import {
  getRefreshToken,
  saveRefreshToken, // Import hàm mới
  getAccessToken,
  saveAccessToken,
  clearAllTokens,
} from '../lib/tokenManager';

interface AuthContextType {
  accessToken: string | null;
  setAccessToken: (token: string | null) => void;
  logout: () => void;
  isLoading: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [accessToken, _setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Hàm setAccessToken "bọc"
   * Cập nhật đồng bộ: React State, Axios Bridge, và sessionStorage
   */
  const setAccessToken = (token: string | null) => {
    if (token) {
      saveAccessToken(token); // 1. Lưu vào sessionStorage
    }
    _setAccessToken(token); // 2. Lưu vào React State
    setInMemoryAccessToken(token); // 3. Lưu vào "cầu nối" của Axios
  };

  /**
   * Hàm Logout
   * Xóa tất cả token khỏi mọi nơi
   */
  const logout = useCallback(() => {
    clearAllTokens(); // 1. Xóa khỏi localStorage và sessionStorage
    setAccessToken(null); // 2. Xóa khỏi State và Axios bridge
  }, []);

  /**
   * LOGIC "REFRESH ON LOAD" (Đã cập nhật)
   * Ưu tiên 1: Lấy token từ sessionStorage
   * Ưu tiên 2: Lấy token bằng refreshToken từ localStorage
   */
  useEffect(() => {
    const checkAuthOnLoad = async () => {
      // Ưu tiên 1: Kiểm tra accessToken trong sessionStorage
      const sessionToken = getAccessToken();
      if (sessionToken) {
        setAccessToken(sessionToken); // Tải token từ session
        setIsLoading(false);
        return;
      }

      // Ưu tiên 2: Nếu không có session, thử dùng refreshToken
      const localRefreshToken = getRefreshToken();
      if (localRefreshToken) {
        try {
          // 2.1. Gọi API refresh
          const { data } = await apiClient.post('/auth/refresh', {
            refreshToken: localRefreshToken,
          });

          // 2.2. Refresh thành công, lưu token mới
          setAccessToken(data.accessToken);

          // (Tùy chọn) Nếu backend trả về refresh token mới, lưu lại
          if (data.refreshToken) {
            saveRefreshToken(data.refreshToken);
          }
        } catch (error) {
          // 2.3. Refresh thất bại (token hỏng), logout
          console.error('Failed to refresh token on app load', error);
          logout();
        } finally {
          setIsLoading(false);
        }
      } else {
        // Không có token nào cả
        setIsLoading(false);
      }
    };

    checkAuthOnLoad();
  }, [logout]);

  const value = {
    accessToken,
    setAccessToken,
    logout,
    isLoading,
  };

  return (
    <AuthContext.Provider value={value}>
      {!isLoading && children}
    </AuthContext.Provider>
  );
};