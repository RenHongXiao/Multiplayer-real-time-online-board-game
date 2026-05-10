import { Gomoku } from '../Gomoku';

/**
 * Gomoku AI using minimax with alpha-beta pruning.
 * Searches depth 3, candidate moves limited to cells near existing stones.
 */
export class GomokuAI {
  private readonly SIZE = 15;
  private readonly DEPTH = 3;

  findBestMove(game: Gomoku): { x: number; y: number } {
    const candidates = this.getCandidates(game);
    if (candidates.length === 0) {
      // First move — play center
      return { x: 7, y: 7 };
    }

    const aiColor = game.getState().currentTurn;
    let bestScore = -Infinity;
    let bestMove = candidates[0];

    for (const move of candidates) {
      const clone = game.clone();
      clone.makeMove(move.x, move.y, 0, 0);

      const score = this.minimax(clone, this.DEPTH - 1, -Infinity, Infinity, false, aiColor);
      if (score > bestScore) {
        bestScore = score;
        bestMove = move;
      }
    }

    return bestMove;
  }

  private minimax(
    game: Gomoku,
    depth: number,
    alpha: number,
    beta: number,
    isMaximizing: boolean,
    aiColor: string
  ): number {
    const state = game.getState();

    if (state.isOver && state.result) {
      if (state.result.winner === aiColor) return 100000 + depth;
      if (state.result.winner === null) return 0;
      return -100000 - depth;
    }

    if (depth === 0) return this.evaluate(game, aiColor);

    const candidates = this.getCandidates(game);
    if (candidates.length === 0) return 0;

    // Limit candidates for performance at depth >= 2
    const searchMoves = depth >= 2 ? candidates.slice(0, 20) : candidates;

    if (isMaximizing) {
      let maxEval = -Infinity;
      for (const move of searchMoves) {
        const clone = game.clone();
        clone.makeMove(move.x, move.y, 0, 0);
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
        clone.makeMove(move.x, move.y, 0, 0);
        const evalScore = this.minimax(clone, depth - 1, alpha, beta, true, aiColor);
        minEval = Math.min(minEval, evalScore);
        beta = Math.min(beta, evalScore);
        if (beta <= alpha) break;
      }
      return minEval;
    }
  }

  private evaluate(game: Gomoku, aiColor: string): number {
    const board = game.getBoard();
    const opponentColor = aiColor === 'black' ? 'white' : 'black';
    let score = 0;

    // Scan all positions for patterns
    for (let i = 0; i < this.SIZE; i++) {
      for (let j = 0; j < this.SIZE; j++) {
        const stone = board[i][j];
        if (stone === aiColor) {
          score += this.evaluatePosition(board, i, j, aiColor);
        } else if (stone === opponentColor) {
          score -= this.evaluatePosition(board, i, j, opponentColor) * 1.1; // Slightly weight defense
        }
      }
    }

    return score;
  }

  private evaluatePosition(
    board: (string | null)[][],
    x: number,
    y: number,
    color: string
  ): number {
    const directions = [[0, 1], [1, 0], [1, 1], [1, -1]];
    let posScore = 0;

    for (const [dx, dy] of directions) {
      const { openEnds, count } = this.countInDirection(board, x, y, dx, dy, color);

      if (count >= 5) posScore += 100000;
      else if (count === 4) {
        if (openEnds === 2) posScore += 10000;
        else if (openEnds === 1) posScore += 1000;
      } else if (count === 3) {
        if (openEnds === 2) posScore += 1000;
        else if (openEnds === 1) posScore += 100;
      } else if (count === 2) {
        if (openEnds === 2) posScore += 100;
        else if (openEnds === 1) posScore += 10;
      } else if (count === 1) {
        if (openEnds === 2) posScore += 10;
        else if (openEnds === 1) posScore += 1;
      }
    }

    return posScore;
  }

  private countInDirection(
    board: (string | null)[][],
    x: number,
    y: number,
    dx: number,
    dy: number,
    color: string
  ): { count: number; openEnds: number } {
    let count = 1;
    let openEnds = 0;

    // Count forward
    for (let i = 1; i < 5; i++) {
      const nx = x + dx * i;
      const ny = y + dy * i;
      if (this.isInBounds(nx, ny) && board[nx][ny] === color) {
        count++;
      } else {
        if (this.isInBounds(nx, ny) && board[nx][ny] === null) openEnds++;
        break;
      }
    }

    // Count backward
    for (let i = 1; i < 5; i++) {
      const nx = x - dx * i;
      const ny = y - dy * i;
      if (this.isInBounds(nx, ny) && board[nx][ny] === color) {
        count++;
      } else {
        if (this.isInBounds(nx, ny) && board[nx][ny] === null) openEnds++;
        break;
      }
    }

    return { count, openEnds };
  }

  private getCandidates(game: Gomoku): { x: number; y: number; score?: number }[] {
    const board = game.getBoard();
    const candidateSet = new Set<string>();

    for (let i = 0; i < this.SIZE; i++) {
      for (let j = 0; j < this.SIZE; j++) {
        if (board[i][j] !== null) {
          // Add empty cells within 2 of this stone
          for (let dx = -2; dx <= 2; dx++) {
            for (let dy = -2; dy <= 2; dy++) {
              const nx = i + dx;
              const ny = j + dy;
              if (this.isInBounds(nx, ny) && board[nx][ny] === null) {
                candidateSet.add(`${nx},${ny}`);
              }
            }
          }
        }
      }
    }

    interface ScoredMove {
      x: number;
      y: number;
      score: number;
    }

    const candidates: ScoredMove[] = [];
    for (const key of candidateSet) {
      const [x, y] = key.split(',').map(Number);
      // Quick heuristic: prefer center and near existing stones
      const centerDist = Math.abs(x - 7) + Math.abs(y - 7);
      const neighborScore = this.countNeighbors(board, x, y);
      const quickScore = neighborScore * 10 - centerDist;
      candidates.push({ x, y, score: quickScore });
    }

    // Sort by heuristic score descending
    candidates.sort((a, b) => b.score - a.score);
    return candidates.slice(0, 30); // Top 30 candidates for depth 3
  }

  private countNeighbors(board: (string | null)[][], x: number, y: number): number {
    let count = 0;
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        if (dx === 0 && dy === 0) continue;
        const nx = x + dx;
        const ny = y + dy;
        if (this.isInBounds(nx, ny) && board[nx][ny] !== null) {
          count++;
        }
      }
    }
    return count;
  }

  private isInBounds(x: number, y: number): boolean {
    return x >= 0 && x < this.SIZE && y >= 0 && y < this.SIZE;
  }
}
