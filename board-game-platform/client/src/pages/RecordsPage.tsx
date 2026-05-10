import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

interface GameRecord {
  _id: string;
  roomId: string;
  gameType: 'chinese-chess' | 'gomoku';
  players: Array<{
    userId: { _id: string; nickname: string; username: string };
    color: string;
  }>;
  moves: any[];
  result: {
    winner: string | null;
    reason: string;
  };
  startedAt: string;
  endedAt: string;
}

const gameTypeNames: Record<string, string> = {
  'chinese-chess': '中国象棋',
  'gomoku': '五子棋',
};

const reasonNames: Record<string, string> = {
  checkmate: '绝杀',
  resign: '认输',
  timeout: '超时',
  'five-in-row': '五子连珠',
  stalemate: '困毙',
  draw: '和棋',
};

export function RecordsPage() {
  const [records, setRecords] = useState<GameRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/user/records').then(({ data }) => {
      if (data.code === 0) setRecords(data.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="text-center text-slate-400 mt-16">加载中...</div>;
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold text-white mb-6">对局记录</h2>

      {records.length === 0 ? (
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-8 text-center text-slate-500">
          暂无对局记录，快去游戏大厅开始一局吧！
        </div>
      ) : (
        <div className="space-y-3">
          {records.map((record) => {
            const player1 = record.players[0];
            const player2 = record.players[1];

            const winnerNickname = record.result.winner
              ? record.players.find(p => p.userId._id === record.result.winner)?.userId.nickname
              : '和棋';

            return (
              <div key={record._id} className="bg-slate-800 rounded-xl border border-slate-700 p-4 hover:bg-slate-750 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">
                      {record.gameType === 'chinese-chess' ? '🏯' : '⚫'}
                    </span>
                    <div>
                      <div className="text-white font-medium">
                        {gameTypeNames[record.gameType]}
                        <span className="text-slate-500 text-xs ml-2">#{record.roomId}</span>
                      </div>
                      <div className="text-sm text-slate-400">
                        {player1?.userId?.nickname} ({player1?.color === 'red' ? '红' : player1?.color === 'black' ? '黑' : '白'})
                        <span className="mx-1">vs</span>
                        {player2?.userId?.nickname} ({player2?.color === 'red' ? '红' : player2?.color === 'black' ? '黑' : '白'})
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-sm font-semibold ${
                      record.result.winner === null ? 'text-yellow-400' : 'text-green-400'
                    }`}>
                      {winnerNickname} 胜
                    </div>
                    <div className="text-xs text-slate-500">
                      {reasonNames[record.result.reason] || record.result.reason}
                      {' · '}
                      {new Date(record.endedAt).toLocaleDateString('zh-CN')}
                    </div>
                    <div className="text-xs text-slate-500">
                      {record.moves.length} 步
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
