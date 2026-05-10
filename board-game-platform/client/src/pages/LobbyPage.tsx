import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLobbyStore } from '../stores/lobbyStore';
import { useGameStore } from '../stores/gameStore';

const gameTypeNames: Record<string, string> = {
  'chinese-chess': '中国象棋',
  'gomoku': '五子棋',
};

export function LobbyPage() {
  const navigate = useNavigate();
  const { rooms, loading, error, creating, fetchRooms, createRoom, joinRoom } = useLobbyStore();
  const [gameType, setGameType] = useState<'chinese-chess' | 'gomoku'>('chinese-chess');
  const [mode, setMode] = useState<'pvp' | 'ai'>('pvp');
  const [joinRoomId, setJoinRoomId] = useState('');
  const [filterType, setFilterType] = useState<string>('');

  useEffect(() => {
    fetchRooms(filterType);
    const interval = setInterval(() => fetchRooms(filterType), 10000);
    return () => clearInterval(interval);
  }, [filterType]);

  const handleCreateRoom = async () => {
    const roomId = await createRoom(gameType, mode);
    if (roomId) {
      useGameStore.getState().setRoom(roomId);
      useGameStore.getState().setGameType(gameType);
      navigate(`/game/${roomId}`);
    }
  };

  const doJoinRoom = async (roomId: string) => {
    if (!roomId.trim()) return;
    try {
      await joinRoom(roomId.trim().toUpperCase());
      const finalRoomId = roomId.trim().toUpperCase();
      useGameStore.getState().setRoom(finalRoomId);
      navigate(`/game/${finalRoomId}`);
    } catch {
      // Error handled in store
    }
  };

  const handleJoinRoom = () => doJoinRoom(joinRoomId);
  const handleJoinCard = (roomId: string) => doJoinRoom(roomId);

  return (
    <div className="max-w-5xl mx-auto">
      <h2 className="text-2xl font-bold text-white mb-6">游戏大厅</h2>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
          <h3 className="text-lg font-semibold text-white mb-4">创建房间</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-slate-300 text-sm mb-1">游戏类型</label>
              <select
                value={gameType}
                onChange={(e) => setGameType(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
              >
                <option value="chinese-chess">中国象棋</option>
                <option value="gomoku">五子棋</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-300 text-sm mb-1">对战模式</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setMode('pvp')}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                    mode === 'pvp'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                  }`}
                >
                  人人对战
                </button>
                <button
                  onClick={() => setMode('ai')}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                    mode === 'ai'
                      ? 'bg-purple-600 text-white'
                      : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                  }`}
                >
                  AI对战
                </button>
              </div>
            </div>
            <button
              onClick={handleCreateRoom}
              disabled={creating}
              className="w-full py-2.5 bg-green-600 hover:bg-green-700 disabled:bg-slate-600 text-white rounded-lg transition-colors font-medium"
            >
              {creating ? '创建中...' : '创建房间'}
            </button>
          </div>
        </div>

        <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
          <h3 className="text-lg font-semibold text-white mb-4">加入房间</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-slate-300 text-sm mb-1">房间号</label>
              <input
                type="text"
                value={joinRoomId}
                onChange={(e) => setJoinRoomId(e.target.value.toUpperCase())}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500 uppercase"
                placeholder="输入6位房间号"
                maxLength={6}
              />
            </div>
            <button
              onClick={handleJoinRoom}
              disabled={joinRoomId.length < 6}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white rounded-lg transition-colors font-medium"
            >
              加入房间
            </button>
          </div>
        </div>

        <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
          <h3 className="text-lg font-semibold text-white mb-4">我的战绩</h3>
          <div className="text-slate-400 text-sm space-y-1">
            <p>创建或加入房间开始对弈</p>
            <p>• 中国象棋：红黑双方轮流走棋</p>
            <p>• 五子棋：黑白双方轮流落子</p>
            <p>• 每方限时20分钟</p>
          </div>
        </div>
      </div>

      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <h3 className="text-lg font-semibold text-white">房间列表</h3>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-1.5 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none"
          >
            <option value="">全部类型</option>
            <option value="chinese-chess">中国象棋</option>
            <option value="gomoku">五子棋</option>
          </select>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-400">加载中...</div>
        ) : rooms.length === 0 ? (
          <div className="p-8 text-center text-slate-500">暂无等待中的房间，快去创建一个吧！</div>
        ) : (
          <div className="divide-y divide-slate-700">
            {rooms.map((room) => (
              <div key={room._id} className="flex items-center justify-between p-4 hover:bg-slate-750 transition-colors">
                <div className="flex items-center gap-4">
                  <span className="text-xl">
                    {room.gameType === 'chinese-chess' ? '🏯' : '⚫'}
                  </span>
                  <div>
                    <div className="text-white font-medium">
                      {gameTypeNames[room.gameType]}
                      <span className="text-slate-500 text-sm ml-2">#{room.roomId}</span>
                    </div>
                    <div className="text-slate-400 text-sm">
                      房主：{room.hostId?.nickname || '未知'} (分：{room.hostId?.stats?.rating || 1000})
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleJoinCard(room.roomId)}
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
                >
                  加入
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
