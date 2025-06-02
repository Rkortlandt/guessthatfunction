import type { RationalFunction } from '@/lib/game-data';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { EyeOff, Eye } from 'lucide-react';

interface RationalFunctionCardProps {
  func: RationalFunction;
  onToggleEliminate: (id: string) => void;
  isGameActive: boolean;
  onMakeFinalGuess?: (id: string) => void;
  isPotentialGuess?: boolean;
}

export function RationalFunctionCard({ func, onToggleEliminate, isGameActive, onMakeFinalGuess, isPotentialGuess }: RationalFunctionCardProps) {
  const cardClass = func.isEliminated
    ? 'opacity-40 transition-opacity duration-300 ease-in-out relative'
    : 'transition-opacity duration-300 ease-in-out hover:shadow-lg relative';

  const handleCardClick = () => {
    if (isGameActive && !isPotentialGuess) { // Don't eliminate if it's a potential final guess phase
      onToggleEliminate(func.id);
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
      <CardFooter className="p-4 pt-0 flex justify-end">
        {isGameActive && !isPotentialGuess && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleCardClick}
            aria-label={func.isEliminated ? `Restore function ${func.equation}` : `Eliminate function ${func.equation}`}
          >
            {func.isEliminated ? <Eye className="mr-2" /> : <EyeOff className="mr-2" />}
            {func.isEliminated ? 'Restore' : 'Eliminate'}
          </Button>
        )}
        {isPotentialGuess && onMakeFinalGuess && (
           <Button variant="primary" size="sm" onClick={() => onMakeFinalGuess(func.id)}>
            Make Final Guess
           </Button>
        )}
      </CardFooter>
    </Card>
  );
}
