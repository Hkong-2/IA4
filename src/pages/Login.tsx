// src/pages/Login.tsx
import React from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth'; // Hook
import { saveRefreshToken } from '../lib/tokenManager'; // Hàm
import apiClient from '../api/apiClient'; // Axios instance
import type { LoginResponse } from '../api/types'; // Kiểu dữ liệu (tùy chọn)

// 1. Định nghĩa kiểu dữ liệu cho form
type LoginFormInputs = {
  email: string; // Tên 'email' phải khớp với register('email')
  password: string; // Tên 'password' phải khớp với register('password')
};

// 2. Hàm gọi API đăng nhập (dùng cho useMutation)
const loginUser = async (data: LoginFormInputs): Promise<LoginResponse> => {
  const response = await apiClient.post('/auth/login', data); // Endpoint của bạn
  return response.data;
};

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { setAccessToken } = useAuth(); // Lấy hàm setAccessToken từ Context

  // 3. Cài đặt React Hook Form
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormInputs>({
    // (Tùy chọn) Set giá trị mặc định
    defaultValues: {
      email: '',
      password: '',
    },
  });

  // 4. Cài đặt React Query Mutation
  const mutation = useMutation({
    mutationFn: loginUser, // Hàm gọi API
    onSuccess: (data) => {
      // 5. XỬ LÝ KHI ĐĂNG NHẬP THÀNH CÔNG
      console.log('Login successful!', data);

      // 5.1. Lưu tokens
      setAccessToken(data.accessToken); // Lưu vào Context/Memory (cho Axios)
      saveRefreshToken(data.refreshToken); // Lưu vào localStorage

      // 5.2. Xóa cache cũ
      // Quan trọng nếu bạn cache dữ liệu của user cũ
      queryClient.clear();

      // 5.3. Chuyển hướng đến trang dashboard
      navigate('/');
    },
    onError: (error) => {
      // 6. Xử lý khi đăng nhập thất bại
      console.error('Login failed:', error);
      // 'mutation.isError' sẽ tự động là true
      // 'mutation.error' sẽ chứa lỗi
    },
  });

  // 7. Hàm xử lý khi submit form
  // 'data' đã được React Hook Form validate
  const onSubmit: SubmitHandler<LoginFormInputs> = (data) => {
    mutation.mutate(data); // Gọi mutation để thực thi API
  };

  return (
    // Sử dụng Tailwind để căn giữa
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-md">
        <h2 className="mb-6 text-center text-3xl font-bold text-gray-900">
          Login
        </h2>

        {/* 8. Form với handleSubmit */}
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          {/* Vùng hiển thị lỗi chung */}
          {mutation.isError && (
            <div className="mb-4 rounded bg-red-100 p-3 text-center text-sm text-red-700">
              Invalid email or password. Please try again.
            </div>
          )}

          {/* Trường Email */}
          <div className="mb-4">
            <label
              htmlFor="email"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Email Address
            </label>
            <input
              id="email"
              type="email"
              className={`w-full rounded-md border p-3 shadow-sm ${
                errors.email
                  ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                  : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500'
              }`}
              // 9. Đăng ký field với validation
              {...register('email', {
                required: 'Email is required',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Invalid email address',
                },
              })}
            />
            {/* 10. Hiển thị lỗi validation của field */}
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">
                {errors.email.message}
              </p>
            )}
          </div>

          {/* Trường Password */}
          <div className="mb-6">
            <label
              htmlFor="password"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              className={`w-full rounded-md border p-3 shadow-sm ${
                errors.password
                  ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                  : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500'
              }`}
              // 9. Đăng ký field với validation
              {...register('password', {
                required: 'Password is required',
              })}
            />
            {/* 10. Hiển thị lỗi validation của field */}
            {errors.password && (
              <p className="mt-1 text-sm text-red-600">
                {errors.password.message}
              </p>
            )}
          </div>

          {/* Nút Submit */}
          <div>
            <button
              type="submit"
              // 11. Disable nút khi đang loading
              //disabled={mutation.isLoading}
              className="w-full rounded-md bg-indigo-600 p-3 text-white transition duration-200 hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-400"
            >
              {/* {mutation.isLoading ? 'Logging in...' : 'Login'} */}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;