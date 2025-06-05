import React, { useState } from 'react';
import { RationalFunction, INITIAL_FUNCTIONS } from '@/lib/game-data';
import { RationalFunctionCard } from './RationalFunctionCard';
import { GamePhase, User } from '@/app/page';
// Re-using types from RationalGuesserPage

// Extending RationalFunction to include elimination status for display purposes.
interface RationalFunctionWithDisplayState extends RationalFunction {
  isEliminated: boolean;
}

type GridMode = 'SELECTING' | 'ELIMINATING' | 'GUESSING' | 'ANSWERING' | 'GAME_OVER';

interface FunctionGridProps {
  gamePhase: GamePhase;
  player: User;
  secretFunctionId: string | null;

  onSelectSecretFunction: (funcId: string) => void;
  onMakeFinalGuess: (funcId: string) => void;
  onToggleEliminate: (funcId: string) => void;
  isGuessingActive: boolean;
  eliminatedFunctions: string[];
  opponentSecretFunction: string | null;
}

export function FunctionGrid({
  gamePhase,
  player,
  secretFunctionId,
  isGuessingActive,
  eliminatedFunctions,
  opponentSecretFunction,
  onSelectSecretFunction,
  onMakeFinalGuess,
  onToggleEliminate,
}: FunctionGridProps) {


  const gridMode: GridMode = (() => {
    if (gamePhase === 'GAME_OVER') {
      return 'GAME_OVER';
    }
    if (gamePhase === 'SELECTING_FUNCTIONS') {
      return 'SELECTING';
    }
    if (((gamePhase === 'P1_QUESTION' && player.role === 'player1') ||
      (gamePhase === 'P2_QUESTION' && player.role === 'player2')) && isGuessingActive) {
      return 'GUESSING';
    }
    if ((gamePhase === 'P1_QUESTION' && player.role === 'player1') ||
      (gamePhase === 'P2_QUESTION' && player.role === 'player2')) {
      return 'ELIMINATING';
    }
    if ((gamePhase === 'P1_QUESTION' && player.role === 'player2') ||
      (gamePhase === 'P2_QUESTION' && player.role === 'player1')) {
      return 'ANSWERING';
    }
    return 'SELECTING'; // Default for initial state/waiting
  })();


  // --- Functions to control button visibility and card highlighting ---

  const showSelectButtonForCard = (func: RationalFunction): boolean => {
    return gridMode === 'SELECTING';
  };

  const showEliminateButtonForCard = (func: RationalFunctionWithDisplayState): boolean => {
    // Only show eliminate if in 'eliminating' mode AND the card is not already eliminated
    // Also, if it's currently selected as the secret, you shouldn't be able to eliminate it.
    return gridMode === 'ELIMINATING'
  };

  const showMakeGuessButtonForCard = (func: RationalFunctionWithDisplayState): boolean => {
    // Only show make guess if in 'guessing' mode AND the card is not already eliminated
    return gridMode === 'GUESSING' && !func.isEliminated;
  };

  const isCardSelectedAsSecretForUI = (funcId: string): boolean => {
    // Only highlight my secret when in selection phase or when showing overall game state (not eliminating/guessing other cards)
    // Avoid highlighting during question phases where the focus is on the opponent's grid.
    return (gridMode === 'SELECTING' && secretFunctionId === funcId) ||
      (gridMode === 'GAME_OVER' && secretFunctionId === funcId && opponentSecretFunction !== funcId); // My secret if I didn't win
  };

  const isCardActuallySecretForUI = (funcId: string): boolean => {
    // This is the opponent's secret, revealed at game over or when answering a question
    return (gridMode === 'GAME_OVER' || gridMode === 'ANSWERING') && opponentSecretFunction === funcId;
  };


  // --- Dynamic CSS class for grid layout ---
  // Always show all functions, so a consistent grid layout is generally best.
  // The centering for single card was for the old filtering logic.
  const gridLayoutClass = gridMode === 'ANSWERING' ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4';


  return (
    <div className={`grid gap-4 p-4 bg-secondary/30 rounded-lg shadow-inner ${gridLayoutClass}`}>
      {INITIAL_FUNCTIONS.filter((a => {
        if (gridMode === 'ANSWERING') {
          return a.id == secretFunctionId
        } else return true
      })).map((func) => { // ALWAYS map over all initial functions
        const funcWithDisplayState: RationalFunctionWithDisplayState = {
          ...func,
          // A function is visually eliminated if it's in the eliminatedFunctions array
          // AND the current mode is one where eliminations should be visible (eliminating, guessing)
          // AND it's not the actual secret function being revealed.
          isEliminated: eliminatedFunctions.includes(func.id) &&
            !isCardActuallySecretForUI(func.id) && // Don't show secret as eliminated
            !isCardSelectedAsSecretForUI(func.id) && // Don't show my secret as eliminated
            (gridMode === 'ELIMINATING' || gridMode === 'GUESSING'), // Only in these modes
        };

        return (
          <RationalFunctionCard
            key={func.id}
            func={funcWithDisplayState}
            showSelectButton={showSelectButtonForCard(func)}
            onSelectSecretFunction={() => onSelectSecretFunction(func.id)}

            showEliminateButton={showEliminateButtonForCard(funcWithDisplayState)}
            onToggleEliminate={() => onToggleEliminate(func.id)}

            showMakeGuessButton={showMakeGuessButtonForCard(funcWithDisplayState)}
            onMakeFinalGuess={() => onMakeFinalGuess(func.id)}
            isSecret={func.id === secretFunctionId}
            isSelectedAsSecret={isCardSelectedAsSecretForUI(func.id)}
            isOpponentSecret={isCardActuallySecretForUI(func.id)}
            // Pass the derived isEliminated directly from funcWithDisplayState
            isEliminatedOverride={funcWithDisplayState.isEliminated}
          />
        );
      })}
    </div>);

}
