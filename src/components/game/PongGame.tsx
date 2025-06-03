
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { XSquare } from 'lucide-react';

const PADDLE_HEIGHT = 100;
const PADDLE_WIDTH = 10;
const BALL_RADIUS = 8;
const PADDLE_SPEED = 15;
const INITIAL_BALL_SPEED_X = 5;
const INITIAL_BALL_SPEED_Y = 5;
const WINNING_SCORE = 5;

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
  const [scores, setScores] = useState({ p1: 0, p2: 0 });
  const [gameOverMessage, setGameOverMessage] = useState<string | null>(null);
  const [isPaused, setIsPaused] = useState(false);

  const keysPressed = useRef<Record<string, boolean>>({});
  const gameLoopRef = useRef<number>();

  const resetBall = useCallback((servedByP1: boolean) => {
    setBall({ x: gameAreaWidth / 2, y: gameAreaHeight / 2 });
    let newSpeedX = Math.random() > 0.5 ? INITIAL_BALL_SPEED_X : -INITIAL_BALL_SPEED_X;
    if (servedByP1) newSpeedX = Math.abs(newSpeedX); else newSpeedX = -Math.abs(newSpeedX);
    setBallSpeed({ x: newSpeedX, y: Math.random() > 0.5 ? INITIAL_BALL_SPEED_Y : -INITIAL_BALL_SPEED_Y});
    setIsPaused(true); // Pause briefly
    setTimeout(() => setIsPaused(false), 1000); // Resume after 1 sec
  }, [gameAreaWidth, gameAreaHeight]);

  const resetGame = useCallback(() => {
    setScores({ p1: 0, p2: 0 });
    setLeftPaddleY(gameAreaHeight / 2 - PADDLE_HEIGHT / 2);
    setRightPaddleY(gameAreaHeight / 2 - PADDLE_HEIGHT / 2);
    resetBall(true);
    setGameOverMessage(null);
    setIsPaused(false);
  }, [gameAreaHeight, resetBall]);
  
  useEffect(() => {
    resetGame(); // Initialize game on mount
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
        // Ensure ball stays in bounds if it slightly overshoots
        setBall(prev => ({...prev, y: Math.max(BALL_RADIUS, Math.min(prev.y, gameAreaHeight - BALL_RADIUS))}));
      }

      // Ball collision with paddles
      // Left paddle
      if (
        ball.x - BALL_RADIUS < PADDLE_WIDTH &&
        ball.y > leftPaddleY &&
        ball.y < leftPaddleY + PADDLE_HEIGHT
      ) {
        setBallSpeed(prev => ({ ...prev, x: Math.abs(prev.x) * 1.05 })); // Increase speed slightly
         // Adjust Y speed based on impact point
        const deltaY = ball.y - (leftPaddleY + PADDLE_HEIGHT / 2);
        setBallSpeed(prev => ({ ...prev, y: deltaY * 0.2 + prev.y * 0.8 }));

      }
      // Right paddle
      if (
        ball.x + BALL_RADIUS > gameAreaWidth - PADDLE_WIDTH &&
        ball.y > rightPaddleY &&
        ball.y < rightPaddleY + PADDLE_HEIGHT
      ) {
        setBallSpeed(prev => ({ ...prev, x: -Math.abs(prev.x) * 1.05 })); // Increase speed slightly
         // Adjust Y speed based on impact point
        const deltaY = ball.y - (rightPaddleY + PADDLE_HEIGHT / 2);
        setBallSpeed(prev => ({ ...prev, y: deltaY * 0.2 + prev.y * 0.8 }));
      }

      // Ball out of bounds (scoring)
      if (ball.x - BALL_RADIUS < 0) { // P2 scores
        setScores(prev => {
          const newP2Score = prev.p2 + 1;
          if (newP2Score >= WINNING_SCORE) {
            setGameOverMessage("Player 2 Wins Pong!");
            return { ...prev, p2: newP2Score };
          }
          resetBall(true); // P1 serves
          return { ...prev, p2: newP2Score };
        });
      } else if (ball.x + BALL_RADIUS > gameAreaWidth) { // P1 scores
        setScores(prev => {
          const newP1Score = prev.p1 + 1;
          if (newP1Score >= WINNING_SCORE) {
            setGameOverMessage("Player 1 Wins Pong!");
            return { ...prev, p1: newP1Score };
          }
          resetBall(false); // P2 serves
          return { ...prev, p1: newP1Score };
        });
      }
      
      // Clamp ball speed
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
      <div className="text-2xl mb-2">
        <span>P1 (W/S): {scores.p1}</span> - <span>P2 (↑/↓): {scores.p2}</span>
      </div>
      <svg width={gameAreaWidth} height={gameAreaHeight} className="bg-black border-2 border-slate-500 rounded shadow-2xl">
        {/* Center line */}
        <line
          x1={gameAreaWidth / 2}
          y1="0"
          x2={gameAreaWidth / 2}
          y2={gameAreaHeight}
          stroke="rgba(255,255,255,0.3)"
          strokeDasharray="5,5"
        />
        {/* Left Paddle */}
        <rect
          x="0"
          y={leftPaddleY}
          width={PADDLE_WIDTH}
          height={PADDLE_HEIGHT}
          fill="white"
        />
        {/* Right Paddle */}
        <rect
          x={gameAreaWidth - PADDLE_WIDTH}
          y={rightPaddleY}
          width={PADDLE_WIDTH}
          height={PADDLE_HEIGHT}
          fill="white"
        />
        {/* Ball */}
        <circle cx={ball.x} cy={ball.y} r={BALL_RADIUS} fill="white" />
        {gameOverMessage && (
          <text x={gameAreaWidth/2} y={gameAreaHeight/2 - 30} textAnchor="middle" fill="yellow" fontSize="30" fontWeight="bold">
            {gameOverMessage}
          </text>
        )}
         {isPaused && !gameOverMessage && (
          <text x={gameAreaWidth/2} y={gameAreaHeight/2 - 30} textAnchor="middle" fill="cyan" fontSize="24">
            Get Ready...
          </text>
        )}
      </svg>
      {gameOverMessage}
       <p className="mt-4 text-sm text-slate-400">First to {WINNING_SCORE} points wins. Good luck!</p>
    </div>
  );
}
