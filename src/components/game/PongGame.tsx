
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { XSquare, Heart } from 'lucide-react'; // Added Heart icon

const PADDLE_HEIGHT = 100;
const PADDLE_WIDTH = 10;
const BALL_RADIUS = 8;
const PADDLE_SPEED = 15; // Increased from 10 to 15 in a previous step, keeping it.
const INITIAL_BALL_SPEED_X = 5;
const INITIAL_BALL_SPEED_Y = 5;
const INITIAL_LIVES = 3;

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
  const [lives, setLives] = useState({ p1: INITIAL_LIVES, p2: INITIAL_LIVES });
  const [gameOverMessage, setGameOverMessage] = useState<string | null>(null);
  const [isPaused, setIsPaused] = useState(false);

  const keysPressed = useRef<Record<string, boolean>>({});
  const gameLoopRef = useRef<number>();

  const resetBall = useCallback((servedByP1: boolean) => {
    setBall({ x: gameAreaWidth / 2, y: gameAreaHeight / 2 });
    let newSpeedX = Math.random() > 0.5 ? INITIAL_BALL_SPEED_X : -INITIAL_BALL_SPEED_X;
    if (servedByP1) newSpeedX = Math.abs(newSpeedX); else newSpeedX = -Math.abs(newSpeedX);
    
    // Ensure ball doesn't start with zero Y speed, or a very small Y speed for better gameplay
    let newSpeedY = (Math.random() * INITIAL_BALL_SPEED_Y * 2) - INITIAL_BALL_SPEED_Y; // -5 to 5
    if (Math.abs(newSpeedY) < 1) { // if too horizontal
        newSpeedY = Math.sign(newSpeedY || 1) * (INITIAL_BALL_SPEED_Y / 2); // give it some vertical push
    }

    setBallSpeed({ x: newSpeedX, y: newSpeedY});
    setIsPaused(true);
    setTimeout(() => setIsPaused(false), 1000);
  }, [gameAreaWidth, gameAreaHeight]);

  const resetGame = useCallback(() => {
    setLives({ p1: INITIAL_LIVES, p2: INITIAL_LIVES });
    setLeftPaddleY(gameAreaHeight / 2 - PADDLE_HEIGHT / 2);
    setRightPaddleY(gameAreaHeight / 2 - PADDLE_HEIGHT / 2);
    resetBall(Math.random() > 0.5);
    setGameOverMessage(null);
    setIsPaused(false); // Ensure game starts unpaused after reset
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

      // --- Ball Logic ---
      const prevBallX = ball.x; // For checking if ball was previously outside paddle

      let newX = ball.x + ballSpeed.x;
      let newY = ball.y + ballSpeed.y;
      let newSpeedX = ballSpeed.x;
      let newSpeedY = ballSpeed.y;

      // Wall collisions (top/bottom)
      if (newY - BALL_RADIUS < 0) {
        newY = BALL_RADIUS; // Clamp position
        newSpeedY = -newSpeedY; // Reverse speed
      } else if (newY + BALL_RADIUS > gameAreaHeight) {
        newY = gameAreaHeight - BALL_RADIUS; // Clamp position
        newSpeedY = -newSpeedY; // Reverse speed
      }

      // Paddle collisions
      // Left Paddle (Player 1)
      if (
        newSpeedX < 0 && // Ball is moving left
        newX - BALL_RADIUS < PADDLE_WIDTH &&         // Ball's left edge would cross or touch the paddle's front
        prevBallX - BALL_RADIUS >= PADDLE_WIDTH &&   // Ball's left edge was previously outside or at the paddle's front
        newY + BALL_RADIUS > leftPaddleY &&          // Ball is vertically aligned (bottom edge of ball vs top of paddle)
        newY - BALL_RADIUS < leftPaddleY + PADDLE_HEIGHT // Ball is vertically aligned (top edge of ball vs bottom of paddle)
      ) {
        newX = PADDLE_WIDTH + BALL_RADIUS; // Place ball just outside the paddle
        newSpeedX = Math.abs(newSpeedX) * 1.05; // Reverse direction and slightly increase speed
        const deltaHitY = newY - (leftPaddleY + PADDLE_HEIGHT / 2); // Distance from paddle center
        newSpeedY = newSpeedY * 0.7 + deltaHitY * 0.2; // Apply "english" based on where it hit the paddle
      }
      // Right Paddle (Player 2)
      else if (
        newSpeedX > 0 && // Ball is moving right
        newX + BALL_RADIUS > gameAreaWidth - PADDLE_WIDTH && // Ball's right edge would cross or touch
        prevBallX + BALL_RADIUS <= gameAreaWidth - PADDLE_WIDTH && // Ball's right edge was previously outside
        newY + BALL_RADIUS > rightPaddleY &&                      // Vertical alignment
        newY - BALL_RADIUS < rightPaddleY + PADDLE_HEIGHT
      ) {
        newX = gameAreaWidth - PADDLE_WIDTH - BALL_RADIUS; // Place ball just outside
        newSpeedX = -Math.abs(newSpeedX) * 1.05; // Reverse direction and slightly increase speed
        const deltaHitY = newY - (rightPaddleY + PADDLE_HEIGHT / 2);
        newSpeedY = newSpeedY * 0.7 + deltaHitY * 0.2;
      }

      // Score conditions / Ball out of bounds (left/right)
      if (newX - BALL_RADIUS < 0) { // P1 (left) misses, P2 scores
        setLives(prevLives => {
          const newP1Lives = prevLives.p1 - 1;
          if (newP1Lives <= 0) {
            setGameOverMessage("Player 2 Wins Pong!");
            return { ...prevLives, p1: 0 };
          }
          resetBall(false); // P2 serves next (ball to P1 side)
          return { ...prevLives, p1: newP1Lives };
        });
        gameLoopRef.current = requestAnimationFrame(gameLoop); // Reschedule and exit this iteration
        return;
      } else if (newX + BALL_RADIUS > gameAreaWidth) { // P2 (right) misses, P1 scores
        setLives(prevLives => {
          const newP2Lives = prevLives.p2 - 1;
          if (newP2Lives <= 0) {
            setGameOverMessage("Player 1 Wins Pong!");
            return { ...prevLives, p2: 0 };
          }
          resetBall(true); // P1 serves next (ball to P2 side)
          return { ...prevLives, p2: newP2Lives };
        });
        gameLoopRef.current = requestAnimationFrame(gameLoop); // Reschedule and exit this iteration
        return;
      }
      
      // Clamp ball speed to prevent it from becoming too fast
      newSpeedX = Math.max(-15, Math.min(15, newSpeedX));
      newSpeedY = Math.max(-10, Math.min(10, newSpeedY));

      // Update ball state
      setBall({ x: newX, y: newY });
      setBallSpeed({ x: newSpeedX, y: newSpeedY });

      gameLoopRef.current = requestAnimationFrame(gameLoop);
    };

    // Start the game loop only if the game is not over
    if (!gameOverMessage) {
        gameLoopRef.current = requestAnimationFrame(gameLoop);
    }

    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [ball, ballSpeed, leftPaddleY, rightPaddleY, lives, resetBall, gameOverMessage, isPaused, gameAreaWidth, gameAreaHeight]);


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
      <h2 className="text-2xl font-bold mb-4 font-headline">Surprise Pong!</h2>
      <div className="text-xl mb-2 flex justify-between w-full max-w-xs sm:max-w-sm md:max-w-md items-center px-2">
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
        {gameOverMessage}
         {isPaused && !gameOverMessage && (
          <text x={gameAreaWidth/2} y={gameAreaHeight/2 - 30} textAnchor="middle" fill="cyan" fontSize="24">
            Get Ready...
          </text>
        )}
      </svg>
      {gameOverMessage}
    </div>
  );
}

