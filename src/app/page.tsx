
'use client';

import { useState, useEffect, useCallback } from 'react';
import { FunctionGrid } from '@/components/game/FunctionGrid';
import { GameControls } from '@/components/game/GameControls';
import { INITIAL_FUNCTIONS, type RationalFunction } from '@/lib/game-data';
import { Button } from '@/components/ui/button';
import { RotateCcw, Users, Loader2, ShieldCheck, HelpCircleIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';


type GamePhase = 
  | 'P1_SELECTING' 
  | 'P2_ASKING' 
  | 'P1_ANSWERING' 
  | 'P2_EVALUATING' 
  | 'P2_GUESSING' 
  | 'GAME_OVER';

type GameResult = 'P1_WINS' | 'P2_WINS' | null;

export default function RationalGuesserPage() {
  const [functions, setFunctions] = useState<RationalFunction[]>([]);
  const [player1SecretFunction, setPlayer1SecretFunction] = useState<RationalFunction | null>(null);
  const [currentQuestionFromP2, setCurrentQuestionFromP2] = useState('');
  const [player1ManualAnswer, setPlayer1ManualAnswer] = useState<boolean | null>(null);
  const [gamePhase, setGamePhase] = useState<GamePhase>('P1_SELECTING');
  const [gameResult, setGameResult] = useState<GameResult>(null);
  const [isLoading, setIsLoading] = useState(false); // Generic loader for actions
  const [showP1ScreenCover, setShowP1ScreenCover] = useState(false);

  const { toast } = useToast();

  const resetGame = useCallback(() => {
    const allFunctions = INITIAL_FUNCTIONS.map(f => ({ ...f, isEliminated: false }));
    setFunctions(allFunctions);
    setPlayer1SecretFunction(null);
    setCurrentQuestionFromP2('');
    setPlayer1ManualAnswer(null);
    setGamePhase('P1_SELECTING');
    setGameResult(null);
    setIsLoading(false);
    setShowP1ScreenCover(false);
    console.log("Game reset. Waiting for Player 1 to select a function.");
  }, []);

  useEffect(() => {
    resetGame();
  }, [resetGame]);
  
  useEffect(() => {
    if (gamePhase === 'P1_SELECTING' || gamePhase === 'P1_ANSWERING') {
      setShowP1ScreenCover(true);
    }
  }, [gamePhase]);

  const handleConfirmP1Action = () => {
    setShowP1ScreenCover(false);
    if (gamePhase === 'P1_SELECTING' && player1SecretFunction) {
      setGamePhase('P2_ASKING');
      toast({ title: "Player 1's Turn Over", description: "Player 2, you may now look and ask your question." });
    } else if (gamePhase === 'P1_ANSWERING' && player1ManualAnswer !== null) {
       setGamePhase('P2_EVALUATING');
       toast({ title: "Player 1's Turn Over", description: "Player 2, you may now look and evaluate the answer." });
    }
  };

  const handleSelectSecretFunction = (id: string) => {
    if (gamePhase !== 'P1_SELECTING') return;
    const selectedFunc = functions.find(f => f.id === id);
    if (selectedFunc) {
      setPlayer1SecretFunction(selectedFunc);
      // Don't change game phase here, wait for P1 to confirm via screen cover.
      toast({ title: "Function Selected", description: "Player 1 has selected a function. Confirm to hide and let Player 2 ask." });
    }
  };

  const handleAskQuestion = (question: string) => {
    if (gamePhase !== 'P2_ASKING' || !player1SecretFunction) return;
    setCurrentQuestionFromP2(question);
    setGamePhase('P1_ANSWERING');
    setPlayer1ManualAnswer(null); // Clear previous answer
    toast({ title: "Question Submitted", description: "Player 1, it's your turn to answer." });
  };

  const handleAnswerQuestion = (answer: boolean) => {
    if (gamePhase !== 'P1_ANSWERING' || !currentQuestionFromP2) return;
    setPlayer1ManualAnswer(answer);
     // Don't change game phase here, wait for P1 to confirm via screen cover.
    toast({ title: "Answer Logged", description: "Player 1 has answered. Confirm to hide and let Player 2 evaluate." });
  };

  const handleToggleEliminate = (id: string) => {
    if (gamePhase !== 'P2_EVALUATING' && gamePhase !== 'P2_ASKING') return;

    setFunctions((prevFunctions) =>
      prevFunctions.map((func) =>
        func.id === id ? { ...func, isEliminated: !func.isEliminated } : func
      )
    );
     if (gamePhase === 'P2_EVALUATING') {
       setGamePhase('P2_ASKING'); 
       setPlayer1ManualAnswer(null); // Clear P1's answer for next round
       setCurrentQuestionFromP2(''); // Clear P2's question
     }
  };
  
  const handleMakeFinalGuess = (guessedId: string) => {
    if (!player1SecretFunction || gamePhase !== 'P2_GUESSING') return;
    setGamePhase('GAME_OVER');
    if (guessedId === player1SecretFunction.id) {
      setGameResult('P2_WINS');
      toast({ title: "Player 2 Wins!", description: "Brilliant deduction, Player 2!", variant: "default" });
    } else {
      setGameResult('P1_WINS');
      toast({ title: "Player 1 Wins!", description: `Not quite, Player 2! The correct function was ${player1SecretFunction.equation}`, variant: "destructive" });
    }
  };

  const handleStartGuessing = () => {
    setGamePhase('P2_GUESSING');
    setPlayer1ManualAnswer(null);
    setCurrentQuestionFromP2('');
  };

  const handleCancelGuessing = () => {
    setGamePhase('P2_ASKING');
  };

  const remainingFunctions = functions.filter(f => !f.isEliminated);
  const remainingFunctionsCount = remainingFunctions.length;

  if (functions.length === 0) { // Initial loading state before resetGame populates functions
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }
  
  const P1ScreenCoverDialog = () => (
    <Dialog open={showP1ScreenCover} onOpenChange={setShowP1ScreenCover}>
      <DialogContent className="sm:max-w-md text-center">
        <DialogHeader>
          <DialogTitle className="text-2xl font-headline flex items-center justify-center">
            <ShieldCheck className="w-8 h-8 mr-2 text-primary" />
            Player 1's Eyes Only!
          </DialogTitle>
        </DialogHeader>
        <DialogDescription className="my-4 text-lg">
          {gamePhase === 'P1_SELECTING' && !player1SecretFunction && "Please select your secret function from the grid."}
          {gamePhase === 'P1_SELECTING' && player1SecretFunction && "You've selected a function. Ready to hide it from Player 2?"}
          {gamePhase === 'P1_ANSWERING' && `Player 2 asked: "${currentQuestionFromP2}". How do you answer?`}
        </DialogDescription>
        <DialogFooter className="sm:justify-center">
          <Button onClick={handleConfirmP1Action} size="lg" disabled={gamePhase === 'P1_SELECTING' && !player1SecretFunction || gamePhase === 'P1_ANSWERING' && player1ManualAnswer === null}>
            Confirm & Hide Screen
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );


  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground p-4 md:p-8">
      <header className="mb-8">
        <div className="container mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <h1 className="text-4xl font-headline text-primary flex items-center">
            <Users className="w-10 h-10 mr-2" />
            Rational Guesser P2P
          </h1>
          <Button onClick={resetGame} variant="outline" size="lg">
            <RotateCcw className="mr-2 h-5 w-5" />
            New Game
          </Button>
        </div>
      </header>

      <main className="container mx-auto flex-grow flex flex-col lg:flex-row gap-8">
        <aside className="lg:w-1/3 xl:w-1/4 space-y-6">
          <GameControls
            gamePhase={gamePhase}
            gameResult={gameResult}
            remainingFunctionsCount={remainingFunctionsCount}
            currentQuestionFromP2={currentQuestionFromP2}
            player1ManualAnswer={player1ManualAnswer}
            isLoading={isLoading}
            onAskQuestion={handleAskQuestion}
            onAnswerQuestion={handleAnswerQuestion}
            onStartGuessing={handleStartGuessing}
            onCancelGuessing={handleCancelGuessing}
            player1SecretFunctionId={player1SecretFunction?.id || null}
          />
           {gamePhase === 'GAME_OVER' && player1SecretFunction && (
            <Alert variant={gameResult === 'P2_WINS' ? 'default' : 'destructive'} className="mt-4">
              <AlertTitle className="font-headline">
                {gameResult === 'P2_WINS' ? "Player 2 Wins!" : "Player 1 Wins!"}
              </AlertTitle>
              <AlertDescription>
                The secret function was: <span className="font-bold">{player1SecretFunction.equation}</span>
              </AlertDescription>
            </Alert>
          )}
        </aside>

        <section className="lg:w-2/3 xl:w-3/4">
          <FunctionGrid 
            functions={functions} 
            onToggleEliminate={handleToggleEliminate}
            isGameActive={gamePhase !== 'GAME_OVER' && gamePhase !== 'P1_SELECTING' && gamePhase !== 'P1_ANSWERING'}
            onMakeFinalGuess={handleMakeFinalGuess}
            isGuessingPhase={gamePhase === 'P2_GUESSING'}
            isPlayer1Selecting={gamePhase === 'P1_SELECTING'}
            onSelectSecretFunction={handleSelectSecretFunction}
            selectedSecretFunctionId={player1SecretFunction?.id}
          />
        </section>
      </main>
      
      <P1ScreenCoverDialog />

      <footer className="text-center py-8 mt-auto text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} Rational Guesser P2P. Two-player fun by Firebase Studio.</p>
      </footer>
    </div>
  );
}
