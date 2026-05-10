import { ChineseChess } from '../ChineseChess';
import { Piece, PieceColor } from '../types';

/**
 * Chinese Chess AI using minimax with alpha-beta pruning.
 * Searches depth 3, evaluates based on material + positional value.
 */
export class ChineseChessAI {
  private readonly DEPTH = 3;

  private readonly PIECE_VALUES: Record<string, number> = {
    king: 10000,
    rook: 600,
    cannon: 300,
    knight: 270,
    elephant: 120,
    advisor: 120,
    pawn: 30,
  };

  findBestMove(game: ChineseChess): { from: { x: number; y: number }; to: { x: number; y: number } } {
    const aiColor = game.getState().currentTurn as PieceColor;
    let bestScore = -Infinity;
    let bestMove: { from: { x: number; y: number }; to: { x: number; y: number } } | null = null;
    let alpha = -Infinity;
    const beta = Infinity;

    const allMoves = this.getAllLegalMoves(game, aiColor);

    // Sort moves by a quick capture heuristic for better pruning
    this.sortMoves(game, allMoves);

    for (const move of allMoves) {
      const clone = game.clone();
      clone.makeMove(move.from.x, move.from.y, move.to.x, move.to.y);

      const score = this.minimax(clone, this.DEPTH - 1, alpha, beta, false, aiColor);
      if (score > bestScore) {
        bestScore = score;
        bestMove = move;
      }
      alpha = Math.max(alpha, score);
      if (beta <= alpha) break;
    }

    return bestMove!;
  }

  private minimax(
    game: ChineseChess,
    depth: number,
    alpha: number,
    beta: number,
    isMaximizing: boolean,
    aiColor: PieceColor
  ): number {
    const state = game.getState();

    if (state.isOver && state.result) {
      if (state.result.winner === aiColor) return 100000 + depth;
      if (state.result.winner === null) return 0;
      return -100000 - depth;
    }

    if (depth === 0) return this.evaluate(game, aiColor);

    const currentColor = state.currentTurn as PieceColor;
    const allMoves = this.getAllLegalMoves(game, currentColor);

    if (allMoves.length === 0) {
      // No legal moves — checkmate or stalemate
      const kingInCheck = this.isKingInCheckOnClone(game, currentColor);
      if (kingInCheck) {
        return currentColor === aiColor ? -100000 - depth : 100000 + depth;
      }
      return 0;
    }

    // Limit moves at higher depths for performance
    const searchMoves = depth <= 1 ? this.sortAndLimit(allMoves, game) : this.sortAndLimit(allMoves, game, 20);

    if (isMaximizing) {
      let maxEval = -Infinity;
      for (const move of searchMoves) {
        const clone = game.clone();
        clone.makeMove(move.from.x, move.from.y, move.to.x, move.to.y);
        const evalScore = this.minimax(clone, depth - 1, alpha, beta, false, aiColor);
        maxEval = Math.max(maxEval, evalScore);
        alpha = Math.max(alpha, evalScore);
        if (beta <= alpha) break;
      }
      return maxEval;
    } else {
      let minEval = Infinity;
      for (const move of searchMoves) {
        const clone = game.clone();
        clone.makeMove(move.from.x, move.from.y, move.to.x, move.to.y);
        const evalScore = this.minimax(clone, depth - 1, alpha, beta, true, aiColor);
        minEval = Math.min(minEval, evalScore);
        beta = Math.min(beta, evalScore);
        if (beta <= alpha) break;
      }
      return minEval;
    }
  }

  private evaluate(game: ChineseChess, aiColor: PieceColor): number {
    const state = game.getState();
    const board = state.board;
    let score = 0;

    for (let i = 0; i < 10; i++) {
      for (let j = 0; j < 9; j++) {
        const piece = board[i]?.[j] as Piece | null;
        if (!piece) continue;

        const baseValue = this.PIECE_VALUES[piece.type] || 0;
        const posBonus = this.positionBonus(piece, i, j);

        if (piece.color === aiColor) {
          score += baseValue + posBonus;
        } else {
          score -= baseValue + posBonus;
        }
      }
    }

    // Bonus for checking opponent king
    const opponentColor: PieceColor = aiColor === 'red' ? 'black' : 'red';
    if (this.isKingInCheckOnClone(game, opponentColor)) {
      score += 50;
    }

    return score;
  }

  private positionBonus(piece: Piece, x: number, y: number): number {
    switch (piece.type) {
      case 'pawn': {
        // Pawns are more valuable after crossing the river
        if (piece.color === 'red') return x <= 4 ? 50 : 0;
        return x >= 5 ? 50 : 0;
      }
      case 'knight': {
        // Knights are better near the center
        const centerDist = Math.abs(y - 4);
        return (4 - centerDist) * 10;
      }
      case 'rook': {
        // Rooks are better on open files or near center
        const centerDist = Math.abs(y - 4);
        return (4 - centerDist) * 5;
      }
      case 'cannon': {
        const centerDist = Math.abs(y - 4);
        return (4 - centerDist) * 5;
      }
      default:
        return 0;
    }
  }

  private getAllLegalMoves(
    game: ChineseChess,
    color: PieceColor
  ): { from: { x: number; y: number }; to: { x: number; y: number }; score?: number }[] {
    const state = game.getState();
    const board = state.board;
    const moves: { from: { x: number; y: number }; to: { x: number; y: number }; score?: number }[] = [];

    for (let i = 0; i < 10; i++) {
      for (let j = 0; j < 9; j++) {
        const piece = board[i]?.[j] as Piece | null;
        if (piece && piece.color === color) {
          const legalMoves = game.getLegalMoves(i, j, true);
          for (const m of legalMoves) {
            const target = board[m.x]?.[m.y] as Piece | null;
            // Quick capture heuristic for move ordering
            const captureScore = target ? this.PIECE_VALUES[target.type] || 0 : 0;
            moves.push({
              from: { x: i, y: j },
              to: { x: m.x, y: m.y },
              score: captureScore,
            });
          }
        }
      }
    }

    return moves;
  }

  private sortMoves(
    _game: ChineseChess,
    moves: { from: { x: number; y: number }; to: { x: number; y: number }; score?: number }[]
  ): void {
    moves.sort((a, b) => (b.score || 0) - (a.score || 0));
  }

  private sortAndLimit(
    allMoves: { from: { x: number; y: number }; to: { x: number; y: number }; score?: number }[],
    _game: ChineseChess,
    limit = 15
  ): { from: { x: number; y: number }; to: { x: number; y: number }; score?: number }[] {
    return allMoves.sort((a, b) => (b.score || 0) - (a.score || 0)).slice(0, limit);
  }

  private isKingInCheckOnClone(game: ChineseChess, color: PieceColor): boolean {
    return game.isKingInCheck(color);
  }
}
