
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { XSquare, Trophy } from 'lucide-react';

// Game constants
const GAME_AREA_WIDTH_TOTAL = 800; // Total width for both players
const GAME_AREA_HEIGHT = 250;
const PLAYER_AREA_WIDTH = GAME_AREA_WIDTH_TOTAL / 2;

const BASKET_WIDTH = 40;
const BASKET_HEIGHT = 20;
const BASKET_Y_OFFSET = 30; // Distance from bottom
const BASKET_SPEED = 15;

const FRUIT_RADIUS = 15;
const FRUIT_FALL_SPEED = 4;
const FRUIT_SPAWN_INTERVAL = 250; // ms
const FRUIT_TYPES = ['🍎', '🍌', '🍓', '🍇', '🍊', '🍍', '🍉'];

const GAME_DURATION_SECONDS = 30;

interface Fruit {
  id: number;
  x: number;
  y: number;
  type: string;
  playerArea: 1 | 2;
}

interface FruitCatcherGameProps {
  onClose: () => void;
}

export function FruitCatcherGame({ onClose }: FruitCatcherGameProps) {
  const [baskets, setBaskets] = useState([
    { x: PLAYER_AREA_WIDTH / 2 - BASKET_WIDTH / 2, y: GAME_AREA_HEIGHT - BASKET_HEIGHT - BASKET_Y_OFFSET, player: 1 as const },
    { x: PLAYER_AREA_WIDTH / 2 - BASKET_WIDTH / 2, y: GAME_AREA_HEIGHT - BASKET_HEIGHT - BASKET_Y_OFFSET, player: 2 as const },
  ]);
  const [fruits, setFruits] = useState<Fruit[]>([]);
  const [scores, setScores] = useState({ p1: 0, p2: 0 });
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION_SECONDS);
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState<string | null>(null);

  const keysPressed = useRef<Record<string, boolean>>({});
  const gameLoopRef = useRef<number>();
  const fruitSpawnTimerRef = useRef<NodeJS.Timeout>();
  const gameTimerRef = useRef<NodeJS.Timeout>();
  const fruitIdCounter = useRef(0);

  const resetGame = useCallback(() => {
    setBaskets([
      { x: PLAYER_AREA_WIDTH / 2 - BASKET_WIDTH / 2, y: GAME_AREA_HEIGHT - BASKET_HEIGHT - BASKET_Y_OFFSET, player: 1 },
      { x: PLAYER_AREA_WIDTH / 2 - BASKET_WIDTH / 2, y: GAME_AREA_HEIGHT - BASKET_HEIGHT - BASKET_Y_OFFSET, player: 2 },
    ]);
    setFruits([]);
    setScores({ p1: 0, p2: 0 });
    setTimeLeft(GAME_DURATION_SECONDS);
    setGameOver(false);
    setWinner(null);
    fruitIdCounter.current = 0;

    if (fruitSpawnTimerRef.current) clearInterval(fruitSpawnTimerRef.current);
    if (gameTimerRef.current) clearInterval(gameTimerRef.current);

    fruitSpawnTimerRef.current = setInterval(spawnFruit, FRUIT_SPAWN_INTERVAL);
    gameTimerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setGameOver(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  const spawnFruit = () => {
    if (gameOver) return;
    const playerArea = (Math.random() < 0.5 ? 1 : 2) as 1 | 2;
    const newFruit: Fruit = {
      id: fruitIdCounter.current++,
      x: Math.random() * (PLAYER_AREA_WIDTH - FRUIT_RADIUS * 2) + FRUIT_RADIUS,
      y: -FRUIT_RADIUS,
      type: FRUIT_TYPES[Math.floor(Math.random() * FRUIT_TYPES.length)],
      playerArea,
    };
    setFruits(prev => [...prev, newFruit]);
  };

  useEffect(() => {
    resetGame();

    const handleKeyDown = (event: KeyboardEvent) => {
      keysPressed.current[event.key.toLowerCase()] = true;
    };
    const handleKeyUp = (event: KeyboardEvent) => {
      keysPressed.current[event.key.toLowerCase()] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
      if (fruitSpawnTimerRef.current) clearInterval(fruitSpawnTimerRef.current);
      if (gameTimerRef.current) clearInterval(gameTimerRef.current);
    };
  }, [resetGame]);

  useEffect(() => {
    if (gameOver) {
      if (fruitSpawnTimerRef.current) clearInterval(fruitSpawnTimerRef.current);
      if (gameTimerRef.current) clearInterval(gameTimerRef.current);
      if (scores.p1 > scores.p2) setWinner("Player 1 Wins!");
      else if (scores.p2 > scores.p1) setWinner("Player 2 Wins!");
      else setWinner("It's a Tie!");
      return;
    }

    const gameLoop = () => {
      // Update basket positions
      setBaskets(prevBaskets => prevBaskets.map(basket => {
        let newX = basket.x;
        if (basket.player === 1) {
          if (keysPressed.current['a']) newX -= BASKET_SPEED;
          if (keysPressed.current['d']) newX += BASKET_SPEED;
        } else { // Player 2
          if (keysPressed.current['arrowleft']) newX -= BASKET_SPEED;
          if (keysPressed.current['arrowright']) newX += BASKET_SPEED;
        }
        newX = Math.max(0, Math.min(newX, PLAYER_AREA_WIDTH - BASKET_WIDTH));
        return { ...basket, x: newX };
      }));

      // Update fruit positions and check for catches/misses
      setFruits(prevFruits => {
        const updatedFruits = prevFruits.map(fruit => ({ ...fruit, y: fruit.y + FRUIT_FALL_SPEED }));
        const remainingFruits: Fruit[] = [];

        for (const fruit of updatedFruits) {
          const basket = baskets[fruit.playerArea - 1];
          // Check for catch
          if (
            fruit.y + FRUIT_RADIUS > basket.y &&
            fruit.y - FRUIT_RADIUS < basket.y + BASKET_HEIGHT &&
            fruit.x > basket.x &&
            fruit.x < basket.x + BASKET_WIDTH
          ) {
            setScores(prevScores => {
              if (fruit.playerArea === 1) return { ...prevScores, p1: prevScores.p1 + 1 };
              return { ...prevScores, p2: prevScores.p2 + 1 };
            });
          } else if (fruit.y - FRUIT_RADIUS < GAME_AREA_HEIGHT) {
            remainingFruits.push(fruit); // Keep fruit if it's still on screen and not caught
          }
        }
        return remainingFruits;
      });

      gameLoopRef.current = requestAnimationFrame(gameLoop);
    };

    if (!gameOver) {
      gameLoopRef.current = requestAnimationFrame(gameLoop);
    }

    return () => {
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
    };
  }, [gameOver, baskets]); // baskets is needed for collision detection

  const getPlayerAreaTransform = (playerIndex: number) => {
    return playerIndex === 0 ? `translate(0,0)` : `translate(${PLAYER_AREA_WIDTH},0)`;
  }

  return (
    <div className="flex flex-col items-center justify-center w-full h-full bg-sky-700 text-white p-4 relative">
      <Button
        variant="ghost"
        size="icon"
        onClick={onClose}
        className="absolute top-4 right-4 text-white hover:bg-sky-600"
        aria-label="Close Fruit Catcher Game"
      >
        <XSquare size={32} />
      </Button>
      <h2 className="text-3xl font-bold mb-2 font-headline">Fruit Frenzy!</h2>
      <div className="text-xl mb-1">
        P1 (A/D): {scores.p1} Fruits | P2 (←/→): {scores.p2} Fruits
      </div>
      <div className="text-2xl mb-3 font-semibold">Time Left: {timeLeft}s</div>

      <svg width={GAME_AREA_WIDTH_TOTAL} height={GAME_AREA_HEIGHT} className="bg-sky-500 border-2 border-sky-400 rounded shadow-2xl">
        {/* Player 1 Area */}
        <g transform={getPlayerAreaTransform(0)}>
          <rect x="0" y="0" width={PLAYER_AREA_WIDTH} height={GAME_AREA_HEIGHT} fill="rgba(0,0,0,0.1)" />
          {/* Basket P1 */}
          <text x={baskets[0].x} y={baskets[0].y} fontSize={BASKET_WIDTH} textAnchor="middle" dominantBaseline="central">
            🧺
          </text>

          {/* Fruits P1 */}
          {fruits.filter(f => f.playerArea === 1).map(fruit => (
            <text key={fruit.id} x={fruit.x} y={fruit.y} fontSize={FRUIT_RADIUS * 2} textAnchor="middle" dominantBaseline="central">
              {fruit.type}
            </text>
          ))}
          <line x1={PLAYER_AREA_WIDTH} y1="0" x2={PLAYER_AREA_WIDTH} y2={GAME_AREA_HEIGHT} stroke="rgba(255,255,255,0.5)" strokeWidth="2" />
        </g>

        {/* Player 2 Area */}
        <g transform={getPlayerAreaTransform(1)}>
          <rect x="0" y="0" width={PLAYER_AREA_WIDTH} height={GAME_AREA_HEIGHT} fill="rgba(0,0,0,0.1)" />
          {/* Basket P2 */}
          <text x={baskets[1].x} y={baskets[1].y} fontSize={BASKET_WIDTH} textAnchor="middle" dominantBaseline="central">
            🧺
          </text>

          {/* Fruits P2 */}
          {fruits.filter(f => f.playerArea === 2).map(fruit => (
            <text key={fruit.id} x={fruit.x} y={fruit.y} fontSize={FRUIT_RADIUS * 2} textAnchor="middle" dominantBaseline="central">
              {fruit.type}
            </text>
          ))}
        </g>

        {gameOver && (
          <g>
            <rect x="0" y={GAME_AREA_HEIGHT / 2 - 60} width={GAME_AREA_WIDTH_TOTAL} height="120" fill="rgba(0,0,0,0.7)" />
            <text x={GAME_AREA_WIDTH_TOTAL / 2} y={GAME_AREA_HEIGHT / 2 - 20} textAnchor="middle" fill="yellow" fontSize="40" fontWeight="bold">
              Game Over!
            </text>
            <text x={GAME_AREA_WIDTH_TOTAL / 2} y={GAME_AREA_HEIGHT / 2 + 25} textAnchor="middle" fill="white" fontSize="30" fontWeight="bold">
              {winner}
            </text>
          </g>
        )}
      </svg>
      {gameOver && (
        <Button onClick={resetGame} className="mt-6" size="lg">
          <Trophy className="mr-2" /> Play Again?
        </Button>
      )}
      {!gameOver && <p className="mt-4 text-sm text-sky-200">Catch the fruits! Player 1 uses A/D, Player 2 uses Left/Right Arrows.</p>}
    </div>
  );
}
