import { BaseGame } from './BaseGame';
import { GameResult } from './types';

type Stone = 'black' | 'white' | null;

export class Gomoku extends BaseGame {
  private readonly SIZE = 15;

  initialize(): void {
    this.board = Array.from({ length: this.SIZE }, () =>
      Array(this.SIZE).fill(null)
    ) as Stone[][];
    this.currentTurn = 'black';
    this.moves = [];
    this.moveCount = 0;
    this.isOver = false;
    this.result = null;
  }

  validateMove(fromX: number, fromY: number, _toX: number, _toY: number, _skipTurnCheck = false): boolean {
    const x = fromX;
    const y = fromY;
    if (!this.isInBounds(x, y, this.SIZE, this.SIZE)) return false;
    if (this.board[x][y] !== null) return false;
    return true;
  }

  makeMove(fromX: number, fromY: number, _toX: number, _toY: number): boolean {
    const x = fromX;
    const y = fromY;

    if (!this.validateMove(x, y, 0, 0)) return false;

    this.board[x][y] = this.currentTurn as Stone;

    this.moves.push({
      from: { x, y },
      to: { x, y },
      piece: { type: 'pawn' as any, color: this.currentTurn as any },
    });
    this.moveCount++;

    const result = this.checkGameOver();
    if (result) {
      this.isOver = true;
      this.result = result;
    } else {
      this.currentTurn = this.currentTurn === 'black' ? 'white' : 'black';
    }

    return true;
  }

  checkGameOver(): GameResult | null {
    if (this.moves.length === 0) return null;

    const lastMove = this.moves[this.moves.length - 1];
    const { x, y } = lastMove.to;
    const color = this.currentTurn as 'black' | 'white';

    if (this.checkFiveInRow(x, y, color)) {
      return { winner: color, reason: 'five-in-row' };
    }

    // Check for draw (board full)
    if (this.moves.length >= this.SIZE * this.SIZE) {
      return { winner: null, reason: 'draw' };
    }

    return null;
  }

  getLegalMoves(_x: number, _y: number, _skipTurnCheck = false): { x: number; y: number }[] {
    const moves: { x: number; y: number }[] = [];
    for (let i = 0; i < this.SIZE; i++) {
      for (let j = 0; j < this.SIZE; j++) {
        if (this.board[i][j] === null) {
          moves.push({ x: i, y: j });
        }
      }
    }
    return moves;
  }

  private checkFiveInRow(x: number, y: number, color: 'black' | 'white'): boolean {
    const directions = [
      [0, 1], [1, 0], [1, 1], [1, -1],
    ];

    for (const [dx, dy] of directions) {
      let count = 1;

      // Count in positive direction
      for (let i = 1; i < 5; i++) {
        const nx = x + dx * i;
        const ny = y + dy * i;
        if (this.isInBounds(nx, ny, this.SIZE, this.SIZE) && this.board[nx][ny] === color) {
          count++;
        } else {
          break;
        }
      }

      // Count in negative direction
      for (let i = 1; i < 5; i++) {
        const nx = x - dx * i;
        const ny = y - dy * i;
        if (this.isInBounds(nx, ny, this.SIZE, this.SIZE) && this.board[nx][ny] === color) {
          count++;
        } else {
          break;
        }
      }

      if (count >= 5) return true;
    }
    return false;
  }
}
