
'use client';

import { useState, useEffect, useCallback } from 'react';
import { FunctionGrid } from '@/components/game/FunctionGrid';
import { GameControls } from '@/components/game/GameControls';
import { INITIAL_FUNCTIONS, type RationalFunction } from '@/lib/game-data';
import { Button } from '@/components/ui/button';
import { RotateCcw, Users, Loader2, ShieldCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';

type Player = 'P1' | 'P2';
type GamePhase =
  | 'P1_SELECTING'
  | 'P2_SELECTING'
  | 'P1_TURN_ACTION' 
  | 'P2_TURN_ANSWER_DIALOG' 
  | 'P1_TURN_EVALUATE' 
  | 'P2_TURN_ACTION' 
  | 'P1_TURN_ANSWER_DIALOG' 
  | 'P2_TURN_EVALUATE' 
  | 'GAME_OVER';

type GameWinner = Player | 'NONE' | null; 

export default function RationalGuesserPage() {
  const [p1GridFunctions, setP1GridFunctions] = useState<RationalFunction[]>([]); 
  const [p2GridFunctions, setP2GridFunctions] = useState<RationalFunction[]>([]); 

  const [player1SecretFunction, setPlayer1SecretFunction] = useState<RationalFunction | null>(null);
  const [player2SecretFunction, setPlayer2SecretFunction] = useState<RationalFunction | null>(null);
  
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [currentAnswer, setCurrentAnswer] = useState<boolean | null>(null);
  
  const [gamePhase, setGamePhase] = useState<GamePhase>('P1_SELECTING');
  const [currentPlayer, setCurrentPlayer] = useState<Player>('P1');
  const [gameWinner, setGameWinner] = useState<GameWinner>(null);
  
  const [isLoading, setIsLoading] = useState(false); 
  const [showScreenCoverDialog, setShowScreenCoverDialog] = useState(false);
  const [screenCoverDialogContent, setScreenCoverDialogContent] = useState<{title: string, description: string, confirmAction?: () => void}>({title: '', description: ''});
  const [isGuessingActive, setIsGuessingActive] = useState(false);

  const { toast } = useToast();

  const deepCopyFunctions = () => INITIAL_FUNCTIONS.map(f => ({ ...f, isEliminated: false, properties: {...f.properties} }));

  const resetGame = useCallback(() => {
    setP1GridFunctions(deepCopyFunctions());
    setP2GridFunctions(deepCopyFunctions());
    setPlayer1SecretFunction(null);
    setPlayer2SecretFunction(null);
    setCurrentQuestion('');
    setCurrentAnswer(null);
    setGamePhase('P1_SELECTING');
    setCurrentPlayer('P1');
    setGameWinner(null);
    setIsLoading(false);
    setShowScreenCoverDialog(false);
    setIsGuessingActive(false);
    console.log("Game reset. Waiting for Player 1 to select a function.");
  }, []);

  useEffect(() => {
    resetGame();
  }, [resetGame]);

  const handleSelectSecretFunction = (id: string) => {
    const selectedFunc = INITIAL_FUNCTIONS.find(f => f.id === id);
    if (!selectedFunc) return;

    if (gamePhase === 'P1_SELECTING' && currentPlayer === 'P1') {
      setPlayer1SecretFunction(selectedFunc);
    } else if (gamePhase === 'P2_SELECTING' && currentPlayer === 'P2') {
      setPlayer2SecretFunction(selectedFunc);
    }
  };

  const openScreenCover = (title: string, description: string, confirmAction?: () => void) => {
    setScreenCoverDialogContent({ title, description, confirmAction });
    setShowScreenCoverDialog(true);
  };

  const handleConfirmAndHide = () => {
    if (screenCoverDialogContent.confirmAction) {
      screenCoverDialogContent.confirmAction();
    }
    setShowScreenCoverDialog(false);
  };
  
  const handleP1ReadyToHideScreen = () => {
    if (gamePhase === 'P1_SELECTING' && player1SecretFunction) {
      openScreenCover(
        "Player 1: Selection Complete!", 
        "You've chosen your secret function. Press confirm to hide the screen and let Player 2 select their function.",
        () => {
          setGamePhase('P2_SELECTING');
          setCurrentPlayer('P2');
          toast({ title: "Player 1's Selection Hidden", description: "Player 2, it's your turn to select your secret function."});
        }
      );
    } else if (gamePhase === 'P1_TURN_ANSWER_DIALOG' && currentAnswer !== null) {
       openScreenCover(
        "Player 1: Answer Submitted!",
        `You answered "${currentAnswer ? 'Yes' : 'No'}" to Player 2's question: "${currentQuestion}". Press confirm to hide the screen.`,
        () => {
          setGamePhase('P2_TURN_EVALUATE');
          toast({ title: "Player 1 Answered", description: "Player 2, evaluate the answer and eliminate functions." });
        }
       );
    } else {
      toast({ title: "Action Incomplete", description: "Please complete your selection or answer first.", variant: "destructive" });
    }
  };

  const handleP2ReadyToHideScreen = () => {
    if (gamePhase === 'P2_SELECTING' && player2SecretFunction) {
      openScreenCover(
        "Player 2: Selection Complete!",
        "You've chosen your secret function. Press confirm to hide the screen. Player 1 will start asking questions.",
        () => {
          setGamePhase('P1_TURN_ACTION');
          setCurrentPlayer('P1');
          toast({ title: "Player 2's Selection Hidden", description: "Player 1, it's your turn to ask a question or make a guess." });
        }
      );
    } else if (gamePhase === 'P2_TURN_ANSWER_DIALOG' && currentAnswer !== null) {
       openScreenCover(
        "Player 2: Answer Submitted!",
        `You answered "${currentAnswer ? 'Yes' : 'No'}" to Player 1's question: "${currentQuestion}". Press confirm to hide the screen.`,
        () => {
          setGamePhase('P1_TURN_EVALUATE');
          toast({ title: "Player 2 Answered", description: "Player 1, evaluate the answer and eliminate functions." });
        }
       );
    } else {
      toast({ title: "Action Incomplete", description: "Please complete your selection or answer first.", variant: "destructive" });
    }
  };

  const handleAskQuestion = (question: string) => {
    setCurrentQuestion(question);
    setIsGuessingActive(false); 
    if (currentPlayer === 'P1' && gamePhase === 'P1_TURN_ACTION') {
      setCurrentAnswer(null); 
      setGamePhase('P2_TURN_ANSWER_DIALOG');
      toast({ title: "P1 Asked", description: "Player 2, please answer the question. Player 1, look away!" });
    } else if (currentPlayer === 'P2' && gamePhase === 'P2_TURN_ACTION') {
      setCurrentAnswer(null); 
      setGamePhase('P1_TURN_ANSWER_DIALOG');
      toast({ title: "P2 Asked", description: "Player 1, please answer the question. Player 2, look away!" });
    }
  };

  const handleProvideAnswer = (answer: boolean) => {
    setCurrentAnswer(answer);
  };

  const handleToggleEliminate = (id: string) => {
    if (isGuessingActive) return; // Don't eliminate if in guessing mode

    if (currentPlayer === 'P1' && (gamePhase === 'P1_TURN_ACTION' || gamePhase === 'P1_TURN_EVALUATE')) {
      setP1GridFunctions(prev => prev.map(f => f.id === id ? { ...f, isEliminated: !f.isEliminated } : f));
      if (gamePhase === 'P1_TURN_EVALUATE') { 
        setGamePhase('P1_TURN_ACTION');
        setCurrentQuestion('');
        setCurrentAnswer(null);
        setIsGuessingActive(false);
      }
    } else if (currentPlayer === 'P2' && (gamePhase === 'P2_TURN_ACTION' || gamePhase === 'P2_TURN_EVALUATE')) {
      setP2GridFunctions(prev => prev.map(f => f.id === id ? { ...f, isEliminated: !f.isEliminated } : f));
      if (gamePhase === 'P2_TURN_EVALUATE') { 
        setGamePhase('P2_TURN_ACTION');
        setCurrentQuestion('');
        setCurrentAnswer(null);
        setIsGuessingActive(false);
      }
    }
  };

  const handleMakeFinalGuess = (guessedId: string) => {
    setIsGuessingActive(false);
    setGamePhase('GAME_OVER');
    if (currentPlayer === 'P1') {
      if (guessedId === player2SecretFunction?.id) {
        setGameWinner('P1');
        toast({ title: "Player 1 Wins!", description: "P1 correctly guessed P2's function!" });
      } else {
        setGameWinner('P2'); 
        toast({ title: "Player 2 Wins!", description: `P1 guessed incorrectly! P2's secret function was ${player2SecretFunction?.equation}.`, variant: "destructive" });
      }
    } else { 
      if (guessedId === player1SecretFunction?.id) {
        setGameWinner('P2');
        toast({ title: "Player 2 Wins!", description: "P2 correctly guessed P1's function!" });
      } else {
        setGameWinner('P1'); 
        toast({ title: "Player 1 Wins!", description: `P2 guessed incorrectly! P1's secret function was ${player1SecretFunction?.equation}.`, variant: "destructive" });
      }
    }
  };

  const handleToggleGuessingMode = () => {
    setIsGuessingActive(prev => !prev);
    if (!isGuessingActive) {
      toast({title: "Guess Mode Activated", description: `Player ${currentPlayer}, select the card you think is your opponent's secret function.`});
    } else {
      toast({title: "Guess Mode Deactivated", description: `Player ${currentPlayer}, you can now ask questions or eliminate functions.`});
    }
  };


  let functionsToDisplay: RationalFunction[] = [];
  let gridMode: 'selecting' | 'viewing_opponent_grid' | 'answering_own_card' | 'game_over' = 'selecting';
  let onSelectSecretFunctionForGrid: ((id: string) => void) | undefined = undefined;
  let onToggleEliminateForGrid: ((id: string) => void) | undefined = undefined;
  let onMakeFinalGuessForGrid: ((id: string) => void) | undefined = undefined;
  let selectedSecretFunctionIdForUI: string | null = null;
  let actualSecretFunctionForAnsweringUI: RationalFunction | null = null;
  let gridKey = 'initial';


  if (gamePhase === 'P1_SELECTING') {
    functionsToDisplay = INITIAL_FUNCTIONS; 
    gridMode = 'selecting';
    onSelectSecretFunctionForGrid = handleSelectSecretFunction;
    selectedSecretFunctionIdForUI = player1SecretFunction?.id || null;
    gridKey = 'p1_selecting';
  } else if (gamePhase === 'P2_SELECTING') {
    functionsToDisplay = INITIAL_FUNCTIONS; 
    gridMode = 'selecting';
    onSelectSecretFunctionForGrid = handleSelectSecretFunction;
    selectedSecretFunctionIdForUI = player2SecretFunction?.id || null;
    gridKey = 'p2_selecting';
  } else if (gamePhase === 'P1_TURN_ACTION' || gamePhase === 'P1_TURN_EVALUATE') {
    functionsToDisplay = p1GridFunctions; 
    gridMode = 'viewing_opponent_grid';
    onToggleEliminateForGrid = handleToggleEliminate; 
    onMakeFinalGuessForGrid = handleMakeFinalGuess; 
    gridKey = 'p1_grid_view';
  } else if (gamePhase === 'P2_TURN_ACTION' || gamePhase === 'P2_TURN_EVALUATE') {
    functionsToDisplay = p2GridFunctions; 
    gridMode = 'viewing_opponent_grid';
    onToggleEliminateForGrid = handleToggleEliminate;
    onMakeFinalGuessForGrid = handleMakeFinalGuess; 
    gridKey = 'p2_grid_view';
  } else if (gamePhase === 'P1_TURN_ANSWER_DIALOG') {
    functionsToDisplay = player1SecretFunction ? [player1SecretFunction] : [];
    gridMode = 'answering_own_card';
    actualSecretFunctionForAnsweringUI = player1SecretFunction;
    gridKey = 'p1_answering';
  } else if (gamePhase === 'P2_TURN_ANSWER_DIALOG') {
    functionsToDisplay = player2SecretFunction ? [player2SecretFunction] : [];
    gridMode = 'answering_own_card';
    actualSecretFunctionForAnsweringUI = player2SecretFunction;
    gridKey = 'p2_answering';
  } else if (gamePhase === 'GAME_OVER') {
    gridMode = 'game_over';
    if (gameWinner === 'P1') { 
      functionsToDisplay = player2SecretFunction ? [player2SecretFunction] : INITIAL_FUNCTIONS;
      actualSecretFunctionForAnsweringUI = player2SecretFunction;
    } else if (gameWinner === 'P2') { 
      functionsToDisplay = player1SecretFunction ? [player1SecretFunction] : INITIAL_FUNCTIONS;
      actualSecretFunctionForAnsweringUI = player1SecretFunction;
    } else { 
      functionsToDisplay = INITIAL_FUNCTIONS;
    }
    gridKey = 'game_over_view';
  }


  const p1RemainingCount = p1GridFunctions.filter(f => !f.isEliminated).length;
  const p2RemainingCount = p2GridFunctions.filter(f => !f.isEliminated).length;


  if (INITIAL_FUNCTIONS.length === 0) { 
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }
  
  const ScreenCoverDialogComponent = () => (
    <Dialog open={showScreenCoverDialog} onOpenChange={(open) => { if(!open) setShowScreenCoverDialog(false)}}>
      <DialogContent className="sm:max-w-md text-center">
        <DialogHeader>
          <DialogTitle className="text-2xl font-headline flex items-center justify-center">
            <ShieldCheck className="w-8 h-8 mr-2 text-primary" />
            {screenCoverDialogContent.title}
          </DialogTitle>
        </DialogHeader>
        <DialogDescription className="my-4 text-lg">
          {screenCoverDialogContent.description}
        </DialogDescription>
        <DialogFooter className="sm:justify-center">
          <Button onClick={handleConfirmAndHide} size="lg">
            Confirm & Continue
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
            Rational Guesser - P2P
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
            currentPlayer={currentPlayer}
            currentQuestion={currentQuestion}
            currentAnswer={currentAnswer}
            isLoading={isLoading}
            onAskQuestion={handleAskQuestion}
            onProvideAnswer={handleProvideAnswer}
            onToggleGuessingMode={handleToggleGuessingMode}
            isGuessingActive={isGuessingActive}
            onPlayer1Confirm={handleP1ReadyToHideScreen}
            onPlayer2Confirm={handleP2ReadyToHideScreen}
            player1SecretFunctionId={player1SecretFunction?.id || null}
            player2SecretFunctionId={player2SecretFunction?.id || null}
            p1RemainingCount={p1RemainingCount}
            p2RemainingCount={p2RemainingCount}
          />
           {gamePhase === 'GAME_OVER' && (
            <Alert variant={gameWinner === 'P1' ? 'default' : (gameWinner === 'P2' ? 'default' : 'destructive')} className="mt-4">
              <AlertTitle className="font-headline">
                {gameWinner === 'P1' && "Player 1 Wins!"}
                {gameWinner === 'P2' && "Player 2 Wins!"}
              </AlertTitle>
              <AlertDescription>
                {gameWinner === 'P1' && player2SecretFunction && `P1 correctly guessed P2's function: ${player2SecretFunction.equation}`}
                {gameWinner === 'P1' && !player2SecretFunction && `P2 guessed incorrectly. P1's function was: ${player1SecretFunction?.equation}`}
                {gameWinner === 'P2' && player1SecretFunction && `P2 correctly guessed P1's function: ${player1SecretFunction.equation}`}
                {gameWinner === 'P2' && !player1SecretFunction && `P1 guessed incorrectly. P2's function was: ${player2SecretFunction?.equation}`}
                <br />
                {player1SecretFunction && `Player 1's secret function was: ${player1SecretFunction.equation}`}
                <br />
                {player2SecretFunction && `Player 2's secret function was: ${player2SecretFunction.equation}`}
              </AlertDescription>
            </Alert>
          )}
        </aside>

        <section className="lg:w-2/3 xl:w-3/4">
          <FunctionGrid
            key={gridKey} 
            functionsToDisplay={functionsToDisplay}
            gridMode={gridMode}
            currentPlayer={currentPlayer}
            isGuessingActive={isGuessingActive}
            onSelectSecretFunction={onSelectSecretFunctionForGrid}
            onToggleEliminate={onToggleEliminateForGrid}
            onMakeFinalGuess={onMakeFinalGuessForGrid}
            selectedSecretFunctionIdForHighlight={selectedSecretFunctionIdForUI}
            actualSecretFunctionForHighlight={actualSecretFunctionForAnsweringUI}
          />
        </section>
      </main>
      
      <ScreenCoverDialogComponent />

      <footer className="text-center py-8 mt-auto text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} Rational Guesser P2P. Two-player fun by Firebase Studio.</p>
      </footer>
    </div>
  );
}

    