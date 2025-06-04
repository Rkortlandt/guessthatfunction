import React, { useState } from 'react';
import { RationalFunction, INITIAL_FUNCTIONS } from '@/lib/game-data';
import { RationalFunctionCard } from './RationalFunctionCard';
import { GamePhase, User } from '@/app/page';
// Re-using types from RationalGuesserPage

// Extending RationalFunction to include elimination status for display purposes.
interface RationalFunctionWithDisplayState extends RationalFunction {
  isEliminated: boolean;
}

type GridMode = 'selecting' | 'eliminating' | 'guessing' | 'answering_own_card' | 'game_over';

interface FunctionGridProps {
  gamePhase: GamePhase;
  player: User;
  secretFunctionId: string | null;

  onSelectSecretFunction: (funcId: string) => void;
  onMakeFinalGuess: (funcId: string) => void;
  onToggleEliminate: (funcId: string) => void;

  eliminatedFunctions: string[];
  actualSecretFunction: string | null;
}

export function FunctionGrid({
  gamePhase,
  player,
  secretFunctionId,
  onSelectSecretFunction,
  onMakeFinalGuess,
  onToggleEliminate,
  eliminatedFunctions,
  actualSecretFunction,
}: FunctionGridProps) {

  const [isGuessingActive, setIsGuessingActive] = useState<boolean>(false);

  const gridMode: GridMode = (() => {
    if (gamePhase === 'GAME_OVER') {
      return 'game_over';
    }
    if (gamePhase === 'SELECTING_FUNCTIONS') {
      return 'selecting';
    }
    if (((gamePhase === 'P1_QUESTION' && player.role === 'player1') ||
      (gamePhase === 'P2_QUESTION' && player.role === 'player2')) && isGuessingActive) {
      return 'guessing';
    }
    if ((gamePhase === 'P1_QUESTION' && player.role === 'player1') ||
      (gamePhase === 'P2_QUESTION' && player.role === 'player2')) {
      return 'eliminating';
    }
    if ((gamePhase === 'P1_QUESTION' && player.role === 'player2') ||
      (gamePhase === 'P2_QUESTION' && player.role === 'player1')) {
      return 'answering_own_card';
    }
    return 'selecting'; // Default for initial state/waiting
  })();


  // --- Functions to control button visibility and card highlighting ---

  const showSelectButtonForCard = (func: RationalFunction): boolean => {
    return gridMode === 'selecting';
  };

  const showEliminateButtonForCard = (func: RationalFunctionWithDisplayState): boolean => {
    // Only show eliminate if in 'eliminating' mode AND the card is not already eliminated
    // Also, if it's currently selected as the secret, you shouldn't be able to eliminate it.
    return gridMode === 'eliminating' && !func.isEliminated;
  };

  const showMakeGuessButtonForCard = (func: RationalFunctionWithDisplayState): boolean => {
    // Only show make guess if in 'guessing' mode AND the card is not already eliminated
    return gridMode === 'guessing' && !func.isEliminated;
  };

  const isCardSelectedAsSecretForUI = (funcId: string): boolean => {
    // Only highlight my secret when in selection phase or when showing overall game state (not eliminating/guessing other cards)
    // Avoid highlighting during question phases where the focus is on the opponent's grid.
    return (gridMode === 'selecting' && secretFunctionId === funcId) ||
      (gridMode === 'game_over' && secretFunctionId === funcId && actualSecretFunction !== funcId); // My secret if I didn't win
  };

  const isCardActuallySecretForUI = (funcId: string): boolean => {
    // This is the opponent's secret, revealed at game over or when answering a question
    return (gridMode === 'game_over' || gridMode === 'answering_own_card') && actualSecretFunction === funcId;
  };


  // --- Dynamic CSS class for grid layout ---
  // Always show all functions, so a consistent grid layout is generally best.
  // The centering for single card was for the old filtering logic.
  const gridLayoutClass = 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4';


  return (
    <div className={`grid gap-4 p-4 bg-secondary/30 rounded-lg shadow-inner ${gridLayoutClass}`}>
      {INITIAL_FUNCTIONS.map((func) => { // ALWAYS map over all initial functions
        const funcWithDisplayState: RationalFunctionWithDisplayState = {
          ...func,
          // A function is visually eliminated if it's in the eliminatedFunctions array
          // AND the current mode is one where eliminations should be visible (eliminating, guessing)
          // AND it's not the actual secret function being revealed.
          isEliminated: eliminatedFunctions.includes(func.id) &&
            !isCardActuallySecretForUI(func.id) && // Don't show secret as eliminated
            !isCardSelectedAsSecretForUI(func.id) && // Don't show my secret as eliminated
            (gridMode === 'eliminating' || gridMode === 'guessing'), // Only in these modes
        };

        return (
          <RationalFunctionCard
            key={func.id}
            func={funcWithDisplayState}
            showSelectButton={showSelectButtonForCard(func)}
            onSelectSecretFunction={() => onSelectSecretFunction(func.id)}
            isSelectedAsSecret={isCardSelectedAsSecretForUI(func.id)}

            showEliminateButton={showEliminateButtonForCard(funcWithDisplayState)}
            onToggleEliminate={() => onToggleEliminate(func.id)}

            showMakeGuessButton={showMakeGuessButtonForCard(funcWithDisplayState)}
            onMakeFinalGuess={() => onMakeFinalGuess(func.id)}

            isActuallySecret={isCardActuallySecretForUI(func.id)}
            // Pass the derived isEliminated directly from funcWithDisplayState
            isEliminatedOverride={funcWithDisplayState.isEliminated}
          />
        );
      })}

      {/* --- Conditional Messages (Simplified) --- */}
      {/* These messages are less critical now that all cards are always rendered */}
      {INITIAL_FUNCTIONS.length === 0 && (
        <p className="text-muted-foreground col-span-full text-center py-8">
          Loading functions...
        </p>
      )}

      {/* Temporary UI for toggling guessing mode (for testing purposes) */}
      {/* This button should be moved to GameControls or a dedicated game state management area */}
      {(gridMode === 'eliminating' || gridMode === 'guessing') ? (
        <div className="col-span-full text-center mt-4">
          <button
            onClick={() => setIsGuessingActive(prev => !prev)}
            className="p-2 bg-blue-500 text-white rounded"
          >
            {isGuessingActive ? 'Exit Guessing Mode (Eliminate)' : 'Enter Guessing Mode (Make Guess)'}
          </button>
          <p className="text-sm text-gray-500 mt-1">
            (This button is for testing `eliminating` vs `guessing` modes. In a real game, this would be part of your game flow, potentially managed by a phase change.)
          </p>
        </div>
      ) : null}
      <span>{player.role}</span>
    </div>
  );
}
