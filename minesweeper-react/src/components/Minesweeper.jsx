import { useState, useEffect, useCallback } from 'react';
import Swal from 'sweetalert2';

const DIFFICULTY_LEVELS = {
  easy: { rows: 9, cols: 9, mines: 10 },
  medium: { rows: 16, cols: 16, mines: 40 },
  hard: { rows: 16, cols: 30, mines: 99 },
};

const Minesweeper = () => {
  const [difficulty, setDifficulty] = useState('easy');
  const [board, setBoard] = useState([]);
  const [gameOver, setGameOver] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [flagsUsed, setFlagsUsed] = useState(0);
  const [timer, setTimer] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  const { rows, cols, mines } = DIFFICULTY_LEVELS[difficulty];

  // Initialize board
  const initializeBoard = useCallback(() => {
    const newBoard = Array(rows).fill(null).map(() =>
      Array(cols).fill(null).map(() => ({
        isMine: false,
        isRevealed: false,
        isFlagged: false,
        neighborMines: 0,
      }))
    );

    // Place mines randomly
    let minesPlaced = 0;
    while (minesPlaced < mines) {
      const r = Math.floor(Math.random() * rows);
      const c = Math.floor(Math.random() * cols);
      if (!newBoard[r][c].isMine) {
        newBoard[r][c].isMine = true;
        minesPlaced++;
      }
    }

    // Calculate neighbor mines
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (!newBoard[r][c].isMine) {
          let count = 0;
          for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
              const nr = r + dr;
              const nc = c + dc;
              if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && newBoard[nr][nc].isMine) {
                count++;
              }
            }
          }
          newBoard[r][c].neighborMines = count;
        }
      }
    }

    return newBoard;
  }, [rows, cols, mines]);

  // Reset game
  const resetGame = useCallback(() => {
    setBoard(initializeBoard());
    setGameOver(false);
    setGameWon(false);
    setFlagsUsed(0);
    setTimer(0);
    setIsRunning(false);
  }, [initializeBoard]);

  // Initialize on mount and difficulty change
  useEffect(() => {
    resetGame();
  }, [resetGame]);

  // Timer
  useEffect(() => {
    let interval;
    if (isRunning && !gameOver && !gameWon) {
      interval = setInterval(() => {
        setTimer((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning, gameOver, gameWon]);

  // Reveal cell
  const revealCell = (r, c) => {
    if (gameOver || gameWon || board[r][c].isRevealed || board[r][c].isFlagged) return;

    if (!isRunning) setIsRunning(true);

    const newBoard = [...board.map((row) => [...row])];

    // Hit a mine
    if (newBoard[r][c].isMine) {
      newBoard[r][c].isRevealed = true;
      setBoard(newBoard);
      setGameOver(true);
      setIsRunning(false);
      
      // Reveal all mines
      for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
          if (newBoard[i][j].isMine) {
            newBoard[i][j].isRevealed = true;
          }
        }
      }
      setBoard(newBoard);

      Swal.fire({
        icon: 'error',
        title: 'Game Over!',
        text: `You hit a mine! Time: ${timer}s`,
        confirmButtonText: 'Play Again',
        confirmButtonColor: '#dc3545',
      }).then(() => resetGame());
      return;
    }

    // Reveal empty cells recursively
    const reveal = (row, col) => {
      if (row < 0 || row >= rows || col < 0 || col >= cols) return;
      if (newBoard[row][col].isRevealed || newBoard[row][col].isFlagged) return;

      newBoard[row][col].isRevealed = true;

      if (newBoard[row][col].neighborMines === 0) {
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            reveal(row + dr, col + dc);
          }
        }
      }
    };

    reveal(r, c);
    setBoard(newBoard);

    // Check win condition
    let revealedCount = 0;
    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        if (newBoard[i][j].isRevealed) revealedCount++;
      }
    }

    if (revealedCount === rows * cols - mines) {
      setGameWon(true);
      setIsRunning(false);
      Swal.fire({
        icon: 'success',
        title: 'Congratulations!',
        text: `You won in ${timer}s!`,
        confirmButtonText: 'Play Again',
        confirmButtonColor: '#28a745',
      }).then(() => resetGame());
    }
  };

  // Toggle flag
  const toggleFlag = (e, r, c) => {
    e.preventDefault();
    if (gameOver || gameWon || board[r][c].isRevealed) return;

    const newBoard = [...board.map((row) => [...row])];
    newBoard[r][c].isFlagged = !newBoard[r][c].isFlagged;
    setBoard(newBoard);
    setFlagsUsed((prev) => prev + (newBoard[r][c].isFlagged ? 1 : -1));
  };

  // Get color for numbers
  const getNumberColor = (num) => {
    const colors = {
      1: 'text-primary',
      2: 'text-success',
      3: 'text-danger',
      4: 'text-dark',
      5: 'text-warning',
      6: 'text-info',
      7: 'text-secondary',
      8: 'text-muted',
    };
    return colors[num] || '';
  };

  return (
    <div className="container py-4">
      <div className="row justify-content-center">
        <div className="col-auto">
          <h1 className="text-center mb-4 display-4 fw-bold">
            <i className="fa fa-bomb text-danger me-2"></i>
            Сапер Pro
            <i className="fa fa-bomb text-danger ms-2"></i>
          </h1>

          {/* Difficulty Selection */}
          <div className="card mb-4 shadow-sm">
            <div className="card-body">
              <div className="btn-group w-100" role="group">
                {Object.keys(DIFFICULTY_LEVELS).map((level) => (
                  <button
                    key={level}
                    className={`btn ${difficulty === level ? 'btn-primary' : 'btn-outline-primary'}`}
                    onClick={() => setDifficulty(level)}
                    disabled={isRunning}
                  >
                    {level.charAt(0).toUpperCase() + level.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Game Info */}
          <div className="card mb-4 shadow-sm">
            <div className="card-body">
              <div className="row text-center">
                <div className="col-4">
                  <div className="display-6 text-danger">
                    <i className="fa fa-flag me-2"></i>
                    {mines - flagsUsed}
                  </div>
                  <small className="text-muted">Mines Left</small>
                </div>
                <div className="col-4">
                  <button className="btn btn-lg btn-success" onClick={resetGame}>
                    <i className="fa fa-refresh"></i>
                  </button>
                  <div className="mt-1">
                    <small className="text-muted">Reset</small>
                  </div>
                </div>
                <div className="col-4">
                  <div className="display-6 text-primary">
                    <i className="fa fa-clock-o me-2"></i>
                    {timer}
                  </div>
                  <small className="text-muted">Seconds</small>
                </div>
              </div>
            </div>
          </div>

          {/* Game Board */}
          <div className="card shadow-lg">
            <div className="card-body p-2">
              <div 
                className="d-inline-block"
                style={{ 
                  display: 'grid',
                  gridTemplateColumns: `repeat(${cols}, 30px)`,
                  gap: '2px',
                }}
              >
                {board.map((row, r) =>
                  row.map((cell, c) => (
                    <div
                      key={`${r}-${c}`}
                      className={`
                        d-flex align-items-center justify-content-center
                        border rounded
                        ${cell.isRevealed 
                          ? cell.isMine 
                            ? 'bg-danger' 
                            : 'bg-light'
                          : 'bg-secondary'}
                        ${!cell.isRevealed && !gameOver && !gameWon ? 'cursor-pointer hover-effect' : ''}
                      `}
                      style={{
                        width: '30px',
                        height: '30px',
                        fontSize: '18px',
                        fontWeight: 'bold',
                        cursor: !cell.isRevealed && !gameOver && !gameWon ? 'pointer' : 'default',
                        transition: 'all 0.2s',
                        boxShadow: cell.isRevealed ? 'none' : '2px 2px 5px rgba(0,0,0,0.3)',
                      }}
                      onClick={() => revealCell(r, c)}
                      onContextMenu={(e) => toggleFlag(e, r, c)}
                    >
                      {cell.isRevealed ? (
                        cell.isMine ? (
                          <i className="fa fa-bomb text-white"></i>
                        ) : cell.neighborMines > 0 ? (
                          <span className={getNumberColor(cell.neighborMines)}>
                            {cell.neighborMines}
                          </span>
                        ) : null
                      ) : cell.isFlagged ? (
                        <i className="fa fa-flag text-warning"></i>
                      ) : null}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="card mt-4 shadow-sm">
            <div className="card-body">
              <h5 className="card-title">
                <i className="fa fa-info-circle text-primary me-2"></i>
                How to Play
              </h5>
              <ul className="mb-0">
                <li>Left-click to reveal a cell</li>
                <li>Right-click to place/remove a flag</li>
                <li>Avoid the mines and clear the board!</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Minesweeper;
