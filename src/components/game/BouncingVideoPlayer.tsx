'use client';

import { useState, useEffect, useRef, memo } from 'react';
import { XSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BouncingVideoPlayerProps {
  videoUrl: string;
}

const PLAYER_WIDTH = 320;
const PLAYER_HEIGHT = 180;
const CLOSE_BUTTON_AREA_HEIGHT = 30;
const TOTAL_HEIGHT = PLAYER_HEIGHT + CLOSE_BUTTON_AREA_HEIGHT;
const SPEED = 1.5;

function extractVideoId(url: string): string | null {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2] && match[2].length === 11) ? match[2] : null;
}

export const BouncingVideoPlayer: React.FC<BouncingVideoPlayerProps> = memo(({ videoUrl }) => {
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const [velocity, setVelocity] = useState({ dx: SPEED, dy: SPEED });
  const [currentVideoEmbedUrl, setCurrentVideoEmbedUrl] = useState<string>('');
  const playerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Set initial random position on client-side
    setPosition({
      x: Math.random() * (window.innerWidth - PLAYER_WIDTH),
      y: Math.random() * (window.innerHeight - TOTAL_HEIGHT),
    });
    // Randomize initial direction
    setVelocity({
      dx: Math.random() > 0.5 ? SPEED : -SPEED,
      dy: Math.random() > 0.5 ? SPEED : -SPEED,
    })

    const videoId = extractVideoId(videoUrl);
    if (videoId) {
      setCurrentVideoEmbedUrl(`https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&controls=0&showinfo=0&loop=1&playlist=${videoId}&modestbranding=1&iv_load_policy=3`);
    }
  }, [videoUrl]); // Only re-run if videoUrl changes (though it shouldn't for a single instance)

  useEffect(() => {
    if (position === null) return;

    let animationFrameId: number;

    const updatePosition = () => {
      setPosition(prevPos => {
        if (!prevPos) return null;

        let newX = prevPos.x + velocity.dx;
        let newY = prevPos.y + velocity.dy;
        let newDx = velocity.dx;
        let newDy = velocity.dy;

        if (newX <= 0) {
          newDx = Math.abs(velocity.dx);
          newX = 0;
        } else if (newX + PLAYER_WIDTH >= window.innerWidth) {
          newDx = -Math.abs(velocity.dx);
          newX = window.innerWidth - PLAYER_WIDTH;
        }

        if (newY <= 0) {
          newDy = Math.abs(velocity.dy);
          newY = 0;
        } else if (newY + TOTAL_HEIGHT >= window.innerHeight) {
          newDy = -Math.abs(velocity.dy);
          newY = window.innerHeight - TOTAL_HEIGHT;
        }

        setVelocity({ dx: newDx, dy: newDy });
        return { x: newX, y: newY };
      });
      animationFrameId = requestAnimationFrame(updatePosition);
    };

    animationFrameId = requestAnimationFrame(updatePosition);
    return () => cancelAnimationFrame(animationFrameId);
  }, [velocity, position]);

  if (position === null || !currentVideoEmbedUrl) return null;

  return (
    <div
      ref={playerRef}
      className="fixed bg-black border-2 border-primary shadow-2xl rounded-lg p-1 z-[200] overflow-hidden"
      style={{
        width: `${PLAYER_WIDTH}px`,
        height: `${TOTAL_HEIGHT}px`,
        top: `${position.y}px`,
        left: `${position.x}px`,
      }}
    >
      <div className="relative w-full h-full flex flex-col">
        <iframe
          width={PLAYER_WIDTH - 2}
          height={PLAYER_HEIGHT - 2}
          src={currentVideoEmbedUrl}
          title="Bouncing YouTube Video Player"
          // allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          // allowFullScreen
          className="rounded-b-md block"
        ></iframe>
      </div>
    </div>
  );
});

