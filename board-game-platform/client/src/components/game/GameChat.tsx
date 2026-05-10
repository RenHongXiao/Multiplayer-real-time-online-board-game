import { useState, useRef, useEffect, FormEvent } from 'react';
import { useGameStore } from '../../stores/gameStore';
import { getSocket } from '../../services/socket';

interface GameChatProps {
  roomId: string;
}

export function GameChat({ roomId }: GameChatProps) {
  const [message, setMessage] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);
  const { chatMessages } = useGameStore();

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleSend = (e: FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    const socket = getSocket();
    if (socket) {
      socket.emit('chat_message', { roomId, message: message.trim() });
    }
    setMessage('');
  };

  return (
    <div className="bg-slate-800 rounded-xl border border-slate-700 flex flex-col h-64">
      <div className="p-3 border-b border-slate-700">
        <h4 className="text-sm font-semibold text-slate-300">聊天</h4>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {chatMessages.length === 0 && (
          <p className="text-xs text-slate-500 text-center">暂无消息</p>
        )}
        {chatMessages.map((msg, i) => (
          <div key={i} className={`text-xs ${msg.userId === 'system' ? 'text-yellow-400 italic' : 'text-slate-300'}`}>
            {msg.userId !== 'system' && (
              <span className="font-medium text-blue-400 mr-1">
                {msg.userId}:
              </span>
            )}
            {msg.message}
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>

      <form onSubmit={handleSend} className="p-2 border-t border-slate-700 flex gap-2">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="flex-1 px-2 py-1.5 bg-slate-700 border border-slate-600 rounded text-white text-sm focus:outline-none focus:border-blue-500"
          placeholder="发送消息..."
          maxLength={500}
        />
        <button
          type="submit"
          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition-colors"
        >
          发送
        </button>
      </form>
    </div>
  );
}
