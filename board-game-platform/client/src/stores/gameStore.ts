import { create } from 'zustand';

interface Position {
  x: number;
  y: number;
}

interface Piece {
  type: string;
  color: string;
}

interface Move {
  from: Position;
  to: Position;
  piece: Piece;
  captured?: Piece;
}

interface GameResult {
  winner: string | null;
  reason: string;
}

interface GameStateData {
  board: (Piece | null)[][];
  currentTurn: string;
  moves: Move[];
  moveCount: number;
  isOver: boolean;
  result: GameResult | null;
}

interface GameStore {
  roomId: string | null;
  gameType: string | null;
  myColor: string | null;
  gameState: GameStateData | null;
  selectedPiece: Position | null;
  legalMoves: Position[];
  isMyTurn: boolean;
  timer: { red: number; black: number };
  chatMessages: { userId: string; message: string; timestamp: string }[];
  opponentDisconnected: boolean;
  rematchRequested: boolean;
  isAI: boolean;
  aiColor: string | null;
  setRematchRequested: (v: boolean) => void;
  setIsAI: (v: boolean) => void;
  setAIColor: (color: string | null) => void;

  setRoom: (roomId: string | null) => void;
  setGameType: (gameType: string | null) => void;
  setMyColor: (color: string | null) => void;
  setGameState: (state: GameStateData | null) => void;
  setSelectedPiece: (pos: Position | null) => void;
  setLegalMoves: (moves: Position[]) => void;
  setTimer: (timer: { red: number; black: number }) => void;
  addChatMessage: (msg: { userId: string; message: string; timestamp: string }) => void;
  setOpponentDisconnected: (disconnected: boolean) => void;
  reset: () => void;
}

export const useGameStore = create<GameStore>((set) => ({
  roomId: null,
  gameType: null,
  myColor: null,
  gameState: null,
  selectedPiece: null,
  legalMoves: [],
  isMyTurn: false,
  timer: { red: 1200, black: 1200 },
  chatMessages: [],
  opponentDisconnected: false,
  rematchRequested: false,
  isAI: false,
  aiColor: null,

  setRoom: (roomId) => set({ roomId }),
  setRematchRequested: (v) => set({ rematchRequested: v }),
  setIsAI: (v) => set({ isAI: v }),
  setAIColor: (color) => set({ aiColor: color }),
  setGameType: (gameType) => set({ gameType }),
  setMyColor: (color) => set({ myColor: color, isMyTurn: color === 'red' || color === 'black' }),
  setGameState: (state) => {
    if (state) {
      set({
        gameState: state,
        isMyTurn: state.currentTurn === useGameStore.getState().myColor,
      });
    } else {
      set({ gameState: null });
    }
  },
  setSelectedPiece: (pos) => set({ selectedPiece: pos }),
  setLegalMoves: (moves) => set({ legalMoves: moves }),
  setTimer: (timer) => set({ timer }),
  addChatMessage: (msg) =>
    set((s) => ({ chatMessages: [...s.chatMessages, msg] })),
  setOpponentDisconnected: (disconnected) => set({ opponentDisconnected: disconnected }),
  reset: () =>
    set({
      roomId: null,
      gameType: null,
      myColor: null,
      gameState: null,
      selectedPiece: null,
      legalMoves: [],
      isMyTurn: false,
      timer: { red: 1200, black: 1200 },
      chatMessages: [],
      opponentDisconnected: false,
      isAI: false,
      aiColor: null,
    }),
}));
