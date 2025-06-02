
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Lightbulb, HelpCircle, CheckCircle, XCircle, ShieldQuestion, UserCheck, UserX, ShieldCheck } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

type GamePhase =
  | 'P1_SELECTING'
  | 'P2_ASKING'
  | 'P1_ANSWERING'
  | 'P2_EVALUATING'
  | 'P2_GUESSING'
  | 'GAME_OVER';
type GameResult = 'P1_WINS' | 'P2_WINS' | null;

interface GameControlsProps {
  gamePhase: GamePhase;
  gameResult?: GameResult;
  remainingFunctionsCount: number;
  currentQuestionFromP2: string | null;
  player1ManualAnswer: boolean | null;
  isLoading: boolean;
  onAskQuestion: (question: string) => void;
  onAnswerQuestion: (answer: boolean) => void;
  onStartGuessing: () => void;
  onCancelGuessing: () => void;
  player1SecretFunctionId: string | null;
  onP1ReadyToHideScreen: () => void; // New prop
}

export function GameControls({
  gamePhase,
  gameResult,
  remainingFunctionsCount,
  currentQuestionFromP2,
  player1ManualAnswer,
  isLoading,
  onAskQuestion,
  onAnswerQuestion,
  onStartGuessing,
  onCancelGuessing,
  player1SecretFunctionId,
  onP1ReadyToHideScreen, // New prop
}: GameControlsProps) {
  const [p2Question, setP2Question] = useState('');
  const [p1Answer, setP1Answer] = useState<'yes' | 'no' | ''>('');

  const handleSubmitP2Question = () => {
    if (!p2Question.trim()) return;
    onAskQuestion(p2Question);
  };

  const handleSubmitP1Answer = () => {
    if (p1Answer === '') return;
    onAnswerQuestion(p1Answer === 'yes');
  };

  const getGamePhaseMessage = () => {
    if (gamePhase === 'GAME_OVER') {
      if (gameResult === 'P2_WINS') return "Congratulations Player 2! You guessed the function!";
      if (gameResult === 'P1_WINS') return "Player 1 Wins! Player 2 couldn't guess it.";
      return "Game Over.";
    }
    switch (gamePhase) {
      case 'P1_SELECTING':
        return player1SecretFunctionId 
          ? 'Player 1: Secret function selected! Click "Confirm & Prepare" below to hide the screen and pass to Player 2.' 
          : 'Player 1: Select your secret function from the grid. Player 2, please look away!';
      case 'P2_ASKING':
        return 'Player 2: Ask a yes/no question about Player 1\'s secret function.';
      case 'P1_ANSWERING':
        return player1ManualAnswer !== null
          ? 'Player 1: Answer provided! Click "Confirm & Prepare" below to hide the screen and pass to Player 2.'
          : 'Player 1: Answer the question below. Player 2, please look away!';
      case 'P2_EVALUATING':
        return 'Player 2: Player 1 has answered! Use the clue to eliminate functions.';
      case 'P2_GUESSING':
        return 'Player 2: Select the function you believe is Player 1\'s secret choice.';
      default:
        return '';
    }
  };

  const showP1ConfirmButton = 
    (gamePhase === 'P1_SELECTING' && !!player1SecretFunctionId && !isLoading) ||
    (gamePhase === 'P1_ANSWERING' && player1ManualAnswer !== null && !isLoading);

  return (
    <Card className="shadow-xl">
      <CardHeader>
        <CardTitle className="font-headline text-2xl flex items-center gap-2">
          <HelpCircle className="text-primary" />
          Game Controls
        </CardTitle>
        <CardDescription>
          Remaining Functions: <span className="font-bold text-primary">{remainingFunctionsCount}</span>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="p-3 bg-muted/50 rounded-md text-center">
          <p className="font-semibold text-lg font-headline">{getGamePhaseMessage()}</p>
        </div>

        {/* Player 2: Asking Question */}
        {gamePhase === 'P2_ASKING' && (
          <div className="space-y-3">
            <Label htmlFor="p2-question">Player 2's Question:</Label>
            <Textarea
              id="p2-question"
              placeholder="e.g., Does the function have a vertical asymptote at x=0?"
              value={p2Question}
              onChange={(e) => setP2Question(e.target.value)}
              rows={3}
              disabled={isLoading}
              aria-label="Player 2's question for Player 1"
            />
            <Button
              onClick={handleSubmitP2Question}
              disabled={isLoading || !p2Question.trim()}
              className="w-full"
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <ShieldQuestion className="mr-2 h-4 w-4" />
              )}
              Ask Player 1
            </Button>
          </div>
        )}

        {/* Player 1: Answering Question */}
        {gamePhase === 'P1_ANSWERING' && currentQuestionFromP2 && player1ManualAnswer === null && (
          <div className="space-y-4 p-4 border rounded-md bg-secondary/20">
            <p className="font-semibold">Player 2 asked:</p>
            <p className="text-muted-foreground italic">"{currentQuestionFromP2}"</p>
            <RadioGroup 
              value={p1Answer} 
              onValueChange={(value: 'yes' | 'no') => {
                setP1Answer(value);
                onAnswerQuestion(value === 'yes'); // Directly call onAnswerQuestion to update state in parent
              }}
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
            {/* Submit button for P1 answer removed, answer is logged on change, P1_CONFIRM_BUTTON handles progression */}
          </div>
        )}
        
        {/* Player 1: Confirm action and hide screen button */}
        {showP1ConfirmButton && (
          <div className="pt-4 border-t">
            <Button onClick={onP1ReadyToHideScreen} className="w-full" size="lg">
              <ShieldCheck className="mr-2 h-5 w-5" />
              Confirm & Prepare for Player 2
            </Button>
          </div>
        )}

        {/* Player 2: Evaluating Player 1's Answer */}
        {gamePhase === 'P2_EVALUATING' && player1ManualAnswer !== null && (
          <Card className="bg-accent/10 border-accent">
            <CardHeader>
              <CardTitle className="text-lg font-headline flex items-center">
                {player1ManualAnswer ? <UserCheck className="text-green-500 mr-2" /> : <UserX className="text-red-500 mr-2" />}
                Player 1 Answered: {player1ManualAnswer ? 'Yes' : 'No'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Player 2: Use this clue to eliminate functions from the grid. Then ask another question or make a final guess.</p>
            </CardContent>
          </Card>
        )}

        {/* Player 2: Option to Make Final Guess */}
        {(gamePhase === 'P2_ASKING' || gamePhase === 'P2_EVALUATING') && (
          <div className="pt-4 border-t">
            <Button onClick={onStartGuessing} variant="secondary" className="w-full" disabled={isLoading || remainingFunctionsCount <=0 }>
              Make a Final Guess
            </Button>
          </div>
        )}
        
        {/* Player 2: Cancelling Guess Mode */}
        {gamePhase === 'P2_GUESSING' && (
           <div className="pt-4 border-t">
            <Button onClick={onCancelGuessing} variant="outline" className="w-full">
              Cancel Guess & Ask More Questions
            </Button>
          </div>
        )}

      </CardContent>
    </Card>
  );
}
