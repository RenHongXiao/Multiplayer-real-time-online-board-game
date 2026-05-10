export type PieceType =
  | 'king' | 'advisor' | 'elephant' | 'knight'
  | 'rook' | 'cannon' | 'pawn';

export type PieceColor = 'red' | 'black';
export type GomokuColor = 'black' | 'white';

export interface Position {
  x: number;
  y: number;
}

export interface Piece {
  type: PieceType;
  color: PieceColor;
}

export interface Move {
  from: Position;
  to: Position;
  piece: Piece;
  captured?: Piece;
}

export interface GameResult {
  winner: PieceColor | GomokuColor | null;
  reason: 'checkmate' | 'stalemate' | 'resign' | 'timeout' | 'five-in-row' | 'draw';
}

export interface GameState {
  board: (Piece | null)[][];
  currentTurn: PieceColor | GomokuColor;
  moves: Move[];
  moveCount: number;
  isOver: boolean;
  result: GameResult | null;
}
