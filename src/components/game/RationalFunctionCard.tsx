
import type { RationalFunction } from '@/lib/game-data';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { EyeOff, Eye, CheckSquare, Square, ShieldAlert } from 'lucide-react';

interface RationalFunctionCardProps {
  func: RationalFunction;
  onToggleEliminate: (id: string) => void;
  showEliminateButton: boolean; 
  onMakeFinalGuess?: (id: string) => void;
  isPotentialGuess?: boolean; 
  showSelectButton?: boolean; 
  onSelectSecretFunction?: (id: string) => void; 
  isSelectedAsSecret?: boolean; 
  isActuallySecret?: boolean; // True when this is P1's secret card AND it's P1's answering phase
}

export function RationalFunctionCard({ 
  func, 
  onToggleEliminate, 
  showEliminateButton,
  onMakeFinalGuess, 
  isPotentialGuess,
  showSelectButton,
  onSelectSecretFunction,
  isSelectedAsSecret,
  isActuallySecret // Now used to apply a very prominent style
}: RationalFunctionCardProps) {
  
  const cardClassBase = 'transition-opacity duration-300 ease-in-out relative';
  let cardClass = cardClassBase;

  if (isActuallySecret) {
     // Prominent highlight for P1's secret card during their answering phase
     cardClass = `${cardClassBase} border-green-500 border-4 ring-4 ring-green-500/50 shadow-2xl`;
  } else if (isSelectedAsSecret && showSelectButton) {
    // Highlight for P1 during selection phase
    cardClass = `${cardClassBase} border-primary border-4 shadow-2xl`;
  } else if (func.isEliminated && !showSelectButton && !isActuallySecret) {
    // Dim for eliminated cards, but not if P1 is selecting or if it's the secret card P1 is viewing
    cardClass = `${cardClassBase} opacity-40 hover:shadow-lg`;
  } else {
    cardClass = `${cardClassBase} hover:shadow-lg`;
  }

  const handleEliminateClick = () => {
    if (showEliminateButton) {
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
        <CardTitle className="font-headline text-lg">{func.equation}</CardTitle>
        {func.properties.holes && func.properties.holes.length > 0 && (
           <CardDescription className="text-xs">Hole(s) at: {func.properties.holes.join(', ')}</CardDescription>
        )}
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="aspect-[3/2] w-full bg-muted rounded overflow-hidden mb-2">
          <Image
            src={func.graphImageUrl}
            alt={`Graph of ${func.equation}`}
            width={300}
            height={200}
            className="object-cover w-full h-full"
            data-ai-hint="function graph"
          />
        </div>
        <div className="text-xs space-y-0.5">
          {func.properties.verticalAsymptotes && <p>VA: {func.properties.verticalAsymptotes.join(', ')}</p>}
          {func.properties.horizontalAsymptote && <p>HA: {func.properties.horizontalAsymptote}</p>}
          {func.properties.slantAsymptote && <p>SA: {func.properties.slantAsymptote}</p>}
          {func.properties.xIntercepts && <p>X-int: {func.properties.xIntercepts.join(', ')}</p>}
          {func.properties.yIntercept && <p>Y-int: {func.properties.yIntercept}</p>}
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0 flex justify-end space-x-2">
        {showEliminateButton && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleEliminateClick}
            aria-label={func.isEliminated ? `Restore function ${func.equation}` : `Eliminate function ${func.equation}`}
          >
            {func.isEliminated ? <Eye className="mr-2" /> : <EyeOff className="mr-2" />}
            {func.isEliminated ? 'Restore' : 'Eliminate'}
          </Button>
        )}
        {isPotentialGuess && onMakeFinalGuess && (
           <Button variant="default" size="sm" onClick={() => onMakeFinalGuess(func.id)}>
            Make Final Guess
           </Button>
        )}
        {showSelectButton && onSelectSecretFunction && (
          <Button 
            variant={isSelectedAsSecret ? "secondary" : "default"} 
            size="sm" 
            onClick={handleSelectClick}
            aria-label={isSelectedAsSecret ? `Deselect ${func.equation} as secret` : `Select ${func.equation} as secret`}
          >
            {isSelectedAsSecret ? <CheckSquare className="mr-2" /> : <Square className="mr-2" />}
            {isSelectedAsSecret ? 'Selected Secret' : 'Select as Secret'}
          </Button>
        )}
      </CardFooter>
       {isActuallySecret && ( // Show "Secret" badge if it's P1's actual secret function during their answering turn
        <div className="absolute top-2 right-2 bg-green-500 text-white p-1 rounded-full text-xs flex items-center z-10">
          <ShieldAlert className="w-3 h-3 mr-1" /> Secret
        </div>
      )}
    </Card>
  );
}
