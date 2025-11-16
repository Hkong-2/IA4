// src/App.tsx
import { Routes, Route, Navigate } from 'react-router-dom';

// 1. Import các component trang
import LoginPage from './pages/Login';
import DashboardPage from './pages/Dashboard';

// 2. Import component layout bảo vệ
import ProtectedLayout from './components/ProtectedLayout';

// (Tùy chọn) Một layout cho các trang công khai (như Login, Register)
// const PublicLayout = () => <Outlet />;

function App() {
  return (
    // 3. 'Routes' là component bọc ngoài cùng
    <Routes>
      
      <Route element={<ProtectedLayout />}>
        {/* '/' là trang chủ, sẽ render DashboardPage */}
        <Route path="/" element={<DashboardPage />} />

        
      </Route>

     
      <Route path="/login" element={<LoginPage />} />
      {/* <Route path="/register" element={<RegisterPage />} /> */}

     
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;