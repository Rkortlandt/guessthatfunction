import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Lightbulb, HelpCircle, CheckCircle, XCircle, Users } from 'lucide-react';
import type { AnswerQuestionOutput } from '@/ai/flows/answer-question';

interface GameControlsProps {
  onAskAI: (question: string) => Promise<void>;
  aiResponse: AnswerQuestionOutput | null;
  isLoadingAI: boolean;
  remainingFunctionsCount: number;
  gamePhase: 'ASKING' | 'AI_THINKING' | 'EVALUATING' | 'GAME_OVER' | 'GUESSING';
  gameResult?: 'WIN' | 'LOSS' | null;
  onStartGuessing: () => void;
  onCancelGuessing: () => void;
}

export function GameControls({
  onAskAI,
  aiResponse,
  isLoadingAI,
  remainingFunctionsCount,
  gamePhase,
  gameResult,
  onStartGuessing,
  onCancelGuessing,
}: GameControlsProps) {
  const [question, setQuestion] = useState('');

  const handleSubmitQuestion = async () => {
    if (!question.trim()) return;
    await onAskAI(question);
  };

  const getGamePhaseMessage = () => {
    if (gamePhase === 'GAME_OVER') {
      if (gameResult === 'WIN') return "Congratulations! You guessed the function!";
      if (gameResult === 'LOSS') return "Game Over. Better luck next time!";
      return "Game Over.";
    }
    switch (gamePhase) {
      case 'ASKING':
        return 'Ask a yes/no question about the AI\'s secret function.';
      case 'AI_THINKING':
        return 'The AI is pondering your question...';
      case 'EVALUATING':
        return 'AI has answered! Use the clue to eliminate functions.';
      case 'GUESSING':
        return 'Select the function you believe is the AI\'s secret choice.';
      default:
        return '';
    }
  };

  return (
    <Card className="shadow-xl">
      <CardHeader>
        <CardTitle className="font-headline text-2xl flex items-center gap-2">
          <HelpCircle className="text-primary" />
          Player Controls
        </CardTitle>
        <CardDescription>
          Remaining Functions: <span className="font-bold text-primary">{remainingFunctionsCount}</span>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="p-3 bg-muted/50 rounded-md text-center">
          <p className="font-semibold text-lg font-headline">{getGamePhaseMessage()}</p>
        </div>

        {gamePhase !== 'GAME_OVER' && gamePhase !== 'GUESSING' && (
          <div className="space-y-3">
            <Textarea
              placeholder="e.g., Does the function have a vertical asymptote at x=0?"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              rows={3}
              disabled={isLoadingAI || gamePhase !== 'ASKING'}
              aria-label="Your question for the AI"
            />
            <Button
              onClick={handleSubmitQuestion}
              disabled={isLoadingAI || !question.trim() || gamePhase !== 'ASKING'}
              className="w-full"
            >
              {isLoadingAI ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Lightbulb className="mr-2 h-4 w-4" />
              )}
              Ask AI
            </Button>
          </div>
        )}
        
        {gamePhase === 'EVALUATING' && aiResponse && (
          <Card className="bg-accent/10 border-accent">
            <CardHeader>
              <CardTitle className="text-lg font-headline flex items-center">
                {aiResponse.answer ? <CheckCircle className="text-green-500 mr-2" /> : <XCircle className="text-red-500 mr-2" />}
                AI's Answer: {aiResponse.answer ? 'Yes' : 'No'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm font-semibold">Reasoning:</p>
              <p className="text-sm text-muted-foreground">{aiResponse.reason}</p>
            </CardContent>
          </Card>
        )}

        {gamePhase !== 'GAME_OVER' && gamePhase !== 'AI_THINKING' && (
          <div className="pt-4 border-t">
          {gamePhase === 'GUESSING' ? (
            <Button onClick={onCancelGuessing} variant="outline" className="w-full">
              Cancel Guess & Ask More Questions
            </Button>
          ) : (
            <Button onClick={onStartGuessing} variant="secondary" className="w-full" disabled={isLoadingAI || remainingFunctionsCount <=1}>
              Make a Final Guess
            </Button>
          )}
          </div>
        )}

      </CardContent>
    </Card>
  );
}
