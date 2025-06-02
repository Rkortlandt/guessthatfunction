
import type { RationalFunction } from '@/lib/game-data';
import { RationalFunctionCard } from './RationalFunctionCard';

interface FunctionGridProps {
  functions: RationalFunction[];
  onToggleEliminate: (id: string) => void;
  isGameActive: boolean; // True if P2 is asking, evaluating, or P1 is answering (grid visible but not interactive for P1)
  onMakeFinalGuess?: (id:string) => void;
  isGuessingPhase?: boolean; // P2 is making a final guess
  isPlayer1Selecting?: boolean; // P1 is selecting their secret function
  onSelectSecretFunction?: (id: string) => void;
  selectedSecretFunctionId?: string | null;
}

export function FunctionGrid({ 
  functions, 
  onToggleEliminate, 
  isGameActive, 
  onMakeFinalGuess, 
  isGuessingPhase,
  isPlayer1Selecting,
  onSelectSecretFunction,
  selectedSecretFunctionId,
}: FunctionGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4 bg-secondary/30 rounded-lg shadow-inner">
      {functions.map((func) => (
        <RationalFunctionCard 
          key={func.id} 
          func={func} 
          onToggleEliminate={onToggleEliminate}
          // Eliminate button active for P2 if game is active AND not guessing phase AND not P1 selecting phase
          showEliminateButton={isGameActive && !isGuessingPhase && !isPlayer1Selecting}
          onMakeFinalGuess={onMakeFinalGuess}
          // Guess button active for P2 if in guessing phase AND function not eliminated
          isPotentialGuess={isGuessingPhase && !func.isEliminated}
          // Select button active for P1 if in P1 selecting phase
          showSelectButton={isPlayer1Selecting && onSelectSecretFunction !== undefined}
          onSelectSecretFunction={onSelectSecretFunction}
          isSelectedAsSecret={selectedSecretFunctionId === func.id}
          isActuallySecret={false} // This will be true only for P1 when they are answering
        />
      ))}
    </div>
  );
}
