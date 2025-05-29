import React, { useState, useEffect, useRef, useCallback } from "react";

/* ENHANCED VISIBILITY PATCH */

// --- Constants ---
const ROWS = 20;
const COLS = 10;
// Enlarge blocks for better visibility, but keep compact enough for typical 1080p screens
const BLOCK_SIZE = 30; // px (was 20)
const SIDEBAR_MIN_WIDTH = 170; // px, increased from 110
const SIDEBAR_MAX_WIDTH = 220; // px

const COLORS = {
  I: "#00adb5", // accent
  O: "#ffd166",
  T: "#a24ad1",
  S: "#06d6a0",
  Z: "#ef476f",
  J: "#118ab2",
  L: "#e87a41",
  EMPTY: "#222831", // board bg (primary)
  OUTLINE: "#393e46" // secondary
};
const GAME_STATES = {
  READY: "ready",
  RUNNING: "running",
  GAME_OVER: "gameover"
};

// --- Tetromino Shapes and Rotations ---
const TETROMINOS = {
  I: {
    shape: [
      [0, 0, 0, 0],
      [1, 1, 1, 1],
      [0, 0, 0, 0],
      [0, 0, 0, 0]
    ],
    rotations: 2
  },
  O: {
    shape: [
      [1, 1],
      [1, 1]
    ],
    rotations: 1,
  },
  T: {
    shape: [
      [0, 1, 0],
      [1, 1, 1],
      [0, 0, 0]
    ],
    rotations: 4
  },
  S: {
    shape: [
      [0, 1, 1],
      [1, 1, 0],
      [0, 0, 0]
    ],
    rotations: 2
  },
  Z: {
    shape: [
      [1, 1, 0],
      [0, 1, 1],
      [0, 0, 0]
    ],
    rotations: 2
  },
  J: {
    shape: [
      [1, 0, 0],
      [1, 1, 1],
      [0, 0, 0]
    ],
    rotations: 4
  },
  L: {
    shape: [
      [0, 0, 1],
      [1, 1, 1],
      [0, 0, 0]
    ],
    rotations: 4
  }
};

// --- Utilities ---
function randomTetrominoKey() {
  const keys = Object.keys(TETROMINOS);
  return keys[Math.floor(Math.random() * keys.length)];
}

// Rotates a matrix clockwise by 90deg
function rotate(matrix) {
  return matrix[0].map((_, i) => matrix.map(row => row[i]).reverse());
}

// Deep copy 2d array
function cloneGrid(grid) {
  return grid.map(row => [...row]);
}

// Spawns tetromino at the top center
function getInitialTetromino() {
  const key = randomTetrominoKey();
  const shape = TETROMINOS[key].shape;
  const size = shape.length;
  // Center horizontally
  const x = Math.floor(COLS / 2) - Math.ceil(size / 2);
  return {
    key,
    shape,
    pos: { x, y: 0 },
    rotation: 0
  };
}


// PUBLIC_INTERFACE
function TetraMaster() {
  // --- State ---
  const [board, setBoard] = useState(createBoard());
  const [current, setCurrent] = useState(getInitialTetromino());
  const [next, setNext] = useState(getInitialTetromino());
  const [score, setScore] = useState(0);
  const [lines, setLines] = useState(0);
  const [level, setLevel] = useState(1);
  const [gameState, setGameState] = useState(GAME_STATES.READY);

  // Timer stuff
  const dropIntervalRef = useRef(null);
  const gameStateRef = useRef(gameState);
  const boardRef = useRef(board);
  const currentRef = useRef(current);
  const updatingRef = { boardRef, currentRef };

  // --- Effects ---

  // Store latest refs
  useEffect(() => { gameStateRef.current = gameState; }, [gameState]);
  useEffect(() => { boardRef.current = board; }, [board]);
  useEffect(() => { currentRef.current = current; }, [current]);

  // Key events
  useEffect(() => {
    if (gameState !== GAME_STATES.RUNNING) return;
    const handleKey = (e) => {
      // Disable browser key repeat
      if (e.repeat) return;
      let moved = false;
      switch (e.key) {
        case "ArrowLeft":
          moved = tryMove(-1, 0);
          break;
        case "ArrowRight":
          moved = tryMove(1, 0);
          break;
        case "ArrowDown":
          moved = tryMove(0, 1);
          break;
        case "ArrowUp":
          tryRotate();
          break;
        case " ":
          e.preventDefault();
          hardDrop();
          break;
        default: break;
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
    // eslint-disable-next-line
  }, [current, board, gameState]);

  // Falling interval
  useEffect(() => {
    if (gameState !== GAME_STATES.RUNNING) return;
    clearInterval(dropIntervalRef.current);
    dropIntervalRef.current = setInterval(() => {
      if (!tryMove(0, 1)) {
        placeTetromino();
      }
    }, getDropInterval(level));
    return () => clearInterval(dropIntervalRef.current);
    // eslint-disable-next-line
  }, [current, board, level, gameState]);

  // --- Game Logic Functions ---

  function createBoard() {
    return Array.from({ length: ROWS }, () =>
      Array(COLS).fill(null)
    );
  }

  function getDropInterval(level) {
    // Decrease interval as level increases (min 100ms)
    return Math.max(1200 - (level - 1) * 80, 100);
  }

  function resetGame() {
    setBoard(createBoard());
    const first = getInitialTetromino();
    const second = getInitialTetromino();
    setCurrent(first);
    setNext(second);
    setScore(0);
    setLines(0);
    setLevel(1);
    setGameState(GAME_STATES.RUNNING);
  }

  // Try move by (dx,dy), returns true if moved
  function tryMove(dx, dy) {
    const nPos = { x: current.pos.x + dx, y: current.pos.y + dy };
    if (!collides(current.shape, nPos, board)) {
      setCurrent({ ...current, pos: nPos });
      return true;
    }
    return false;
  }

  // Try rotate
  function tryRotate() {
    const shape = nextRotation(current.shape);
    let nPos = { ...current.pos };
    // Wall kick: shift left/righ to fit if barely colliding
    const shifts = [0, -1, 1, -2, 2];
    let rotated = false;
    for (let shift of shifts) {
      nPos.x = current.pos.x + shift;
      if (!collides(shape, nPos, board)) {
        setCurrent({
          ...current,
          shape,
          pos: { ...nPos },
          rotation: (current.rotation + 1) % TETROMINOS[current.key].rotations
        });
        rotated = true;
        break;
      }
    }
    return rotated;
  }

  function nextRotation(shape) {
    return rotate(shape);
  }

  // Checks collision of shape at position (x, y)
  function collides(shape, pos, board) {
    for (let r = 0; r < shape.length; ++r) {
      for (let c = 0; c < shape[r].length; ++c) {
        if (shape[r][c]) {
          const x = pos.x + c;
          const y = pos.y + r;
          if (
            x < 0 ||
            x >= COLS ||
            y >= ROWS ||
            (y >= 0 && board[y][x])
          ) {
            return true;
          }
        }
      }
    }
    return false;
  }

  // Hard drop (space): move shape downward until can't
  function hardDrop() {
    let { pos, shape } = current;
    let y = pos.y;
    while (!collides(shape, { x: pos.x, y: y + 1 }, board)) {
      y++;
    }
    setCurrent({ ...current, pos: { x: pos.x, y } });
    placeTetromino(shape, { x: pos.x, y });
  }

  // Merge block into board, then check for line clears/game over
  function placeTetromino(localShape = null, localPos = null) {
    const shape = localShape || current.shape;
    const pos = localPos || current.pos;
    const newBoard = cloneGrid(board);

    // Paint current tetromino onto the board
    for (let r = 0; r < shape.length; ++r) {
      for (let c = 0; c < shape[r].length; ++c) {
        if (shape[r][c]) {
          const x = pos.x + c;
          const y = pos.y + r;
          if (y >= 0 && y < ROWS && x >= 0 && x < COLS) {
            newBoard[y][x] = current.key;
          }
        }
      }
    }
    // Clear full lines
    const { cleared, newBoard: clearedBoard } = clearLines(newBoard);
    // Game over? If new shape at spawn collides
    const nextTet = next;
    const nextShape = nextTet.shape;
    const spawnPos = {
      x: Math.floor(COLS / 2) - Math.ceil(nextShape.length / 2),
      y: 0
    };
    if (collides(nextShape, spawnPos, clearedBoard)) {
      setBoard(clearedBoard);
      setGameState(GAME_STATES.GAME_OVER);
      return;
    }
    setBoard(clearedBoard);
    setCurrent({
      ...nextTet,
      pos: { ...spawnPos },
      shape: nextShape,
      rotation: 0
    });
    setNext(getInitialTetromino());
    // Scoring & Level
    if (cleared > 0) {
      setScore(s => s + getScoreForClear(cleared, level));
      setLines(l => {
        const total = l + cleared;
        // Increase level every n lines
        if (Math.floor(l / 10) !== Math.floor(total / 10)) {
          setLevel(lv => lv + 1);
        }
        return total;
      });
    }
  }

  // Returns {cleared, newBoard}
  function clearLines(newBoard) {
    let linesCleared = 0;
    const kept = [];
    for (let row of newBoard) {
      if (row.every(cell => !!cell)) {
        linesCleared++;
      } else {
        kept.push([...row]);
      }
    }
    while (kept.length < ROWS) {
      kept.unshift(Array(COLS).fill(null));
    }
    return { cleared: linesCleared, newBoard: kept };
  }

  function getScoreForClear(linesCleared, level) {
    const scores = [0, 100, 300, 500, 800];
    return (scores[linesCleared] || (linesCleared * 200)) * level;
  }

  // --- Rendering ---

  function renderCell(cell, r, c, falling = false) {
    let color = COLORS.EMPTY;
    let border = COLORS.OUTLINE;
    if (cell && COLORS[cell]) {
      color = COLORS[cell];
      border = "#444";
    }
    if (falling) {
      border = "#fff";
    }
    return (
      <div
        key={c}
        style={{
          width: BLOCK_SIZE,
          height: BLOCK_SIZE,
          background: color,
          border: `1.5px solid ${border}`,
          boxSizing: "border-box",
        }}
      ></div>
    );
  }

  // Returns a grid with the falling tetromino painted over board
  function getDisplayGrid() {
    const grid = cloneGrid(board);
    const { shape, pos, key } = current;
    for (let r = 0; r < shape.length; ++r) {
      for (let c = 0; c < shape[r].length; ++c) {
        if (shape[r][c]) {
          const x = pos.x + c;
          const y = pos.y + r;
          if (y >= 0 && y < ROWS && x >= 0 && x < COLS) {
            grid[y][x] = key.toLowerCase(); // ghost
          }
        }
      }
    }
    return grid;
  }

  function renderBoard() {
    // Overlay falling tetromino
    const overlay = {};
    const { shape, pos } = current;
    for (let r = 0; r < shape.length; ++r) {
      for (let c = 0; c < shape[r].length; ++c) {
        if (shape[r][c]) {
          const x = pos.x + c;
          const y = pos.y + r;
          if (y >= 0 && y < ROWS && x >= 0 && x < COLS) {
            overlay[`${y},${x}`] = true;
          }
        }
      }
    }
    return (
      <div
        style={{
          display: "grid",
          gridTemplateRows: `repeat(${ROWS}, ${BLOCK_SIZE}px)`,
          gridTemplateColumns: `repeat(${COLS}, ${BLOCK_SIZE}px)`,
          background: COLORS.OUTLINE,
          margin: "0px auto",
          boxShadow: "0 0 4px #1119", // smaller shadow
          borderRadius: 5,           // was 12
        }}
      >
        {Array.from({ length: ROWS }).map((_, r) =>
          Array.from({ length: COLS }).map((_, c) => {
            const cell = board[r][c];
            const displayCell = overlay[`${r},${c}`] ? current.key : cell;
            const falling = overlay[`${r},${c}`];
            return renderCell(displayCell, r, c, falling);
          })
        )}
      </div>
    );
  }

  function renderNextBlock() {
    const { key, shape } = next;
    // Make preview block bigger for easier viewing (scaled with play grid size)
    const PREVIEW_BLOCK = 20; // was 13
    return (
      <div
        style={{
          display: "inline-block",
          background: COLORS.SECONDARY,
          padding: "12px 10px 10px 10px", // more padding
          borderRadius: "10px",           // slightly larger
        }}
      >
        <div style={{ color: "#bbb", fontSize: "1rem", marginBottom: "4px" }}>
          Next
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateRows: `repeat(${shape.length}, ${PREVIEW_BLOCK}px)`,
            gridTemplateColumns: `repeat(${shape[0].length}, ${PREVIEW_BLOCK}px)`,
            background: COLORS.OUTLINE,
            borderRadius: "4px",
            boxShadow: "0 1px 5px #191a",
          }}
        >
          {shape.map((row, r) =>
            row.map((cell, c) => (
              <div
                key={c}
                style={{
                  width: PREVIEW_BLOCK,
                  height: PREVIEW_BLOCK,
                  background: cell ? COLORS[key] : "transparent",
                  border: cell ? `1.3px solid #fff7` : "none",
                  boxSizing: "border-box"
                }}
              ></div>
            ))
          )}
        </div>
      </div>
    );
  }

  // --- Main render ---
  return (
    <div
      style={{
        minHeight: "0",
        background: COLORS.EMPTY,
        color: "#fff",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-start",
        paddingTop: "4px" // was 12px
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "flex-start",
          justifyContent: "center",
          gap: "34px", // increased spacing between grid and sidebar
          marginTop: "0"
        }}
      >
        {/* Play Area */}
        <div>{renderBoard()}</div>
        {/* Sidebar */}
        <div
          style={{
            marginLeft: "8px",
            minWidth: SIDEBAR_MIN_WIDTH,
            maxWidth: SIDEBAR_MAX_WIDTH,
            padding: "15px 14px 15px 14px", // more generous padding
            background: COLORS.secondary || "#393e46",
            borderRadius: "14px", // slightly larger
            boxShadow: "0 2px 15px #0007",
            display: "flex",
            flexDirection: "column",
            gap: "24px"
          }}
        >
          <div>{renderNextBlock()}</div>
          <div style={{ marginTop: "-4px" }}>
            <div style={{ color: "#fff", marginBottom: "6px", fontSize: "1.12rem", fontWeight: 500 }}>Score</div>
            <div
              style={{
                color: COLORS.accent,
                fontSize: "1.6rem",
                letterSpacing: "2px",
                fontWeight: "600",
                minHeight: 30
              }}
            >
              {score}
            </div>
          </div>
          <div>
            <div style={{ color: "#fff", marginBottom: "2px", fontSize: "1.03rem" }}>Level</div>
            <div style={{ color: "#ffd166", fontWeight: 600, fontSize: "1.28rem" }}>{level}</div>
          </div>
          <div>
            <div>
              {gameState === GAME_STATES.READY && (
                <button
                  className="btn btn-large"
                  style={{
                    background: COLORS.accent,
                    color: "#fff",
                    marginTop: "12px",
                    fontSize: "1.11rem",
                    padding: "14px 0"
                  }}
                  onClick={resetGame}
                >
                  Start Game
                </button>
              )}
              {gameState === GAME_STATES.RUNNING && (
                <button
                  className="btn"
                  style={{
                    background: COLORS.secondary,
                    color: "#eee",
                    marginTop: "7px",
                    fontSize: "1.06rem"
                  }}
                  onClick={() => setGameState(GAME_STATES.GAME_OVER)}
                >
                  Pause
                </button>
              )}
              {gameState === GAME_STATES.GAME_OVER && (
                <div style={{ marginTop: "15px", textAlign: "center" }}>
                  <div style={{
                    color: "#F35",
                    fontWeight: 700,
                    fontSize: "1.25rem",
                    marginBottom: "6px"
                  }}>Game Over</div>
                  <button
                    className="btn btn-large"
                    style={{
                      background: COLORS.accent,
                      color: "#fff",
                      fontSize: "1.11rem",
                      padding: "14px 0"
                    }}
                    onClick={resetGame}
                  >
                    Restart
                  </button>
                </div>
              )}
            </div>
          </div>
          <div style={{
            marginTop: "10px",
            color: "#bbb",
            fontSize: "0.95rem",
            lineHeight: 1.34,
            textAlign: "left"
          }}>
            <div style={{ fontWeight: 500, color: COLORS.accent, marginBottom: 3 }}>Controls:</div>
            <div>←/→: Move</div>
            <div>↓ or ␣: Hard/Soft Drop</div>
            <div>↑: Rotate</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// PUBLIC_INTERFACE
export default TetraMaster;
