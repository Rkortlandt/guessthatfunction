
import type { RationalFunction } from '@/lib/game-data';
import { RationalFunctionCard } from './RationalFunctionCard';

interface FunctionGridProps {
  functions: RationalFunction[];
  onToggleEliminate: (id: string) => void;
  isGameActive: boolean;
  onMakeFinalGuess?: (id:string) => void;
  isGuessingPhase?: boolean; 
  isPlayer1Selecting?: boolean; 
  player1IsAnsweringPhase?: boolean; // New prop: True if P1 is in their answering phase
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
  player1IsAnsweringPhase, // New prop
  onSelectSecretFunction,
  selectedSecretFunctionId,
}: FunctionGridProps) {

  let functionsToDisplay = functions;

  if (player1IsAnsweringPhase && selectedSecretFunctionId) {
    functionsToDisplay = functions.filter(f => f.id === selectedSecretFunctionId);
  }

  return (
    <div className={`grid gap-4 p-4 bg-secondary/30 rounded-lg shadow-inner ${player1IsAnsweringPhase && functionsToDisplay.length === 1 ? 'grid-cols-1 place-items-center' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'}`}>
      {functionsToDisplay.map((func) => (
        <RationalFunctionCard 
          key={func.id} 
          func={func} 
          onToggleEliminate={onToggleEliminate}
          showEliminateButton={isGameActive && !isGuessingPhase && !isPlayer1Selecting && !player1IsAnsweringPhase}
          onMakeFinalGuess={onMakeFinalGuess}
          isPotentialGuess={isGuessingPhase && !func.isEliminated && !player1IsAnsweringPhase}
          showSelectButton={isPlayer1Selecting && onSelectSecretFunction !== undefined}
          onSelectSecretFunction={onSelectSecretFunction}
          isSelectedAsSecret={selectedSecretFunctionId === func.id && isPlayer1Selecting} // Only show selection border during P1_SELECTING
          isActuallySecret={player1IsAnsweringPhase && func.id === selectedSecretFunctionId} // Highlight for P1 during P1_ANSWERING
        />
      ))}
      {player1IsAnsweringPhase && functionsToDisplay.length === 0 && selectedSecretFunctionId && (
        <p className="text-muted-foreground col-span-full text-center py-8">Loading Player 1's secret function...</p>
      )}
    </div>
  );
}
