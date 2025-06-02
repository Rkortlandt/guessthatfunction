
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Lightbulb, HelpCircle, CheckCircle, XCircle, ShieldQuestion, UserCheck, UserX, ShieldCheck, Mic, MessageSquare } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

type Player = 'P1' | 'P2';
type GamePhase =
  | 'P1_SELECTING'
  | 'P1_CONFIRM_SELECTION_DIALOG'
  | 'P2_SELECTING'
  | 'P2_CONFIRM_SELECTION_DIALOG'
  | 'P1_TURN_ACTION'
  | 'P2_TURN_ANSWER_DIALOG'
  | 'P1_TURN_EVALUATE'
  | 'P2_TURN_ACTION'
  | 'P1_TURN_ANSWER_DIALOG'
  | 'P2_TURN_EVALUATE'
  | 'GAME_OVER';

interface GameControlsProps {
  gamePhase: GamePhase;
  currentPlayer: Player;
  currentQuestion: string | null;
  currentAnswer: boolean | null; // The answer provided by the opponent
  isLoading: boolean;
  onAskQuestion: (question: string) => void;
  onProvideAnswer: (answer: boolean) => void; // Called when current player provides their answer
  onStartGuessing: () => void; // To signal intent to guess
  onPlayer1Confirm: () => void; // P1 confirms selection or answer
  onPlayer2Confirm: () => void; // P2 confirms selection or answer
  player1SecretFunctionId: string | null;
  player2SecretFunctionId: string | null;
  p1RemainingCount: number; // Number of functions P1 thinks P2 might have
  p2RemainingCount: number; // Number of functions P2 thinks P1 might have
}

export function GameControls({
  gamePhase,
  currentPlayer,
  currentQuestion,
  currentAnswer,
  isLoading,
  onAskQuestion,
  onProvideAnswer,
  onStartGuessing,
  onPlayer1Confirm,
  onPlayer2Confirm,
  player1SecretFunctionId,
  player2SecretFunctionId,
  p1RemainingCount,
  p2RemainingCount,
}: GameControlsProps) {
  const [questionText, setQuestionText] = useState('');
  const [answerChoice, setAnswerChoice] = useState<'yes' | 'no' | ''>('');

  useEffect(() => {
    // Reset question text when currentQuestion is cleared (e.g., after an answer is evaluated)
    if (!currentQuestion) {
      setQuestionText('');
    }
    // Reset answer choice when currentAnswer is cleared or player changes
    if (currentAnswer === null) {
        setAnswerChoice('');
    }
  }, [currentQuestion, currentAnswer, currentPlayer]);


  const handleSubmitQuestion = () => {
    if (!questionText.trim()) return;
    onAskQuestion(questionText);
    // setQuestionText(''); // Question text will clear on next effect if currentQuestion clears
  };

  const handleAnswerChange = (value: 'yes' | 'no') => {
    setAnswerChoice(value);
    onProvideAnswer(value === 'yes');
  };

  const getGamePhaseMessage = () => {
    switch (gamePhase) {
      case 'P1_SELECTING':
        return player1SecretFunctionId 
          ? "P1: Secret function selected! Click 'Confirm & Pass to P2' below." 
          : "Player 1: Select your secret function. Player 2, please look away!";
      case 'P2_SELECTING':
        return player2SecretFunctionId
          ? "P2: Secret function selected! Click 'Confirm & Pass to P1' below."
          : "Player 2: Select your secret function. Player 1, please look away!";
      case 'P1_TURN_ACTION':
        return "Player 1's Turn: Ask a yes/no question about P2's function, or make a final guess.";
      case 'P2_TURN_ANSWER_DIALOG':
        return currentAnswer !== null
          ? "P2: Answer confirmed. Click 'Confirm & Pass to P1' below."
          : "Player 2: Answer P1's question. P1, please look away!";
      case 'P1_TURN_EVALUATE':
        return `Player 1: P2 answered '${currentAnswer ? 'Yes' : 'No'}'. Eliminate functions, then ask or guess.`;
      case 'P2_TURN_ACTION':
        return "Player 2's Turn: Ask a yes/no question about P1's function, or make a final guess.";
      case 'P1_TURN_ANSWER_DIALOG':
        return currentAnswer !== null
          ? "P1: Answer confirmed. Click 'Confirm & Pass to P2' below."
          : "Player 1: Answer P2's question. P2, please look away!";
      case 'P2_TURN_EVALUATE':
        return `Player 2: P1 answered '${currentAnswer ? 'Yes' : 'No'}'. Eliminate functions, then ask or guess.`;
      case 'GAME_OVER':
        return "Game Over! Check the results below.";
      default:
        return `Current Player: ${currentPlayer}. Phase: ${gamePhase}`;
    }
  };
  
  const opponent = currentPlayer === 'P1' ? 'P2' : 'P1';
  const remainingForCurrentPlayerToGuess = currentPlayer === 'P1' ? p1RemainingCount : p2RemainingCount;

  const showConfirmButton = 
    (gamePhase === 'P1_SELECTING' && !!player1SecretFunctionId && currentPlayer === 'P1') ||
    (gamePhase === 'P2_SELECTING' && !!player2SecretFunctionId && currentPlayer === 'P2') ||
    (gamePhase === 'P1_TURN_ANSWER_DIALOG' && currentAnswer !== null && currentPlayer === 'P2') || // P2 answering P1's Q
    (gamePhase === 'P2_TURN_ANSWER_DIALOG' && currentAnswer !== null && currentPlayer === 'P1');   // P1 answering P2's Q


  return (
    <Card className="shadow-xl">
      <CardHeader>
        <CardTitle className="font-headline text-2xl flex items-center gap-2">
          <MessageSquare className="text-primary" />
          Player Controls
        </CardTitle>
        <CardDescription>
          {gamePhase !== 'GAME_OVER' && gamePhase !== 'P1_SELECTING' && gamePhase !== 'P2_SELECTING' && (
            `Player ${currentPlayer}, you have ${remainingForCurrentPlayerToGuess} potential function(s) left for ${opponent}.`
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="p-3 bg-muted/50 rounded-md text-center">
          <p className="font-semibold text-lg font-headline">{getGamePhaseMessage()}</p>
        </div>

        {/* Asking Question (P1_TURN_ACTION or P2_TURN_ACTION) */}
        {(gamePhase === 'P1_TURN_ACTION' && currentPlayer === 'P1' || gamePhase === 'P2_TURN_ACTION' && currentPlayer === 'P2') && (
          <div className="space-y-3">
            <Label htmlFor="player-question">Your Question for Player {opponent}:</Label>
            <Textarea
              id="player-question"
              placeholder="e.g., Does your function have a vertical asymptote at x=0?"
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              rows={3}
              disabled={isLoading}
              aria-label={`Player ${currentPlayer}'s question for Player ${opponent}`}
            />
            <Button
              onClick={handleSubmitQuestion}
              disabled={isLoading || !questionText.trim()}
              className="w-full"
            >
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldQuestion className="mr-2 h-4 w-4" />}
              Ask Player {opponent}
            </Button>
          </div>
        )}

        {/* Answering Question (P1_TURN_ANSWER_DIALOG or P2_TURN_ANSWER_DIALOG) */}
        {((gamePhase === 'P1_TURN_ANSWER_DIALOG' && currentPlayer === 'P1') || (gamePhase === 'P2_TURN_ANSWER_DIALOG' && currentPlayer === 'P2')) && currentQuestion && currentAnswer === null && (
          <div className="space-y-4 p-4 border rounded-md bg-secondary/20">
            <p className="font-semibold">Player {currentPlayer === 'P1' ? 'P2' : 'P1'} asked:</p>
            <p className="text-muted-foreground italic">"{currentQuestion}"</p>
            <RadioGroup
              value={answerChoice}
              onValueChange={handleAnswerChange}
              className="flex space-x-4"
              disabled={isLoading}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="yes" id="r-yes" />
                <Label htmlFor="r-yes">Yes</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="no" id="r-no" />
                <Label htmlFor="r-no">No</Label>
              </div>
            </RadioGroup>
          </div>
        )}
        
        {/* Confirm Button for various stages */}
        {showConfirmButton && (
          <div className="pt-4 border-t">
            <Button 
              onClick={currentPlayer === 'P1' ? onPlayer1Confirm : onPlayer2Confirm} 
              className="w-full" 
              size="lg"
              disabled={isLoading || 
                (gamePhase === 'P1_SELECTING' && !player1SecretFunctionId) ||
                (gamePhase === 'P2_SELECTING' && !player2SecretFunctionId) ||
                ((gamePhase === 'P1_TURN_ANSWER_DIALOG' || gamePhase === 'P2_TURN_ANSWER_DIALOG') && currentAnswer === null)
              }
            >
              <ShieldCheck className="mr-2 h-5 w-5" />
              Confirm & Pass to Player {gamePhase.includes('P1_') ? 'P2' : 'P1'}
            </Button>
          </div>
        )}


        {/* Evaluating Opponent's Answer (P1_TURN_EVALUATE or P2_TURN_EVALUATE) */}
        {((gamePhase === 'P1_TURN_EVALUATE' && currentPlayer === 'P1') || (gamePhase === 'P2_TURN_EVALUATE' && currentPlayer === 'P2')) && currentAnswer !== null && (
          <Card className="bg-accent/10 border-accent">
            <CardHeader>
              <CardTitle className="text-lg font-headline flex items-center">
                {currentAnswer ? <UserCheck className="text-green-500 mr-2" /> : <UserX className="text-red-500 mr-2" />}
                Player {opponent} Answered: {currentAnswer ? 'Yes' : 'No'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Player {currentPlayer}: Use this clue to eliminate functions from Player {opponent}'s grid. 
                Then ask another question or make a final guess. (Click on cards to eliminate/restore them)
              </p>
            </CardContent>
          </Card>
        )}

        {/* Option to Make Final Guess (during P1_TURN_ACTION or P2_TURN_ACTION) */}
        {((gamePhase === 'P1_TURN_ACTION' && currentPlayer === 'P1') || (gamePhase === 'P2_TURN_ACTION' && currentPlayer === 'P2')) && (
          <div className="pt-4 border-t">
            <Button 
              onClick={onStartGuessing} 
              variant="secondary" 
              className="w-full" 
              disabled={isLoading || remainingForCurrentPlayerToGuess <= 0}
            >
              <HelpCircle className="mr-2 h-4 w-4" />
              Make a Final Guess for Player {opponent}'s Function
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
