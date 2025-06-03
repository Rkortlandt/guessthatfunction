
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { XSquare, Heart } from 'lucide-react'; // Added Heart icon

const PADDLE_HEIGHT = 100;
const PADDLE_WIDTH = 10;
const BALL_RADIUS = 8;
const PADDLE_SPEED = 15;
const INITIAL_BALL_SPEED_X = 5;
const INITIAL_BALL_SPEED_Y = 5;
const INITIAL_LIVES = 3; // Changed from WINNING_SCORE

interface PongGameProps {
  onClose: () => void;
}

export function PongGame({ onClose }: PongGameProps) {
  const gameAreaWidth = 600;
  const gameAreaHeight = 400;

  const [ball, setBall] = useState({ x: gameAreaWidth / 2, y: gameAreaHeight / 2 });
  const [ballSpeed, setBallSpeed] = useState({ x: INITIAL_BALL_SPEED_X, y: INITIAL_BALL_SPEED_Y });
  const [leftPaddleY, setLeftPaddleY] = useState(gameAreaHeight / 2 - PADDLE_HEIGHT / 2);
  const [rightPaddleY, setRightPaddleY] = useState(gameAreaHeight / 2 - PADDLE_HEIGHT / 2);
  const [lives, setLives] = useState({ p1: INITIAL_LIVES, p2: INITIAL_LIVES }); // Changed from scores
  const [gameOverMessage, setGameOverMessage] = useState<string | null>(null);
  const [isPaused, setIsPaused] = useState(false);

  const keysPressed = useRef<Record<string, boolean>>({});
  const gameLoopRef = useRef<number>();

  const resetBall = useCallback((servedByP1: boolean) => {
    setBall({ x: gameAreaWidth / 2, y: gameAreaHeight / 2 });
    let newSpeedX = Math.random() > 0.5 ? INITIAL_BALL_SPEED_X : -INITIAL_BALL_SPEED_X;
    if (servedByP1) newSpeedX = Math.abs(newSpeedX); else newSpeedX = -Math.abs(newSpeedX);
    setBallSpeed({ x: newSpeedX, y: Math.random() > 0.5 ? INITIAL_BALL_SPEED_Y : -INITIAL_BALL_SPEED_Y});
    setIsPaused(true); 
    setTimeout(() => setIsPaused(false), 1000); 
  }, [gameAreaWidth, gameAreaHeight]);

  const resetGame = useCallback(() => {
    setLives({ p1: INITIAL_LIVES, p2: INITIAL_LIVES }); // Reset lives
    setLeftPaddleY(gameAreaHeight / 2 - PADDLE_HEIGHT / 2);
    setRightPaddleY(gameAreaHeight / 2 - PADDLE_HEIGHT / 2);
    resetBall(Math.random() > 0.5); // Random player serves
    setGameOverMessage(null);
    setIsPaused(false);
  }, [gameAreaHeight, resetBall]);
  
  useEffect(() => {
    resetGame(); 
  },[resetGame]);


  useEffect(() => {
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
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const gameLoop = () => {
      if (gameOverMessage || isPaused) {
        gameLoopRef.current = requestAnimationFrame(gameLoop);
        return;
      }

      // Update paddle positions
      setLeftPaddleY(prev => {
        let nextY = prev;
        if (keysPressed.current['w']) nextY -= PADDLE_SPEED;
        if (keysPressed.current['s']) nextY += PADDLE_SPEED;
        return Math.max(0, Math.min(nextY, gameAreaHeight - PADDLE_HEIGHT));
      });
      setRightPaddleY(prev => {
        let nextY = prev;
        if (keysPressed.current['arrowup']) nextY -= PADDLE_SPEED;
        if (keysPressed.current['arrowdown']) nextY += PADDLE_SPEED;
        return Math.max(0, Math.min(nextY, gameAreaHeight - PADDLE_HEIGHT));
      });

      // Update ball position
      setBall(prevBall => ({
        x: prevBall.x + ballSpeed.x,
        y: prevBall.y + ballSpeed.y,
      }));

      // Ball collision with top/bottom walls
      if (ball.y - BALL_RADIUS < 0 || ball.y + BALL_RADIUS > gameAreaHeight) {
        setBallSpeed(prev => ({ ...prev, y: -prev.y }));
        setBall(prev => ({...prev, y: Math.max(BALL_RADIUS, Math.min(prev.y, gameAreaHeight - BALL_RADIUS))}));
      }

      // Ball collision with paddles
      if (
        ball.x - BALL_RADIUS < PADDLE_WIDTH && ball.x > 0 && // Ensure ball is coming from right
        ball.y > leftPaddleY &&
        ball.y < leftPaddleY + PADDLE_HEIGHT
      ) {
        setBallSpeed(prev => ({ ...prev, x: Math.abs(prev.x) * 1.05 })); 
        const deltaY = ball.y - (leftPaddleY + PADDLE_HEIGHT / 2);
        setBallSpeed(prev => ({ ...prev, y: deltaY * 0.2 + prev.y * 0.8 }));
      }
      
      if (
        ball.x + BALL_RADIUS > gameAreaWidth - PADDLE_WIDTH && ball.x < gameAreaWidth && // Ensure ball is coming from left
        ball.y > rightPaddleY &&
        ball.y < rightPaddleY + PADDLE_HEIGHT
      ) {
        setBallSpeed(prev => ({ ...prev, x: -Math.abs(prev.x) * 1.05 })); 
        const deltaY = ball.y - (rightPaddleY + PADDLE_HEIGHT / 2);
        setBallSpeed(prev => ({ ...prev, y: deltaY * 0.2 + prev.y * 0.8 }));
      }

      // Ball out of bounds (lose life)
      if (ball.x - BALL_RADIUS < 0) { // P1 misses, P2 "scores" (P1 loses life)
        setLives(prev => {
          const newP1Lives = prev.p1 - 1;
          if (newP1Lives <= 0) {
            setGameOverMessage("Player 2 Wins Pong!");
            return { ...prev, p1: 0 };
          }
          resetBall(false); // P2 serves
          return { ...prev, p1: newP1Lives };
        });
      } else if (ball.x + BALL_RADIUS > gameAreaWidth) { // P2 misses, P1 "scores" (P2 loses life)
        setLives(prev => {
          const newP2Lives = prev.p2 - 1;
          if (newP2Lives <= 0) {
            setGameOverMessage("Player 1 Wins Pong!");
            return { ...prev, p2: 0 };
          }
          resetBall(true); // P1 serves
          return { ...prev, p2: newP2Lives };
        });
      }
      
      setBallSpeed(prev => ({
        x: Math.max(-15, Math.min(15, prev.x)),
        y: Math.max(-10, Math.min(10, prev.y)),
      }));

      gameLoopRef.current = requestAnimationFrame(gameLoop);
    };

    if (!gameOverMessage) {
        gameLoopRef.current = requestAnimationFrame(gameLoop);
    }

    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [ball, ballSpeed, leftPaddleY, rightPaddleY, resetBall, gameOverMessage, isPaused, gameAreaWidth, gameAreaHeight]);

  const renderLives = (playerLives: number) => {
    return Array.from({ length: playerLives }).map((_, i) => (
      <Heart key={i} className="inline-block h-5 w-5 fill-red-500 text-red-600 mx-0.5" />
    ));
  };

  return (
    <div className="flex flex-col items-center justify-center w-full h-full bg-slate-800 text-white p-4 relative">
      <Button
        variant="ghost"
        size="icon"
        onClick={onClose}
        className="absolute top-4 right-4 text-white hover:bg-slate-700"
        aria-label="Close Pong Game"
      >
        <XSquare size={32} />
      </Button>
      <h2 className="text-3xl font-bold mb-4 font-headline">Surprise Pong!</h2>
      <div className="text-xl mb-2 flex justify-between w-full max-w-xs items-center">
        <div className="flex items-center">P1 (W/S): {renderLives(lives.p1)}</div>
        <div className="flex items-center">P2 (↑/↓): {renderLives(lives.p2)}</div>
      </div>
      <svg width={gameAreaWidth} height={gameAreaHeight} className="bg-black border-2 border-slate-500 rounded shadow-2xl">
        <line
          x1={gameAreaWidth / 2}
          y1="0"
          x2={gameAreaWidth / 2}
          y2={gameAreaHeight}
          stroke="rgba(255,255,255,0.3)"
          strokeDasharray="5,5"
        />
        <rect
          x="0"
          y={leftPaddleY}
          width={PADDLE_WIDTH}
          height={PADDLE_HEIGHT}
          fill="white"
        />
        <rect
          x={gameAreaWidth - PADDLE_WIDTH}
          y={rightPaddleY}
          width={PADDLE_WIDTH}
          height={PADDLE_HEIGHT}
          fill="white"
        />
        <circle cx={ball.x} cy={ball.y} r={BALL_RADIUS} fill="white" />
        {gameOverMessage && (
          <g>
            <rect x="0" y={gameAreaHeight / 2 - 50} width={gameAreaWidth} height="100" fill="rgba(0,0,0,0.7)" />
            <text x={gameAreaWidth/2} y={gameAreaHeight/2 - 15} textAnchor="middle" fill="yellow" fontSize="30" fontWeight="bold">
              {gameOverMessage}
            </text>
            <text x={gameAreaWidth/2} y={gameAreaHeight/2 + 20} textAnchor="middle" fill="white" fontSize="18">
              Click Play Again or Close
            </text>
          </g>
        )}
         {isPaused && !gameOverMessage && (
          <text x={gameAreaWidth/2} y={gameAreaHeight/2 - 30} textAnchor="middle" fill="cyan" fontSize="24">
            Get Ready...
          </text>
        )}
      </svg>
      {gameOverMessage && (
        <Button onClick={resetGame} className="mt-6" size="lg">
          Play Again?
        </Button>
      )}
       <p className="mt-4 text-sm text-slate-400">First player to make the opponent lose all lives wins!</p>
    </div>
  );
}

