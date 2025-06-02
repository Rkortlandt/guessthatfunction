'use client';

import { useState, useEffect, useCallback } from 'react';
import { FunctionGrid } from '@/components/game/FunctionGrid';
import { GameControls } from '@/components/game/GameControls';
import { INITIAL_FUNCTIONS, type RationalFunction } from '@/lib/game-data';
import { answerQuestion, type AnswerQuestionOutput } from '@/ai/flows/answer-question';
import { Button } from '@/components/ui/button';
import { RotateCcw, Zap, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";


export default function RationalGuesserPage() {
  const [functions, setFunctions] = useState<RationalFunction[]>([]);
  const [aiSecretFunction, setAiSecretFunction] = useState<RationalFunction | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [aiResponse, setAiResponse] = useState<AnswerQuestionOutput | null>(null);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [gamePhase, setGamePhase] = useState<'ASKING' | 'AI_THINKING' | 'EVALUATING' | 'GAME_OVER' | 'GUESSING'>('ASKING');
  const [gameResult, setGameResult] = useState<'WIN' | 'LOSS' | null>(null);
  const { toast } = useToast();

  const resetGame = useCallback(() => {
    const allFunctions = INITIAL_FUNCTIONS.map(f => ({ ...f, isEliminated: false }));
    const randomIndex = Math.floor(Math.random() * allFunctions.length);
    setAiSecretFunction(allFunctions[randomIndex]);
    setFunctions(allFunctions);
    setCurrentQuestion('');
    setAiResponse(null);
    setIsLoadingAI(false);
    setGamePhase('ASKING');
    setGameResult(null);
    console.log("Game reset. AI's secret function ID:", allFunctions[randomIndex].id);
  }, []);

  useEffect(() => {
    resetGame();
  }, [resetGame]);

  const handleAskAI = async (question: string) => {
    if (!aiSecretFunction) return;
    setIsLoadingAI(true);
    setGamePhase('AI_THINKING');
    setAiResponse(null);
    try {
      const response = await answerQuestion({
        question,
        functionDescription: aiSecretFunction.descriptionForAI,
      });
      setAiResponse(response);
      setGamePhase('EVALUATING');
    } catch (error) {
      console.error('Error fetching AI response:', error);
      toast({
        title: "AI Error",
        description: "Could not get a response from the AI. Please try again.",
        variant: "destructive",
      });
      setGamePhase('ASKING');
    } finally {
      setIsLoadingAI(false);
    }
  };

  const handleToggleEliminate = (id: string) => {
    if (gamePhase !== 'EVALUATING' && gamePhase !== 'ASKING') return; // Allow elimination also in ASKING phase if player wants to undo/pre-eliminate

    setFunctions((prevFunctions) =>
      prevFunctions.map((func) =>
        func.id === id ? { ...func, isEliminated: !func.isEliminated } : func
      )
    );
     if (gamePhase === 'EVALUATING') {
       setGamePhase('ASKING'); // After an elimination, go back to asking phase
       setAiResponse(null); // Clear AI response
     }
  };
  
  const handleMakeFinalGuess = (guessedId: string) => {
    if (!aiSecretFunction) return;
    setGamePhase('GAME_OVER');
    if (guessedId === aiSecretFunction.id) {
      setGameResult('WIN');
      toast({ title: "You Won!", description: "Brilliant deduction!", variant: "default" });
    } else {
      setGameResult('LOSS');
      toast({ title: "You Lost!", description: `The correct function was ${aiSecretFunction.equation}`, variant: "destructive" });
    }
  };

  const handleStartGuessing = () => {
    setGamePhase('GUESSING');
    setAiResponse(null); // Clear AI response when entering guessing mode
  };

  const handleCancelGuessing = () => {
    setGamePhase('ASKING');
  };

  const remainingFunctions = functions.filter(f => !f.isEliminated);
  const remainingFunctionsCount = remainingFunctions.length;

  if (!aiSecretFunction) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground p-4 md:p-8">
      <header className="mb-8">
        <div className="container mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <h1 className="text-4xl font-headline text-primary flex items-center">
            <Zap className="w-10 h-10 mr-2" />
            Rational Guesser
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
            onAskAI={handleAskAI}
            aiResponse={aiResponse}
            isLoadingAI={isLoadingAI}
            remainingFunctionsCount={remainingFunctionsCount}
            gamePhase={gamePhase}
            gameResult={gameResult}
            onStartGuessing={handleStartGuessing}
            onCancelGuessing={handleCancelGuessing}
          />
           {gamePhase === 'GAME_OVER' && aiSecretFunction && (
            <Alert variant={gameResult === 'WIN' ? 'default' : 'destructive'} className="mt-4">
              <AlertTitle className="font-headline">
                {gameResult === 'WIN' ? "You got it!" : "Not quite!"}
              </AlertTitle>
              <AlertDescription>
                The AI's secret function was: <span className="font-bold">{aiSecretFunction.equation}</span>
              </AlertDescription>
            </Alert>
          )}
        </aside>

        <section className="lg:w-2/3 xl:w-3/4">
          <FunctionGrid 
            functions={functions} 
            onToggleEliminate={handleToggleEliminate}
            isGameActive={gamePhase !== 'GAME_OVER' && gamePhase !== 'AI_THINKING'}
            onMakeFinalGuess={handleMakeFinalGuess}
            isGuessingPhase={gamePhase === 'GUESSING'}
          />
        </section>
      </main>

      <footer className="text-center py-8 mt-auto text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} Rational Guesser. AI-powered fun by Firebase Studio.</p>
      </footer>
    </div>
  );
}
