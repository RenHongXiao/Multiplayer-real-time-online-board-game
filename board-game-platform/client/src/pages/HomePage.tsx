import { Link } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

export function HomePage() {
  const token = useAuthStore((s) => s.token);

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] gap-8">
      <div className="text-center">
        <h1 className="text-5xl font-bold text-white mb-4">
          <span className="text-6xl">♟</span>
          <span className="block mt-2">棋类对战平台</span>
        </h1>
        <p className="text-xl text-slate-400 max-w-lg mx-auto">
          支持中国象棋和五子棋的实时在线对弈平台。
          创建房间，邀请好友，即刻开始对弈！
        </p>
      </div>

      <div className="flex gap-4 flex-wrap justify-center">
        {token ? (
          <>
            <Link
              to="/lobby"
              className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white text-lg rounded-xl transition-colors shadow-lg"
            >
              进入游戏大厅
            </Link>
            <Link
              to="/profile"
              className="px-8 py-3 bg-slate-700 hover:bg-slate-600 text-slate-200 text-lg rounded-xl transition-colors"
            >
              个人中心
            </Link>
          </>
        ) : (
          <>
            <Link
              to="/login"
              className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white text-lg rounded-xl transition-colors shadow-lg"
            >
              立即登录
            </Link>
            <Link
              to="/register"
              className="px-8 py-3 bg-slate-700 hover:bg-slate-600 text-slate-200 text-lg rounded-xl transition-colors"
            >
              免费注册
            </Link>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8 max-w-2xl w-full">
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <h3 className="text-lg font-semibold text-white mb-2">🏯 中国象棋</h3>
          <p className="text-slate-400 text-sm">
            经典中国传统棋类，楚河汉界，红黑对弈。考验策略与大局观。
          </p>
        </div>
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <h3 className="text-lg font-semibold text-white mb-2">⚫ 五子棋</h3>
          <p className="text-slate-400 text-sm">
            黑白对弈，五子连珠即获胜。规则简单但变化无穷，老少皆宜。
          </p>
        </div>
      </div>
    </div>
  );
}
