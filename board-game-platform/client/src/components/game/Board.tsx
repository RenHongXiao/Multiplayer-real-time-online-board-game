import { useRef, useEffect, useCallback } from 'react';
import { useGameStore } from '../../stores/gameStore';
import { getSocket } from '../../services/socket';

const CELL_SIZE = 50;
const PADDING = 40;
const PIECE_RADIUS = 22;

export function Board() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const {
    gameState, gameType, myColor, selectedPiece, legalMoves,
    setSelectedPiece, setLegalMoves,
  } = useGameStore();

  const isGomoku = gameType === 'gomoku';
  const rows = isGomoku ? 15 : 10;
  const cols = isGomoku ? 15 : 9;
  const width = PADDING * 2 + (cols - 1) * CELL_SIZE;
  const height = PADDING * 2 + (rows - 1) * CELL_SIZE;

  // Black player in Chinese Chess sees a flipped board
  const flipped = !isGomoku && myColor === 'black';

  // Engine coords → display coords
  const toDisplay = useCallback((r: number, c: number): [number, number] => {
    if (flipped) return [rows - 1 - r, cols - 1 - c];
    return [r, c];
  }, [flipped, rows, cols]);

  // Display coords → engine coords
  const toEngine = useCallback((r: number, c: number): [number, number] => {
    if (flipped) return [rows - 1 - r, cols - 1 - c];
    return [r, c];
  }, [flipped, rows, cols]);

  const getBoardPos = useCallback((clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const scaleX = width / rect.width;
    const scaleY = height / rect.height;
    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;
    const displayCol = Math.round((x - PADDING) / CELL_SIZE);
    const displayRow = Math.round((y - PADDING) / CELL_SIZE);
    if (displayCol < 0 || displayCol >= cols || displayRow < 0 || displayRow >= rows) return null;
    const [engineRow, engineCol] = toEngine(displayRow, displayCol);
    return { x: engineRow, y: engineCol };
  }, [width, height, cols, rows, toEngine]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);

    // Background
    ctx.fillStyle = '#d4a574';
    ctx.fillRect(0, 0, width, height);

    // Grid
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    for (let i = 0; i < rows; i++) {
      ctx.beginPath();
      ctx.moveTo(PADDING, PADDING + i * CELL_SIZE);
      ctx.lineTo(PADDING + (cols - 1) * CELL_SIZE, PADDING + i * CELL_SIZE);
      ctx.stroke();
    }
    for (let i = 0; i < cols; i++) {
      ctx.beginPath();
      ctx.moveTo(PADDING + i * CELL_SIZE, PADDING);
      ctx.lineTo(PADDING + i * CELL_SIZE, PADDING + (rows - 1) * CELL_SIZE);
      ctx.stroke();
    }

    // Chinese Chess specific: river and palace (drawn at fixed display positions)
    if (!isGomoku) {
      ctx.fillStyle = '#333';
      ctx.font = 'bold 20px serif';
      ctx.textAlign = 'center';
      const midY = PADDING + 4.5 * CELL_SIZE;
      ctx.fillText('楚 河', PADDING + (cols - 1) * CELL_SIZE / 4, midY + 6);
      ctx.fillText('汉 界', PADDING + 3 * (cols - 1) * CELL_SIZE / 4, midY + 6);

      const drawPalace = (engineStartRow: number) => {
        const [r1, c1] = toDisplay(engineStartRow, 3);
        const [r2, c2] = toDisplay(engineStartRow + 2, 5);
        const [r3, c3] = toDisplay(engineStartRow, 5);
        const [r4, c4] = toDisplay(engineStartRow + 2, 3);
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(PADDING + c1 * CELL_SIZE, PADDING + r1 * CELL_SIZE);
        ctx.lineTo(PADDING + c2 * CELL_SIZE, PADDING + r2 * CELL_SIZE);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(PADDING + c3 * CELL_SIZE, PADDING + r3 * CELL_SIZE);
        ctx.lineTo(PADDING + c4 * CELL_SIZE, PADDING + r4 * CELL_SIZE);
        ctx.stroke();
      };
      drawPalace(0);
      drawPalace(7);
    }

    // Legal move indicators (engine → display)
    if (selectedPiece) {
      for (const move of legalMoves) {
        const [dr, dc] = toDisplay(move.x, move.y);
        const cx = PADDING + dc * CELL_SIZE;
        const cy = PADDING + dr * CELL_SIZE;
        ctx.fillStyle = 'rgba(0, 180, 0, 0.5)';
        ctx.beginPath();
        ctx.arc(cx, cy, 8, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Chinese Chess pieces (engine → display)
    if (gameState && !isGomoku) {
      for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
          const piece = gameState.board[i]?.[j];
          if (!piece) continue;

          const [dr, dc] = toDisplay(i, j);
          const cx = PADDING + dc * CELL_SIZE;
          const cy = PADDING + dr * CELL_SIZE;

          ctx.fillStyle = '#faf3e0';
          ctx.beginPath();
          ctx.arc(cx, cy, PIECE_RADIUS, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = piece.color === 'red' ? '#c0392b' : '#1a1a2e';
          ctx.lineWidth = 2;
          ctx.stroke();

          ctx.beginPath();
          ctx.arc(cx, cy, PIECE_RADIUS - 4, 0, Math.PI * 2);
          ctx.strokeStyle = piece.color === 'red' ? '#c0392b' : '#1a1a2e';
          ctx.lineWidth = 1;
          ctx.stroke();

          ctx.fillStyle = piece.color === 'red' ? '#c0392b' : '#1a1a2e';
          ctx.font = 'bold 18px "KaiTi", "楷体", serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';

          const nameMap: Record<string, string> = {
            king: piece.color === 'red' ? '帅' : '将',
            advisor: piece.color === 'red' ? '仕' : '士',
            elephant: piece.color === 'red' ? '相' : '象',
            knight: piece.color === 'red' ? '馬' : '馬',
            rook: piece.color === 'red' ? '車' : '車',
            cannon: piece.color === 'red' ? '炮' : '砲',
            pawn: piece.color === 'red' ? '兵' : '卒',
          };

          ctx.fillText(nameMap[piece.type] || piece.type, cx, cy);
        }
      }

      // Highlight selected piece (engine → display)
      if (selectedPiece) {
        const [sr, sc] = toDisplay(selectedPiece.x, selectedPiece.y);
        const sx = PADDING + sc * CELL_SIZE;
        const sy = PADDING + sr * CELL_SIZE;
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(sx, sy, PIECE_RADIUS + 3, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    // Gomoku stones (no flipping needed — symmetric board)
    if (isGomoku && gameState) {
      for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
          const stone = gameState.board[i]?.[j];
          if (!stone) continue;

          const cx = PADDING + j * CELL_SIZE;
          const cy = PADDING + i * CELL_SIZE;

          const gradient = ctx.createRadialGradient(cx - 3, cy - 3, 2, cx, cy, PIECE_RADIUS);
          if (stone === 'black' || (typeof stone === 'object' && stone.color === 'black')) {
            gradient.addColorStop(0, '#555');
            gradient.addColorStop(1, '#111');
          } else {
            gradient.addColorStop(0, '#fff');
            gradient.addColorStop(1, '#ccc');
          }
          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.arc(cx, cy, PIECE_RADIUS, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#333';
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }

      if (gameState.moves.length > 0) {
        const lastMove = gameState.moves[gameState.moves.length - 1];
        const lx = PADDING + lastMove.to.y * CELL_SIZE;
        const ly = PADDING + lastMove.to.x * CELL_SIZE;
        ctx.fillStyle = 'red';
        ctx.beginPath();
        ctx.arc(lx, ly, 5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }, [gameState, gameType, isGomoku, selectedPiece, legalMoves, width, height, cols, rows, toDisplay]);

  useEffect(() => {
    draw();
  }, [draw]);

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const pos = getBoardPos(e.clientX, e.clientY);
    // getBoardPos already returns engine coordinates
    if (!pos || !gameState) return;

    if (isGomoku) {
      if (gameState.currentTurn !== myColor) return;
      const socket = getSocket();
      if (!socket) return;
      const roomId = useGameStore.getState().roomId;
      if (roomId) socket.emit('make_move', { roomId, from: pos, to: pos });
      return;
    }

    // Chinese Chess: select piece first, then destination
    const piece = gameState.board[pos.x]?.[pos.y];

    if (selectedPiece) {
      if (piece && piece.color === myColor) {
        setSelectedPiece(pos);
        setLegalMoves([]);
        return;
      }
      const socket = getSocket();
      if (socket && gameState.currentTurn === myColor) {
        const roomId = useGameStore.getState().roomId;
        if (roomId) socket.emit('make_move', { roomId, from: selectedPiece, to: pos });
      }
      setSelectedPiece(null);
      setLegalMoves([]);
    } else {
      if (piece && piece.color === myColor) {
        setSelectedPiece(pos);
        setLegalMoves([]);
      }
    }
  };

  return (
    <canvas
      ref={canvasRef}
      onClick={handleClick}
      className="rounded-lg shadow-2xl cursor-pointer border-4 border-amber-800"
    />
  );
}
