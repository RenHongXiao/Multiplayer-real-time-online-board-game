import { useEffect, useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import api from '../services/api';

interface UserProfile {
  _id: string;
  username: string;
  nickname: string;
  stats: {
    totalGames: number;
    wins: number;
    losses: number;
    draws: number;
    rating: number;
  };
  createdAt: string;
}

export function ProfilePage() {
  const { user } = useAuthStore();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/user/profile').then(({ data }) => {
      if (data.code === 0) setProfile(data.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="text-center text-slate-400 mt-16">加载中...</div>;
  }

  if (!profile && !user) {
    return <div className="text-center text-slate-400 mt-16">请先登录</div>;
  }

  const display = profile || {
    _id: user?.id,
    username: user?.username,
    nickname: user?.nickname,
    stats: user?.stats || { totalGames: 0, wins: 0, losses: 0, draws: 0, rating: 1000 },
    createdAt: '',
  };

  const winRate = display.stats.totalGames > 0
    ? Math.round((display.stats.wins / display.stats.totalGames) * 100)
    : 0;

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-white mb-6">个人中心</h2>

      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
        <div className="p-6 border-b border-slate-700">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center text-white text-2xl font-bold">
              {display.nickname?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">{display.nickname}</h3>
              <p className="text-slate-400 text-sm">@{display.username}</p>
            </div>
          </div>
        </div>

        <div className="p-6">
          <h4 className="text-lg font-semibold text-white mb-4">战绩统计</h4>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-slate-700/50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-white">{display.stats.totalGames}</div>
              <div className="text-xs text-slate-400">总对局</div>
            </div>
            <div className="bg-slate-700/50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-green-400">{display.stats.wins}</div>
              <div className="text-xs text-slate-400">胜利</div>
            </div>
            <div className="bg-slate-700/50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-red-400">{display.stats.losses}</div>
              <div className="text-xs text-slate-400">失败</div>
            </div>
            <div className="bg-slate-700/50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-yellow-400">{display.stats.draws}</div>
              <div className="text-xs text-slate-400">和棋</div>
            </div>
            <div className="bg-slate-700/50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-blue-400">{winRate}%</div>
              <div className="text-xs text-slate-400">胜率</div>
            </div>
          </div>

          <div className="mt-4 bg-slate-700/50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-slate-300">天梯分</span>
              <span className="text-2xl font-bold text-blue-400">{display.stats.rating}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
