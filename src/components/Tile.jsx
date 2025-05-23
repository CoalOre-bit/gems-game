import React from "react";
import { motion } from "framer-motion";
import "./Tile.css";

const cellSize = 60;

const Tile = ({ index, width, tile, selected, onClick, flash }) => {
  if (!tile) return null;

  const col = index % width;
  const row = Math.floor(index / width);

  const x = col * cellSize;
  const y = row * cellSize;
  const spawnY = -cellSize * (row + 2);

  return (
    <motion.div
      className={`tile ${selected ? "selected" : ""} ${flash ? "flash" : ""}`}
      onClick={onClick}
      layoutId={String(tile.id)}
      initial={tile.justSpawned ? { x, y: spawnY } : false}
      animate={{ x, y }}
      transition={{
        type: "spring",
        damping: 15,
        stiffness: 200,
      }}
    >
      <img src={tile.img} alt={tile.name} className="tile-img" />
    </motion.div>
  );
};

export default Tile;
