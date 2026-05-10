import { useState, FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

export function LoginPage() {
  const { login, loading, error, clearError, token } = useAuthStore();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  if (token) return <Navigate to="/lobby" replace />;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await login(username, password);
    if (localStorage.getItem('token')) {
      navigate('/lobby');
    }
  };

  return (
    <div className="max-w-md mx-auto mt-16">
      <h2 className="text-2xl font-bold text-white text-center mb-8">用户登录</h2>
      <form onSubmit={handleSubmit} className="bg-slate-800 rounded-xl p-6 border border-slate-700 space-y-4">
        {error && (
          <div className="bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg text-sm">
            {error}
            <button onClick={clearError} className="float-right text-red-400 hover:text-red-300">&times;</button>
          </div>
        )}
        <div>
          <label className="block text-slate-300 text-sm mb-1">用户名</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full px-4 py-2.5 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500 transition-colors"
            placeholder="请输入用户名"
            required
            minLength={3}
          />
        </div>
        <div>
          <label className="block text-slate-300 text-sm mb-1">密码</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2.5 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500 transition-colors"
            placeholder="请输入密码"
            required
            minLength={6}
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white rounded-lg transition-colors font-medium"
        >
          {loading ? '登录中...' : '登录'}
        </button>
        <p className="text-center text-slate-400 text-sm">
          还没有账号？ <Link to="/register" className="text-blue-400 hover:text-blue-300">立即注册</Link>
        </p>
      </form>
    </div>
  );
}
