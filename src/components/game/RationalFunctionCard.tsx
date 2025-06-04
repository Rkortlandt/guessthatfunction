
import type { RationalFunction } from '@/lib/game-data';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { EyeOff, Eye, CheckSquare, Square, ShieldAlert, HelpCircleIcon } from 'lucide-react';
import Image from 'next/image';

interface RationalFunctionCardProps {
  func: RationalFunction;
  showSelectButton?: boolean;
  onSelectSecretFunction?: (id: string) => void;
  isSelectedAsSecret?: boolean;

  showEliminateButton?: boolean;
  onToggleEliminate?: (id: string) => void;

  showMakeGuessButton?: boolean;
  onMakeFinalGuess?: (id: string) => void;

  isActuallySecret?: boolean;
  isEliminatedOverride?: boolean;
}

export function RationalFunctionCard({
  func,
  showSelectButton,
  onSelectSecretFunction,
  isSelectedAsSecret,
  showEliminateButton,
  onToggleEliminate,
  showMakeGuessButton,
  onMakeFinalGuess,
  isActuallySecret,
  isEliminatedOverride,
}: RationalFunctionCardProps) {

  const cardClassBase = 'transition-opacity duration-300 ease-in-out relative flex flex-col';
  let cardClass = cardClassBase;

  const displayEliminated = typeof isEliminatedOverride === 'boolean' ? isEliminatedOverride : func.isEliminated;

  if (isActuallySecret) {
    cardClass = `${cardClassBase} border-green-500 border-4 ring-4 ring-green-500/50 shadow-2xl`;
  } else if (isSelectedAsSecret && showSelectButton) {
    cardClass = `${cardClassBase} border-primary border-4 shadow-2xl`;
  } else if (displayEliminated && !showSelectButton && !isActuallySecret) {
    cardClass = `${cardClassBase} opacity-40 hover:shadow-lg`;
  } else {
    cardClass = `${cardClassBase} hover:shadow-lg`;
  }

  const handleEliminateClick = () => {
    if (showEliminateButton && onToggleEliminate) {
      onToggleEliminate(func.id);
    }
  };

  const handleSelectClick = () => {
    if (showSelectButton && onSelectSecretFunction) {
      onSelectSecretFunction(func.id);
    }
  };

  return (
    <Card className={cardClass} data-testid={`function-card-${func.id}`}>
      <CardHeader className="p-4">
        <CardTitle className="font-headline text-xl">{func.sillyName}</CardTitle>
        <CardDescription className="text-xs text-muted-foreground">{func.equation}</CardDescription>
      </CardHeader>
      <CardContent className="p-4 pt-0 flex-grow">
        <div className="aspect-[3/2] w-full bg-muted rounded overflow-hidden mb-2">
          <Image
            src={func.graphImageUrl}
            alt={`Graph of ${func.equation} (${func.sillyName})`}
            width={600}
            height={400}
            className="object-cover w-full h-full"
            data-ai-hint="graph plot"
            priority={false} // only make high-priority images LCP candidates
          />
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0 flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2 min-h-[40px] mt-auto">
        {showSelectButton && onSelectSecretFunction && (
          <Button
            variant={isSelectedAsSecret ? "secondary" : "default"}
            size="sm"
            onClick={handleSelectClick}
            aria-label={isSelectedAsSecret ? `Deselect ${func.sillyName} as secret` : `Select ${func.sillyName} as secret`}
            className="w-full sm:w-auto"
          >
            {isSelectedAsSecret ? <CheckSquare className="mr-2" /> : <Square className="mr-2" />}
            {isSelectedAsSecret ? 'Selected Secret' : 'Select as Secret'}
          </Button>
        )}
        {showEliminateButton && onToggleEliminate && !isActuallySecret && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleEliminateClick}
            aria-label={displayEliminated ? `Restore function ${func.sillyName}` : `Eliminate function ${func.sillyName}`}
            className="w-full sm:w-auto"
          >
            {displayEliminated ? <Eye className="mr-2" /> : <EyeOff className="mr-2" />}
            {displayEliminated ? 'Restore' : 'Eliminate'}
          </Button>
        )}
        {showMakeGuessButton && onMakeFinalGuess && !isActuallySecret && (
          <Button variant="destructive" size="sm" onClick={() => onMakeFinalGuess(func.id)} className="w-full sm:w-auto">
            <HelpCircleIcon className="mr-2" /> Make Final Guess
          </Button>
        )}
      </CardFooter>
      {isActuallySecret && (
        <div className="absolute top-2 right-2 bg-green-600 text-white p-1 px-2 rounded-full text-xs flex items-center z-10 shadow">
          <ShieldAlert className="w-3 h-3 mr-1" /> Secret
        </div>
      )}
    </Card>
  );
}
