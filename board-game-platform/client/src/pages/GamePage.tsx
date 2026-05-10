import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useGameStore } from '../stores/gameStore';
import { useSocket } from '../hooks/useSocket';
import { Board } from '../components/game/Board';
import { GameInfo } from '../components/game/GameInfo';
import { GameChat } from '../components/game/GameChat';

export function GamePage() {
  const { roomId } = useParams<{ roomId: string }>();
  const { gameState, myColor, gameType, opponentDisconnected, isAI, setRoom } = useGameStore();

  useEffect(() => {
    if (roomId && !useGameStore.getState().roomId) {
      setRoom(roomId);
    }
  }, [roomId]);

  useSocket(roomId);

  if (!gameState) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="text-4xl animate-bounce">♟</div>
        <p className="text-slate-400 text-lg">等待对手加入...</p>
        <p className="text-slate-500 text-sm">房间号：<span className="text-white font-mono">{roomId}</span></p>
        <p className="text-slate-500 text-sm">
          我是：<span className={myColor === 'red' || myColor === 'black' ? 'text-red-400' : 'text-white'}>{myColor === 'red' ? '红方' : myColor === 'black' ? '黑方' : '等待分配'}</span>
        </p>
      </div>
    );
  }

  if (isAI && !myColor) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="text-4xl animate-bounce">🤖</div>
        <p className="text-slate-400 text-lg">正在初始化AI对战...</p>
      </div>
    );
  }

  const isGomoku = gameType === 'gomoku';

  return (
    <div className="flex gap-4 max-w-6xl mx-auto">
      <div className="flex-1 flex flex-col items-center">
        <div className="flex items-center gap-4 mb-4">
          <h3 className="text-lg font-semibold text-white">
            {isGomoku ? '五子棋' : '中国象棋'}
          </h3>
          <span className="text-slate-500 text-sm font-mono">#{roomId}</span>
          {opponentDisconnected && (
            <span className="px-2 py-0.5 bg-yellow-900/50 text-yellow-400 text-xs rounded-full">
              对手已断线
            </span>
          )}
        </div>
        <Board />
      </div>
      <div className="w-72 flex flex-col gap-4">
        <GameInfo />
        <GameChat roomId={roomId!} />
      </div>
    </div>
  );
}
