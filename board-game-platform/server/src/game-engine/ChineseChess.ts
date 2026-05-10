import { BaseGame } from './BaseGame';
import { Piece, PieceColor, PieceType, Move, GameResult } from './types';

export class ChineseChess extends BaseGame {
  private readonly ROWS = 10;
  private readonly COLS = 9;

  initialize(): void {
    this.board = Array.from({ length: this.ROWS }, () =>
      Array(this.COLS).fill(null)
    );
    this.currentTurn = 'red';
    this.moves = [];
    this.moveCount = 0;
    this.isOver = false;
    this.result = null;

    const backRow: PieceType[] = [
      'rook', 'knight', 'elephant', 'advisor', 'king',
      'advisor', 'elephant', 'knight', 'rook',
    ];

    for (let col = 0; col < this.COLS; col++) {
      this.board[0][col] = { type: backRow[col], color: 'black' };
      this.board[9][col] = { type: backRow[col], color: 'red' };
    }

    this.board[2][1] = { type: 'cannon', color: 'black' };
    this.board[2][7] = { type: 'cannon', color: 'black' };
    this.board[7][1] = { type: 'cannon', color: 'red' };
    this.board[7][7] = { type: 'cannon', color: 'red' };

    for (let col = 0; col < this.COLS; col += 2) {
      this.board[3][col] = { type: 'pawn', color: 'black' };
      this.board[6][col] = { type: 'pawn', color: 'red' };
    }
  }

  validateMove(fromX: number, fromY: number, toX: number, toY: number, skipTurnCheck = false): boolean {
    if (!this.isInBounds(fromX, fromY, this.ROWS, this.COLS)) return false;
    if (!this.isInBounds(toX, toY, this.ROWS, this.COLS)) return false;

    const piece = this.board[fromX][fromY];
    if (!piece) return false;
    if (!skipTurnCheck && piece.color !== this.currentTurn) return false;

    const target = this.board[toX][toY];
    if (target && target.color === piece.color) return false;

    if (fromX === toX && fromY === toY) return false;

    const valid = this.pieceCanMove(piece, fromX, fromY, toX, toY);
    if (!valid) return false;

    // Simulate move to check if own king is in check after the move
    const captured = this.board[toX][toY];
    this.board[toX][toY] = piece;
    this.board[fromX][fromY] = null;

    const inCheck = this.isKingInCheck(piece.color);

    this.board[fromX][fromY] = piece;
    this.board[toX][toY] = captured;

    return !inCheck;
  }

  makeMove(fromX: number, fromY: number, toX: number, toY: number): boolean {
    if (!this.validateMove(fromX, fromY, toX, toY)) return false;

    const piece = this.board[fromX][fromY]!;
    const captured = this.board[toX][toY];

    this.board[toX][toY] = piece;
    this.board[fromX][fromY] = null;

    this.moves.push({
      from: { x: fromX, y: fromY },
      to: { x: toX, y: toY },
      piece: { ...piece },
      captured: captured ? { ...captured } : undefined,
    });
    this.moveCount++;

    const result = this.checkGameOver();
    if (result) {
      this.isOver = true;
      this.result = result;
    } else {
      this.currentTurn = this.currentTurn === 'red' ? 'black' : 'red';
    }

    return true;
  }

  checkGameOver(): GameResult | null {
    const opponentColor: PieceColor = this.currentTurn === 'red' ? 'black' : 'red';
    const hasLegalMove = this.hasAnyLegalMove(opponentColor);

    if (!hasLegalMove) {
      if (this.isKingInCheck(opponentColor)) {
        return { winner: this.currentTurn as PieceColor, reason: 'checkmate' };
      }
      return { winner: this.currentTurn as PieceColor, reason: 'stalemate' };
    }

    return null;
  }

  getLegalMoves(x: number, y: number, skipTurnCheck = false): { x: number; y: number }[] {
    const piece = this.board[x][y];
    if (!piece) return [];

    const legalMoves: { x: number; y: number }[] = [];

    for (let toX = 0; toX < this.ROWS; toX++) {
      for (let toY = 0; toY < this.COLS; toY++) {
        if (this.validateMove(x, y, toX, toY, skipTurnCheck)) {
          legalMoves.push({ x: toX, y: toY });
        }
      }
    }
    return legalMoves;
  }

  private pieceCanMove(piece: Piece, fx: number, fy: number, tx: number, ty: number): boolean {
    switch (piece.type) {
      case 'king': return this.kingCanMove(piece.color, fx, fy, tx, ty);
      case 'advisor': return this.advisorCanMove(piece.color, fx, fy, tx, ty);
      case 'elephant': return this.elephantCanMove(piece.color, fx, fy, tx, ty);
      case 'knight': return this.knightCanMove(fx, fy, tx, ty);
      case 'rook': return this.rookCanMove(fx, fy, tx, ty);
      case 'cannon': return this.cannonCanMove(fx, fy, tx, ty);
      case 'pawn': return this.pawnCanMove(piece.color, fx, fy, tx, ty);
      default: return false;
    }
  }

  private kingCanMove(color: PieceColor, fx: number, fy: number, tx: number, ty: number): boolean {
    // King stays within the palace (3x3 grid)
    const [minX, maxX] = color === 'red' ? [7, 9] : [0, 2];
    if (tx < minX || tx > maxX || ty < 3 || ty > 5) return false;

    const dx = Math.abs(tx - fx);
    const dy = Math.abs(ty - fy);
    return (dx + dy) === 1;
  }

  private advisorCanMove(color: PieceColor, fx: number, fy: number, tx: number, ty: number): boolean {
    const [minX, maxX] = color === 'red' ? [7, 9] : [0, 2];
    if (tx < minX || tx > maxX || ty < 3 || ty > 5) return false;

    const dx = Math.abs(tx - fx);
    const dy = Math.abs(ty - fy);
    return dx === 1 && dy === 1;
  }

  private elephantCanMove(color: PieceColor, fx: number, fy: number, tx: number, ty: number): boolean {
    // Elephant cannot cross the river
    const maxRiverX = color === 'red' ? 4 : 5;
    if (color === 'red' && tx <= maxRiverX) return false;
    if (color === 'black' && tx >= maxRiverX) return false;

    const dx = Math.abs(tx - fx);
    const dy = Math.abs(ty - fy);
    if (dx !== 2 || dy !== 2) return false;

    // Check elephant eye (blocking piece at the midpoint)
    const eyeX = (fx + tx) / 2;
    const eyeY = (fy + ty) / 2;
    return this.board[eyeX][eyeY] === null;
  }

  private knightCanMove(fx: number, fy: number, tx: number, ty: number): boolean {
    const dx = Math.abs(tx - fx);
    const dy = Math.abs(ty - fy);
    if (!((dx === 2 && dy === 1) || (dx === 1 && dy === 2))) return false;

    // Check knight's leg (blocking piece)
    let legX = fx;
    let legY = fy;
    if (dx === 2) {
      legX = fx + (tx - fx) / 2;
    } else {
      legY = fy + (ty - fy) / 2;
    }
    return this.board[legX][legY] === null;
  }

  private rookCanMove(fx: number, fy: number, tx: number, ty: number): boolean {
    if (fx !== tx && fy !== ty) return false;
    return !this.hasPieceBetween(fx, fy, tx, ty);
  }

  private cannonCanMove(fx: number, fy: number, tx: number, ty: number): boolean {
    if (fx !== tx && fy !== ty) return false;

    const target = this.board[tx][ty];
    const hasBetween = this.hasPieceBetween(fx, fy, tx, ty);

    if (target === null) {
      return !hasBetween;
    }
    // Cannon captures by jumping over exactly one piece
    return hasBetween && this.countPiecesBetween(fx, fy, tx, ty) === 1;
  }

  private pawnCanMove(color: PieceColor, fx: number, fy: number, tx: number, ty: number): boolean {
    const dx = tx - fx;
    const dy = Math.abs(ty - fy);

    if (dy > 1) return false;

    if (color === 'red') {
      // Red pawn moves up (decreasing x)
      if (fx <= 5) {
        // Has crossed river, can also move left/right
        return (dx === -1 && dy === 0) || (dx === 0 && dy === 1);
      }
      // Before crossing river, only forward
      return dx === -1 && dy === 0;
    } else {
      // Black pawn moves down (increasing x)
      if (fx >= 5) {
        // Has crossed river
        return (dx === 1 && dy === 0) || (dx === 0 && dy === 1);
      }
      return dx === 1 && dy === 0;
    }
  }

  private hasPieceBetween(x1: number, y1: number, x2: number, y2: number): boolean {
    if (x1 === x2) {
      const [minY, maxY] = y1 < y2 ? [y1, y2] : [y2, y1];
      for (let y = minY + 1; y < maxY; y++) {
        if (this.board[x1][y] !== null) return true;
      }
    } else if (y1 === y2) {
      const [minX, maxX] = x1 < x2 ? [x1, x2] : [x2, x1];
      for (let x = minX + 1; x < maxX; x++) {
        if (this.board[x][y1] !== null) return true;
      }
    }
    return false;
  }

  private countPiecesBetween(x1: number, y1: number, x2: number, y2: number): number {
    let count = 0;
    if (x1 === x2) {
      const [minY, maxY] = y1 < y2 ? [y1, y2] : [y2, y1];
      for (let y = minY + 1; y < maxY; y++) {
        if (this.board[x1][y] !== null) count++;
      }
    } else if (y1 === y2) {
      const [minX, maxX] = x1 < x2 ? [x1, x2] : [x2, x1];
      for (let x = minX + 1; x < maxX; x++) {
        if (this.board[x][y1] !== null) count++;
      }
    }
    return count;
  }

  private findKing(color: PieceColor): { x: number; y: number } | null {
    for (let x = 0; x < this.ROWS; x++) {
      for (let y = 0; y < this.COLS; y++) {
        const p = this.board[x][y];
        if (p && p.type === 'king' && p.color === color) {
          return { x, y };
        }
      }
    }
    return null;
  }

  private isKingInCheck(color: PieceColor): boolean {
    const king = this.findKing(color);
    if (!king) return true;

    const opponentColor: PieceColor = color === 'red' ? 'black' : 'red';

    // Flying general rule: kings on same column with no pieces between
    const opponentKing = this.findKing(opponentColor);
    if (opponentKing && opponentKing.y === king.y) {
      if (!this.hasPieceBetween(king.x, king.y, opponentKing.x, opponentKing.y)) {
        return true;
      }
    }

    for (let x = 0; x < this.ROWS; x++) {
      for (let y = 0; y < this.COLS; y++) {
        const p = this.board[x][y];
        if (p && p.color === opponentColor) {
          // Skip using validateMove to avoid recursion; use pieceCanMove directly
          const target = this.board[king.x][king.y];
          if (target && target.color !== p.color) {
            if (this.pieceCanMoveDirectly(p, x, y, king.x, king.y)) {
              return true;
            }
          }
        }
      }
    }
    return false;
  }

  private pieceCanMoveDirectly(piece: Piece, fx: number, fy: number, tx: number, ty: number): boolean {
    // Skip king: flying general is already checked separately above
    if (piece.type === 'king') return false;
    return this.pieceCanMove(piece, fx, fy, tx, ty);
  }

  private hasAnyLegalMove(color: PieceColor): boolean {
    for (let x = 0; x < this.ROWS; x++) {
      for (let y = 0; y < this.COLS; y++) {
        const p = this.board[x][y];
        if (p && p.color === color) {
          const moves = this.getLegalMoves(x, y, true);
          if (moves.length > 0) return true;
        }
      }
    }
    return false;
  }
}
