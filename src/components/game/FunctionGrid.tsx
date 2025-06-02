import type { RationalFunction } from '@/lib/game-data';
import { RationalFunctionCard } from './RationalFunctionCard';

interface FunctionGridProps {
  functions: RationalFunction[];
  onToggleEliminate: (id: string) => void;
  isGameActive: boolean;
  onMakeFinalGuess?: (id: string) => void;
  isGuessingPhase?: boolean;
}

export function FunctionGrid({ functions, onToggleEliminate, isGameActive, onMakeFinalGuess, isGuessingPhase }: FunctionGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4 bg-secondary/30 rounded-lg shadow-inner">
      {functions.map((func) => (
        <RationalFunctionCard 
          key={func.id} 
          func={func} 
          onToggleEliminate={onToggleEliminate}
          isGameActive={isGameActive && !isGuessingPhase} // eliminate button active only if game is active and not in guessing phase
          onMakeFinalGuess={onMakeFinalGuess}
          isPotentialGuess={isGuessingPhase && !func.isEliminated} // show guess button only in guessing phase and for non-eliminated
        />
      ))}
    </div>
  );
}
