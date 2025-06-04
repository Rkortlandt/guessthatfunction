import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Lightbulb, HelpCircle, CheckCircle, XCircle, ShieldQuestion, UserCheck, UserX, ShieldCheck, MessageSquare, ZapOff, ArrowRightCircle } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { GamePhase, User } from '@/app/page';

interface GameControlsProps {
  gamePhase: GamePhase;
  player: User;
  guessesRemainingCount: number;
  secretFunctionId: string | null;
  onTurnFinished: () => void; // This is used for "Done Eliminating / Next Action"
}

export function GameControls({
  gamePhase,
  player,
  guessesRemainingCount,
  secretFunctionId,
  onTurnFinished,
}: GameControlsProps) {

  const getGamePhaseMessage = (): string => {
    const isMyTurn = (player.role === 'player1' && (gamePhase === 'SELECTING_FUNCTIONS' || gamePhase === 'P1_QUESTION')) ||
      (player.role === 'player2' && (gamePhase === 'SELECTING_FUNCTIONS' || gamePhase === 'P2_QUESTION'));

    switch (gamePhase) {
      case 'SELECTING_FUNCTIONS':
        return "Select your secret function!";
      case 'P1_QUESTION':
        return isMyTurn ? "It's your turn to ask/eliminate!" : "Player 1 is asking a question/eliminating...";
      case 'P2_QUESTION':
        return isMyTurn ? "It's your turn to ask/eliminate!" : "Player 2 is asking a question/eliminating...";
      case 'GAME_OVER':
        return "Game Over!";
      default:
        return "Waiting for game to start...";
    }
  };

  const showTurnFinishedButton = (
    (player.role === 'player1' && gamePhase === 'P1_QUESTION') ||
    (player.role === 'player2' && gamePhase === 'P2_QUESTION')
  );

  // ---

  return (
    <Card className="shadow-xl h-full flex flex-col">
      <CardHeader className="flex-shrink-0">
        <CardTitle className="font-headline text-2xl flex items-center gap-2">
          {player.role === "player1" ? "Player 1 Controls" : player.role === "player2" ? "Player 2 Controls" : "Spectator View"}
        </CardTitle>
        <CardDescription>
          Your game actions and status.
        </CardDescription>
      </CardHeader>

      <CardContent className="flex-grow space-y-6">
        <div className="p-3 bg-muted/50 rounded-md text-center">
          <p className="font-semibold text-lg font-headline">{getGamePhaseMessage()}</p>
        </div>

        {player.role !== 'spectator' && (
          <div className="p-3 bg-blue-100 rounded-md text-center text-blue-800">
            <p className="font-semibold">Guesses Remaining: {guessesRemainingCount}</p>
          </div>
        )}

        {secretFunctionId && (
          <div className="p-3 bg-green-100 rounded-md text-center text-green-800 flex items-center justify-center gap-2">
            <ShieldCheck className="h-5 w-5" />
            <p className="font-semibold">Your Secret: {secretFunctionId}</p>
          </div>
        )}
        {!secretFunctionId && (player.role === 'player1' || player.role === 'player2') && (
          <div className="p-3 bg-yellow-100 rounded-md text-center text-yellow-800 flex items-center justify-center gap-2">
            <ShieldQuestion className="h-5 w-5" />
            <p className="font-semibold">Select your secret function!</p>
          </div>
        )}


        {/* "Done Eliminating / Next Action" Button */}
        {showTurnFinishedButton && (
          <div className="pt-4 border-t">
            <Button
              onClick={onTurnFinished}
              className="w-full"
              size="lg"
              variant="secondary"
            >
              <ArrowRightCircle className="mr-2 h-5 w-5" />
              Done Eliminating / Next Action
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
