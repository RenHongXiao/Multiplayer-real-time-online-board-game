import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';

export function Header() {
  const { user, token, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="bg-slate-800 border-b border-slate-700 shadow-lg">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="flex items-center justify-between h-14">
          <Link to="/" className="flex items-center gap-2 text-xl font-bold text-white hover:text-blue-400 transition-colors">
            <span className="text-2xl">♟</span>
            <span>棋类对战平台</span>
          </Link>

          <nav className="flex items-center gap-4">
            {token ? (
              <>
                <Link to="/lobby" className="text-slate-300 hover:text-white transition-colors">
                  游戏大厅
                </Link>
                <Link to="/records" className="text-slate-300 hover:text-white transition-colors">
                  对局记录
                </Link>
                <Link to="/profile" className="text-slate-300 hover:text-white transition-colors">
                  {user?.nickname || '个人中心'}
                </Link>
                <button
                  onClick={handleLogout}
                  className="px-3 py-1.5 text-sm bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition-colors"
                >
                  退出
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  登录
                </Link>
                <Link
                  to="/register"
                  className="px-3 py-1.5 text-sm bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition-colors"
                >
                  注册
                </Link>
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
