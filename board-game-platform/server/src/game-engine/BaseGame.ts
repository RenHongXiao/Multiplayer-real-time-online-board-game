import { GameState, Move, GameResult } from './types';

export abstract class BaseGame {
  protected board: (any)[][] = [];
  protected currentTurn: string = '';
  protected moves: Move[] = [];
  protected moveCount: number = 0;
  protected isOver: boolean = false;
  protected result: GameResult | null = null;

  abstract initialize(): void;
  abstract validateMove(fromX: number, fromY: number, toX: number, toY: number, skipTurnCheck?: boolean): boolean;
  abstract makeMove(fromX: number, fromY: number, toX: number, toY: number): boolean;
  abstract checkGameOver(): GameResult | null;
  abstract getLegalMoves(x: number, y: number, skipTurnCheck?: boolean): { x: number; y: number }[];

  getState(): GameState {
    return {
      board: this.board,
      currentTurn: this.currentTurn as any,
      moves: this.moves,
      moveCount: this.moveCount,
      isOver: this.isOver,
      result: this.result,
    };
  }

  protected isInBounds(x: number, y: number, rows: number, cols: number): boolean {
    return x >= 0 && x < rows && y >= 0 && y < cols;
  }
}
