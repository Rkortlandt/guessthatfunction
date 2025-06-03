
import type { RationalFunction } from '@/lib/game-data';
import { RationalFunctionCard } from './RationalFunctionCard';

type Player = 'P1' | 'P2';
type GridMode = 'selecting' | 'viewing_opponent_grid' | 'answering_own_card' | 'game_over';
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

interface FunctionGridProps {
  functionsToDisplay: RationalFunction[];
  gridMode: GridMode;
  currentPlayer: Player;
  isGuessingActive: boolean;
  onSelectSecretFunction?: (id: string) => void;
  onToggleEliminate?: (id: string) => void;
  onMakeFinalGuess?: (id: string) => void;
  selectedSecretFunctionIdForHighlight?: string | null;
  actualSecretFunctionForHighlight?: RationalFunction | null;
  gamePhase: GamePhase; // Added to control card clickability during EVALUATE
}

export function FunctionGrid({
  functionsToDisplay,
  gridMode,
  currentPlayer,
  isGuessingActive,
  onSelectSecretFunction,
  onToggleEliminate,
  onMakeFinalGuess,
  selectedSecretFunctionIdForHighlight,
  actualSecretFunctionForHighlight,
  gamePhase,
}: FunctionGridProps) {

  const isEliminationAllowed = (gamePhase === 'P1_TURN_EVALUATE' && currentPlayer === 'P1') ||
                               (gamePhase === 'P2_TURN_EVALUATE' && currentPlayer === 'P2');

  const showSelectButtonForCard = (func: RationalFunction): boolean => {
    return gridMode === 'selecting' && !!onSelectSecretFunction;
  };

  // Eliminate button only shown if it's the evaluation phase for the current player AND not in guessing mode.
  const showEliminateButtonForCard = (func: RationalFunction): boolean => {
    return gridMode === 'viewing_opponent_grid' && 
           !!onToggleEliminate && 
           !isGuessingActive &&
           isEliminationAllowed;
  };

  // Make guess button only shown if it's an action phase for the current player AND in guessing mode.
  const showMakeGuessButtonForCard = (func: RationalFunction): boolean => {
    const isActionPhaseForCurrentPlayer = (gamePhase === 'P1_TURN_ACTION' && currentPlayer === 'P1') ||
                                       (gamePhase === 'P2_TURN_ACTION' && currentPlayer === 'P2');
    return gridMode === 'viewing_opponent_grid' && 
           !func.isEliminated && 
           !!onMakeFinalGuess && 
           isGuessingActive && 
           isActionPhaseForCurrentPlayer;
  };

  const isCardSelectedAsSecretForUI = (funcId: string): boolean => {
    return gridMode === 'selecting' && selectedSecretFunctionIdForHighlight === funcId;
  };

  const isCardActuallySecretForUI = (funcId: string): boolean => {
    return (gridMode === 'answering_own_card' || gridMode === 'game_over') && actualSecretFunctionForHighlight?.id === funcId;
  };


  let gridLayoutClass = 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4';
  if ((gridMode === 'answering_own_card' || gridMode === 'game_over') && functionsToDisplay.length === 1) {
    gridLayoutClass = 'grid-cols-1 place-items-center';
  }


  return (
    <div className={`grid gap-4 p-4 bg-secondary/30 rounded-lg shadow-inner ${gridLayoutClass}`}>
      {functionsToDisplay.map((func) => (
        <RationalFunctionCard
          key={func.id}
          func={func}
          showSelectButton={showSelectButtonForCard(func)}
          onSelectSecretFunction={onSelectSecretFunction}
          isSelectedAsSecret={isCardSelectedAsSecretForUI(func.id)}

          showEliminateButton={showEliminateButtonForCard(func)}
          onToggleEliminate={onToggleEliminate}

          isPotentialGuess={showMakeGuessButtonForCard(func)}
          onMakeFinalGuess={onMakeFinalGuess}

          isActuallySecret={isCardActuallySecretForUI(func.id)}
          isEliminatedOverride={gridMode === 'game_over' ? false : func.isEliminated}
        />
      ))}
      {(gridMode === 'answering_own_card' || gridMode === 'game_over') && functionsToDisplay.length === 0 && (
        <p className="text-muted-foreground col-span-full text-center py-8">
          {gridMode === 'answering_own_card' ? "Loading secret function..." : "No function to display for game over."}
        </p>
      )}
       {gridMode === 'selecting' && functionsToDisplay.length === 0 && (
         <p className="text-muted-foreground col-span-full text-center py-8">Loading functions for selection...</p>
       )}
    </div>
  );
}
