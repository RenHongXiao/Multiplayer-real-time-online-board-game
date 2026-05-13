import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';  //引入路由工具包。负责管理“网址 ↔ 页面”的对应关系，实现不刷新网页就能切换内容。
import { useEffect } from 'react';  //引入React的自动触发器。用来在页面加载或数据变化时，自动执行某些操作。
import { useAuthStore } from './stores/authStore';  //引入用户状态管理库。用来读取或保存“是否已登录、用户是谁”等全局数据。
import { Header } from './components/common/Header';  //以下均为引入页面顶部的导航组件。通常包含网站logo、导航链接、用户信息等。
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { LobbyPage } from './pages/LobbyPage';
import { GamePage } from './pages/GamePage';
import { ProfilePage } from './pages/ProfilePage';
import { RecordsPage } from './pages/RecordsPage';

//受保护的路由组件。用来包裹那些需要登录才能访问的页面。如果用户没有登录，就自动跳转到登录页。
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.token);
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

//这是一个 React 函数组件，使用 TypeScript 编写。它返回一个完整的页面路由结构，控制不同 URL 显示什么页面，并且会在应用启动时自动加载用户信息。
export default function App() {
  const loadUser = useAuthStore((s) => s.loadUser);

  useEffect(() => {
    loadUser();
  }, []);

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-900 flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-6 max-w-7xl">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route
              path="/lobby"
              element={
                <ProtectedRoute>
                  <LobbyPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/game/:roomId"
              element={
                <ProtectedRoute>
                  <GamePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/records"
              element={
                <ProtectedRoute>
                  <RecordsPage />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
