import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../../stores/gameStore';
import { getSocket } from '../../services/socket';

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export function GameInfo() {
  const navigate = useNavigate();
  const { gameState, myColor, timer, isMyTurn, gameType, isAI, reset, rematchRequested, setRematchRequested } = useGameStore();

  const handleResign = () => {
    const socket = getSocket();
    const roomId = useGameStore.getState().roomId;
    if (socket && roomId) socket.emit('resign', { roomId });
  };

  const handleDraw = () => {
    const socket = getSocket();
    const roomId = useGameStore.getState().roomId;
    if (socket && roomId) socket.emit('request_draw', { roomId });
  };

  const handleRematch = () => {
    const socket = getSocket();
    const roomId = useGameStore.getState().roomId;
    if (!socket || !roomId) return;
    if (rematchRequested) {
      // Opponent already requested — accept
      socket.emit('rematch_accept', { roomId });
      setRematchRequested(false);
    } else {
      // I'm requesting
      socket.emit('rematch_request', { roomId });
    }
  };

  const handleLeave = () => {
    const socket = getSocket();
    const roomId = useGameStore.getState().roomId;
    if (socket && roomId) socket.emit('leave_room', { roomId });
    reset();
    navigate('/lobby');
  };

  if (!gameState) return null;

  let opponentColor: string | null = null;
  if (myColor === 'red') opponentColor = 'black';
  else if (myColor === 'black' && gameType === 'chinese-chess') opponentColor = 'red';
  else if (myColor === 'black' && gameType === 'gomoku') opponentColor = 'white';
  else if (myColor === 'white') opponentColor = 'black';

  const myTime = myColor ? (timer as any)[myColor] || 0 : 0;
  const opponentTime = opponentColor ? (timer as any)[opponentColor] || 0 : 0;

  const colorNames: Record<string, string> = {
    red: '红方', black: '黑方', white: '白方',
  };

  return (
    <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
      <h4 className="text-sm font-semibold text-slate-300 mb-3">对局信息</h4>

      <div className="flex items-center gap-2 mb-3">
        <div className={`w-3 h-3 rounded-full ${gameState.isOver ? 'bg-slate-500' : isMyTurn ? 'bg-green-500 animate-pulse' : 'bg-slate-600'}`} />
        <span className="text-sm text-slate-300">
          {gameState.isOver ? '游戏结束' : isMyTurn ? '你的回合' : '对方回合'}
        </span>
      </div>

      <div className="space-y-2 mb-3">
        <div className={`flex justify-between items-center p-2 rounded-lg ${myColor === gameState.currentTurn ? 'bg-slate-700 ring-1 ring-blue-500' : 'bg-slate-750'}`}>
          <span className="text-sm">你 ({colorNames[myColor!] || ''})</span>
          <span className={`text-sm font-mono ${myTime < 60 ? 'text-red-400' : 'text-slate-300'}`}>
            {formatTime(myTime)}
          </span>
        </div>
        <div className={`flex justify-between items-center p-2 rounded-lg ${opponentColor === gameState.currentTurn ? 'bg-slate-700 ring-1 ring-blue-500' : 'bg-slate-750'}`}>
          <span className="text-sm">{isAI ? 'AI对手' : '对手'}</span>
          <span className={`text-sm font-mono ${opponentTime < 60 ? 'text-red-400' : 'text-slate-300'}`}>
            {isAI ? '--:--' : formatTime(opponentTime)}
          </span>
        </div>
      </div>

      {gameState.isOver && gameState.result && (
        <div className="bg-slate-700 rounded-lg p-3 mb-3 text-center">
          <div className="text-lg font-bold text-yellow-400">
            {gameState.result.winner === null
              ? '和棋！'
              : gameState.result.winner === myColor
                ? '你赢了！'
                : '你输了'}
          </div>
          <div className="text-sm text-slate-400">
            {gameState.result.reason === 'checkmate' && '绝杀'}
            {gameState.result.reason === 'resign' && '对方认输'}
            {gameState.result.reason === 'timeout' && '超时判负'}
            {gameState.result.reason === 'five-in-row' && '五子连珠'}
            {gameState.result.reason === 'stalemate' && '困毙'}
            {gameState.result.reason === 'draw' && '协议和棋'}
          </div>
          <div className="flex gap-2 mt-3">
            <button
              onClick={handleRematch}
              className={`flex-1 py-1.5 text-white text-sm rounded-lg transition-colors ${rematchRequested ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'}`}
            >
              {rematchRequested ? '同意再来一局' : '再来一局'}
            </button>
            <button
              onClick={handleLeave}
              className="flex-1 py-1.5 bg-slate-600 hover:bg-slate-500 text-slate-300 text-sm rounded-lg transition-colors"
            >
              退出房间
            </button>
          </div>
        </div>
      )}

      {!gameState.isOver && (
        <div className="space-y-2">
          <button onClick={handleResign} className="w-full py-1.5 bg-red-600/30 hover:bg-red-600/50 text-red-400 text-sm rounded-lg transition-colors border border-red-800">
            认输
          </button>
          {!isAI && (
            <button onClick={handleDraw} className="w-full py-1.5 bg-yellow-600/30 hover:bg-yellow-600/50 text-yellow-400 text-sm rounded-lg transition-colors border border-yellow-800">
              求和
            </button>
          )}
        </div>
      )}

      <div className="mt-3 text-xs text-slate-500">
        已走 {gameState.moveCount} 步
      </div>
    </div>
  );
}
