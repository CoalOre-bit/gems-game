import React, { useEffect, useState } from "react";
import "./Board.css";
import Tile from "./Tile";
import Cookies from "js-cookie";

import sprite0 from "../assets/sprite_0.svg";
import sprite1 from "../assets/sprite_1.svg";
import sprite2 from "../assets/sprite_2.svg";
import sprite3 from "../assets/sprite_3.svg";
import sprite4 from "../assets/sprite_4.svg";
import sprite5 from "../assets/sprite_5.svg";
import sprite6 from "../assets/sprite_6.svg";

const width = 8;

const tileTypes = [
  { name: "sprite_0", img: sprite0, color: "#ff5555" },
  { name: "sprite_1", img: sprite1, color: "#5599ff" },
  { name: "sprite_2", img: sprite2, color: "#55ff55" },
  { name: "sprite_3", img: sprite3, color: "#ffff55" },
  { name: "sprite_4", img: sprite4, color: "#ff55ff" },
  { name: "sprite_5", img: sprite5, color: "#ffaa55" },
  { name: "sprite_6", img: sprite6, color: "#55ffff" },
];

let idCounter = 0;
const getRandomTile = (justSpawned = false) => {
  const type = tileTypes[Math.floor(Math.random() * tileTypes.length)];
  return {
    id: idCounter++,
    justSpawned,
    ...type,
  };
};

const createBoard = () =>
  Array.from({ length: width * width }, () => getRandomTile(true));

const Board = () => {
  const [board, setBoard] = useState([]);
  const [selected, setSelected] = useState(null);
  const [animating, setAnimating] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(
  Number(Cookies.get("highScore") || 0)
  );
  const [particles, setParticles] = useState([]);
  const [flashingTiles, setFlashingTiles] = useState(new Set());

  useEffect(() => {
    let newBoard = createBoard();
    while (getMatches(newBoard).length > 0) {
      newBoard = createBoard(); // avoid auto matches on load
    }
    setBoard(newBoard);
  }, []);

  useEffect(() => {
    if (score > highScore) {
      setHighScore(score);
      Cookies.set("highScore", score, { expires: 365 });
    }
  }, [score]);

  const getMatches = (board) => {
    const matches = [];

    const addMatch = (indices, type, name) => {
      matches.push({ indices, type, name });
    };

    for (let i = 0; i < width * width; i++) {
      const base = board[i];
      if (!base) continue;
      const name = base.name;

      for (let len = 5; len >= 3; len--) {
        if (i % width <= width - len) {
          const group = Array.from({ length: len }, (_, k) => i + k);
          if (group.every(idx => board[idx]?.name === name)) {
            addMatch(group, len, name);
          }
        }

        if (i < width * (width - len + 1)) {
          const group = Array.from({ length: len }, (_, k) => i + k * width);
          if (group.every(idx => board[idx]?.name === name)) {
            addMatch(group, len, name);
          }
        }
      }

      // T or L shape basic check
      if (
        i % width <= width - 3 &&
        i < width * (width - 2) &&
        board[i]?.name === name &&
        board[i + 1]?.name === name &&
        board[i + 2]?.name === name &&
        board[i + width]?.name === name &&
        board[i + width * 2]?.name === name
      ) {
        addMatch([i, i + 1, i + 2, i + width, i + width * 2], "T", name);
      }
    }

    return matches;
  };

  const handleMatches = (inputBoard) => {
  let newBoard = [...inputBoard];
  let matches;
  let totalScore = 0;

  do {
    matches = getMatches(newBoard);
    if (matches.length === 0) break;

    const matchedIndices = new Set();
    const newParticles = [];
    const flashSet = new Set();

    matches.forEach(({ indices, type, name }) => {
      const unique = [...new Set(indices)];
      unique.forEach(idx => {
        matchedIndices.add(idx);
        flashSet.add(idx);
        newParticles.push({
          id: `p-${idx}-${Date.now()}`,
          index: idx,
          color: tileTypes.find(t => t.name === name).color,
        });
      });

      const points =
        type === "T" || type === "L"
          ? 150
          : type === 5
          ? 100
          : type === 4
          ? 60
          : 30;
      totalScore += points;
    });

    setFlashingTiles(flashSet);
    setTimeout(() => setFlashingTiles(new Set()), 150);
    setParticles(prev => [...prev, ...newParticles]);
    setScore(prev => prev + totalScore);

    matchedIndices.forEach(idx => {
      newBoard[idx] = null;
    });

    // Drop and refill
    for (let col = 0; col < width; col++) {
      const column = [];
      for (let row = width - 1; row >= 0; row--) {
        const idx = row * width + col;
        if (newBoard[idx] !== null) {
          column.push(newBoard[idx]);
        }
      }

      while (column.length < width) {
        column.push(getRandomTile(true));
      }

      for (let row = width - 1; row >= 0; row--) {
        const idx = row * width + col;
        newBoard[idx] = column[width - 1 - row];
      }
    }
  } while (matches.length > 0);

  return { newBoard };
};


  const handleClick = (index) => {
  if (animating) return;

  if (selected === null) {
    setSelected(index);
    return;
  }

  const validMoves = [
    selected - 1,
    selected + 1,
    selected - width,
    selected + width,
  ];

  if (!validMoves.includes(index)) {
    setSelected(null);
    return;
  }

  const tempBoard = [...board];
  [tempBoard[selected], tempBoard[index]] = [tempBoard[index], tempBoard[selected]];
  setBoard(tempBoard);
  setAnimating(true);

  setTimeout(() => {
    const matchCheck = getMatches(tempBoard);
    if (matchCheck.length > 0) {
      const { newBoard } = handleMatches(tempBoard);
      setBoard(newBoard);
      setAnimating(false);
    } else {
      setTimeout(() => {
        const reverted = [...tempBoard];
        [reverted[selected], reverted[index]] = [reverted[index], reverted[selected]];
        setBoard(reverted);
        setAnimating(false);
      }, 250);
    }
  }, 300);

  setSelected(null);
};


  return (
    <div className="board-wrapper">
      <div className="score-panel">
        <div>Score: {score}</div>
        <div>High Score: {highScore}</div>
        <button onClick={() => {
          Cookies.remove("highScore");
          setHighScore(0);
        
        }}>Reset High Score</button>
      </div>

      <div className="board">
        {board.map((tile, i) => (
          <Tile
            key={tile?.id ?? i}
            index={i}
            width={width}
            tile={tile}
            selected={selected === i}
            flash={flashingTiles.has(i)}
            onClick={() => handleClick(i)}
          />
        ))}

        {particles.map(({ id, index, color }) => {
          const x = (index % width) * 60 + 15;
          const y = Math.floor(index / width) * 60 + 15;
          return (
            <div
              key={id}
              className="particle"
              style={{
                backgroundColor: color,
                top: y,
                left: x,
              }}
              onAnimationEnd={() =>
                setParticles((prev) => prev.filter((p) => p.id !== id))
              }
            />
          );
        })}
      </div>
    </div>
  );
};

export default Board;
