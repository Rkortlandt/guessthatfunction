'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { FunctionGrid } from '@/components/game/FunctionGrid';
import { GameControls } from '@/components/game/GameControls';
import { Button } from '@/components/ui/button';
import { RotateCcw, Users, Loader2, OctagonAlert, Gamepad2, Swords } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { INITIAL_FUNCTIONS } from '@/lib/game-data';

import { io, Socket } from 'socket.io-client'; // Import Socket.IO client

// --- Type Definitions (Ensure these match your backend and FunctionGrid) ---
// These types should ideally be in a shared `types.ts` file
export interface User {
  id: string;
  role: 'player1' | 'player2' | 'spectator' | null;
}

// *** MODIFIED: New GamePhase type for simultaneous selection ***
export type GamePhase =
  | 'SELECTING_FUNCTIONS' // Single phase for both players to pick
  | 'P1_QUESTION'
  | 'P2_QUESTION'
  | 'GAME_OVER';

type PlayerRole = 'player1' | 'player2' | 'spectator' | null;
type GameWinner = string | undefined; // Winner is socket.id

interface RationalFunction { // Assuming this structure from game-data.ts
  id: string;
  name: string;
  sillyName: string; // Assuming 'sillyName' exists for display purposes
  // Add other properties of RationalFunction if they exist (e.g., equation, graphData)
}

export default function RationalGuesserPage() {
  // --- Socket.IO & Room State ---
  const socketRef = useRef<Socket | null>(null);
  const [currentRoomCode, setCurrentRoomCode] = useState<string>('');
  const [joinedRoomCode, setJoinedRoomCode] = useState<string | null>(null);
  const [mySocketId, setMySocketId] = useState<string | undefined>(undefined);
  const [myRole, setMyRole] = useState<PlayerRole>(null);
  const [connectedUsers, setConnectedUsers] = useState<User[]>([]);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState<boolean>(true); // For initial socket connection

  // --- Game State ---
  // *** MODIFIED: Initial game phase is now SELECTING_FUNCTIONS ***
  const [gamePhase, setGamePhase] = useState<GamePhase>('SELECTING_FUNCTIONS');
  const [secretFunctionId, setSecretFunctionId] = useState<string | null>(null); // My chosen secret
  const [opponentSecretFunctionId, setOpponentSecretFunctionId] = useState<string | null>(null); // Opponent's secret (revealed at end)
  const [eliminatedFunctions, setEliminatedFunctions] = useState<string[]>([]); // My eliminations on opponent's grid
  const [gameWinner, setGameWinner] = useState<GameWinner>(undefined);
  const [guessesRemaining, setGuessesRemaining] = useState<number>(5); // Example: Number of guesses left
  const [isGuessingActive, setIsGuessingActive] = useState<boolean>(false);

  // --- UI State ---
  const [currentQuestion, setCurrentQuestion] = useState(''); // What I'm asking or opponent is asking
  const [currentAnswer, setCurrentAnswer] = useState<boolean | null>(null); // Opponent's answer to my question
  const [showGameOverDialog, setShowGameOverDialog] = useState<boolean>(false);

  const { toast } = useToast();

  // --- Socket.IO Initialization and Event Listeners ---
  useEffect(() => {
    const socketInstance = io('http://localhost:3001');
    socketRef.current = socketInstance;

    socketInstance.on('connect', () => {
      console.log(`[Client] Socket connected: ${socketInstance.id}`);
      setMySocketId(socketInstance.id);
      setIsConnecting(false);
      setJoinError(null);
      toast({
        title: "Connected!",
        description: `Your ID: ${socketInstance.id}`,
      });
    });

    socketInstance.on('disconnect', () => {
      console.log(`[Client] Socket disconnected`);
      setMySocketId(undefined);
      setJoinedRoomCode(null);
      setMyRole(null);
      setConnectedUsers([]);
      // *** MODIFIED: Reset phase to SELECTING_FUNCTIONS on disconnect ***
      setGamePhase('SELECTING_FUNCTIONS');
      setSecretFunctionId(null);
      setOpponentSecretFunctionId(null);
      setEliminatedFunctions([]);
      setGameWinner(undefined);
      setGuessesRemaining(5);
      setIsConnecting(true); // Go back to connecting state
      toast({
        title: "Disconnected",
        description: "Lost connection to the server.",
        variant: "destructive"
      });
      setShowGameOverDialog(false);
    });

    socketInstance.on('assign-role', (role: PlayerRole) => {
      setMyRole(role);
      toast({
        title: "Role Assigned!",
        description: `You are ${role?.toUpperCase()}`,
      });
    });

    socketInstance.on('current-users', (users: User[]) => {
      setConnectedUsers(users.filter(user => user.id !== socketInstance.id));
    });

    socketInstance.on('user-connected', (user: User) => {
      setConnectedUsers(prev => [...prev, user]);
      toast({
        title: "User Joined!",
        description: `${user.id} (${user.role?.toUpperCase()}) joined the room.`,
      });
    });

    socketInstance.on('user-disconnected', (user: User) => {
      setConnectedUsers(prev => prev.filter(u => u.id !== user.id));
      toast({
        title: "User Left!",
        description: `${user.id} (${user.role?.toUpperCase()}) left the room.`,
      });
    });

    socketInstance.on('room-join-status', (status: { success: boolean; message?: string; roomCode?: string }) => {
      if (status.success) {
        setJoinedRoomCode(status.roomCode || null);
        setJoinError(null);
        toast({
          title: "Room Joined!",
          description: `You are now in room ${status.roomCode}.`,
        });
      } else {
        setJoinError(status.message || 'Failed to join room.');
        toast({
          title: "Join Failed",
          description: status.message || 'Could not join the room.',
          variant: "destructive"
        });
      }
    });

    socketInstance.on('game-phase-update', (phase: GamePhase) => {
      console.log("[Client] Game Phase Update:", phase);

      // If transitioning from GAME_OVER to SELECTING_FUNCTIONS (new game start)
      if (gamePhase === 'GAME_OVER' && phase === 'SELECTING_FUNCTIONS') {
        console.log("[Client] Resetting game state for a new round.");
        setGameWinner(undefined);
        setSecretFunctionId(null); // Clear my secret for new selection
        setOpponentSecretFunctionId(null);
        setEliminatedFunctions([]);
        setGuessesRemaining(5);
        setShowGameOverDialog(false); // Close the game over dialog
      }
      // If just moving between active game phases (e.g., SELECTING to QUESTION),
      // we do NOT clear secretFunctionId, eliminations, etc.

      setGamePhase(phase); // Always update the current game phase

      toast({
        title: "Phase Changed",
        description: `New phase: ${phase.replace(/_/g, ' ')}`,
      });
    });

    socketInstance.on('game-winner', (winnerId: string | undefined) => {
      setGameWinner(winnerId);
      if (winnerId) {
        toast({
          title: "Game Over!",
          description: winnerId === mySocketId ? "You won!" : `${winnerId} won!`,
          variant: winnerId === mySocketId ? "default" : "destructive",
        });
        setShowGameOverDialog(true);
      }
    });

    // Listen for game end details (reveals opponent's secret)
    socketInstance.on('game-end-details', (data: { winnerId: string | null; player1Secret: string | null; player2Secret: string | null }) => {
      if (data.player1Secret && data.player2Secret) {
        const myRoleString = myRole; // Capture current myRole value
        const opponentSecretId = myRoleString === 'player1' ? data.player2Secret : data.player1Secret;
        setOpponentSecretFunctionId(opponentSecretId || null);
      } else {
        setOpponentSecretFunctionId(null); // Clear if no secrets provided (e.g. game reset)
      }
    });

    // --- Cleanup on unmount ---
    return () => {
      console.log("[Client] Disconnecting socket on unmount.");
      socketInstance.off('connect');
      socketInstance.off('disconnect');
      socketInstance.off('assign-role');
      socketInstance.off('current-users');
      socketInstance.off('user-connected');
      socketInstance.off('user-disconnected');
      socketInstance.off('room-join-status');
      socketInstance.off('game-phase-update');
      socketInstance.off('game-winner');
      socketInstance.off('game-end-details'); // Clean up
      socketInstance.disconnect();
    };
  }, []); // Added dependencies to useEffect

  // --- Room Management Handlers ---
  const handleRoomCodeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 5);
    setCurrentRoomCode(value);
    setJoinError(null);
  }, []);

  const handleJoinRoom = useCallback(() => {
    if (currentRoomCode.length === 5 && socketRef.current && socketRef.current.connected) {
      console.log(`[Client] Emitting 'join-room' event for room: ${currentRoomCode}`);
      socketRef.current.emit('join-room', currentRoomCode);
    } else if (!socketRef.current?.connected) {
      setJoinError('Not connected to server. Please wait...');
    } else {
      setJoinError('Please enter a 5-digit room code.');
    }
  }, [currentRoomCode]);

  const handleLeaveRoom = useCallback(() => {
    if (socketRef.current && joinedRoomCode) {
      console.log(`[Client] Emitting 'leave-room' event for room: ${joinedRoomCode}`);
      socketRef.current.emit('leave-room', joinedRoomCode);
      // Reset local state immediately for a smooth UI transition
      setJoinedRoomCode(null);
      setMyRole(null);
      setConnectedUsers([]);
      // *** MODIFIED: Reset phase to SELECTING_FUNCTIONS on leave ***
      setGamePhase('SELECTING_FUNCTIONS');
      setSecretFunctionId(null);
      setOpponentSecretFunctionId(null);
      setEliminatedFunctions([]);
      setGameWinner(undefined);
      setGuessesRemaining(5);
      setCurrentRoomCode(''); // Clear input
      toast({
        title: "Left Room",
        description: `You have left room ${joinedRoomCode}.`,
      });
      setShowGameOverDialog(false);
    }
  }, [joinedRoomCode, toast]);


  // --- Game Logic Handlers (Called by FunctionGrid / GameControls) ---

  // My Player 1/2 Role (for passing to sub-components)
  const myPlayerRole = myRole === 'player1' ? 'P1' : myRole === 'player2' ? 'P2' : null;
  const myPlayer: User = { id: mySocketId || 'unknown', role: myRole };

  // When I select my secret function (during SELECTING_FUNCTIONS phase)
  const handleSelectSecretFunction = useCallback((id: string) => {
    // Only allow selection if in the 'SELECTING_FUNCTIONS' phase and not already selected
    if (socketRef.current && joinedRoomCode && myRole && ['player1', 'player2'].includes(myRole) &&
      gamePhase === 'SELECTING_FUNCTIONS' && secretFunctionId === null) {
      setSecretFunctionId(id); // Set my local secret
      console.log(`[Client] Emitting 'set-secret-function' for ID: ${id}`);
      socketRef.current.emit('set-secret-function', { roomCode: joinedRoomCode, secretFunctionId: id });
      toast({
        title: "Secret Selected!",
        description: `You chose ${id} as your secret. Waiting for opponent...`,
      });
    } else if (secretFunctionId !== null) {
      toast({
        title: "Already Selected",
        description: "You have already chosen your secret function.",
        variant: "default"
      });
    } else {
      toast({
        title: "Cannot Select Secret",
        description: "Not the correct phase, or not a player in the game.",
        variant: "destructive"
      });
    }
  }, [socketRef, joinedRoomCode, myRole, gamePhase, secretFunctionId, toast]);


  // When I eliminate a function on the opponent's grid (during my QUESTION phase)
  const handleToggleEliminate = useCallback((id: string) => {
    // This action should also be synced with the server if eliminations are shared
    // For simplicity here, it's a local state change. In a real game,
    // you'd emit 'toggle-elimination' and server would broadcast.
    setEliminatedFunctions(prev => {
      if (prev.includes(id)) {
        return prev.filter(fId => fId !== id);
      } else {
        return [...prev, id];
      }
    });
    toast({
      title: "Function Eliminated",
      description: `${id} is now ${eliminatedFunctions.includes(id) ? 'active' : 'eliminated'}.`,
    });
    // You would likely emit a socket event here to sync elimination:
    // socketRef.current?.emit('toggle-elimination', { roomCode: joinedRoomCode, functionId: id });
  }, [eliminatedFunctions, toast]);

  // When I make a final guess (during my QUESTION phase, after entering guessing mode)
  // ... (inside RationalGuesserPage component)

  const handleMakeFinalGuess = useCallback((guessedId: string) => {
    // Assuming 'opponentSecretFunctionId' is available and accurate on the client for this client-side validation approach
    // In a real game, this value would still ideally come from the server for integrity.
    if (myRole && ['player1', 'player2'].includes(myRole) && joinedRoomCode) { // Add joinedRoomCode check
      if (guessesRemaining <= 0) {
        toast({
          title: "No Guesses Left!",
          description: "You've run out of guesses.",
          variant: "destructive"
        });
        // You might still want to signal the server about game state,
        // e.g., to declare opponent winner or simply end the game.
        // socketRef.current?.emit('request-game-phase-change', { roomCode: joinedRoomCode, newPhase: 'GAME_OVER' });
        return;
      }

      if (!opponentSecretFunctionId) {
        toast({
          title: "Error",
          description: "Opponent's secret not set yet. Cannot guess.",
          variant: "destructive"
        });
        return;
      }

      const isCorrectGuess = guessedId === opponentSecretFunctionId;

      if (isCorrectGuess) {
        toast({
          title: "Correct Guess!",
          description: "You guessed correctly!",
          variant: "default"
        });
        setGameWinner(mySocketId); // Declare self as winner
        setGamePhase('GAME_OVER'); // Move to game over phase
        setShowGameOverDialog(true);
        // Optionally, still tell the server about the win to sync state for spectators/opponent
        socketRef.current?.emit('declare-winner', { roomCode: joinedRoomCode, winnerId: mySocketId });
      } else {
        toast({
          title: "Incorrect Guess",
          description: "That was not the secret function. You lose a guess.",
          variant: "destructive"
        });
        setGuessesRemaining(prev => prev - 1); // Decrement guesses

        // If no guesses left after an incorrect one
        if (guessesRemaining - 1 <= 0) { // Check the new remaining count
          toast({
            title: "No Guesses Left!",
            description: "You ran out of guesses. Opponent wins.",
            variant: "destructive"
          });
          const opponentUser = connectedUsers.find(u => u.role !== myRole && (u.role === 'player1' || u.role === 'player2'));
          if (opponentUser) {
            setGameWinner(opponentUser.id); // Declare opponent as winner
            // You might need to make opponent's secret visible here if not already
          } else {
            setGameWinner(undefined); // No opponent found
          }
          setGamePhase('GAME_OVER');
          setShowGameOverDialog(true);
          // Inform server that game is over (and who won if applicable)
          socketRef.current?.emit('declare-winner', { roomCode: joinedRoomCode, winnerId: opponentUser?.id || null });
        }
      }
    }
  }, [
    myRole,
    joinedRoomCode,
    opponentSecretFunctionId,
    mySocketId,
    toast,
    setGameWinner,
    setGamePhase,
    setShowGameOverDialog,
    setGuessesRemaining,
    guessesRemaining, // Ensure this is in deps if you use it directly
    connectedUsers,
    socketRef // Add socketRef to deps if it's used inside
  ]);

  // ... (rest of your component) 

  const handleTurnFinished = useCallback(() => {
    if (socketRef.current && joinedRoomCode && myRole && ['player1', 'player2'].includes(myRole)) {
      // Logic to advance turn based on current phase and player role
      let nextPhase: GamePhase | null = null;
      if (myRole === 'player1' && gamePhase === 'P1_QUESTION') {
        nextPhase = 'P2_QUESTION';
      } else if (myRole === 'player2' && gamePhase === 'P2_QUESTION') {
        nextPhase = 'P1_QUESTION';
      }

      if (nextPhase) {
        socketRef.current.emit('request-game-phase-change', { roomCode: joinedRoomCode, newPhase: nextPhase });
      } else {
        toast({
          title: "Game Flow Error",
          description: "Cannot advance turn from current phase.",
          variant: "destructive"
        });
      }
    }
  }, [socketRef, joinedRoomCode, myRole, gamePhase, toast]);

  const handleStartNewGame = useCallback(() => {
    if (socketRef.current && joinedRoomCode && myRole && ['player1', 'player2'].includes(myRole) && gamePhase === 'GAME_OVER') {
      // *** MODIFIED: Requesting new game should go back to SELECTING_FUNCTIONS ***
      socketRef.current.emit('request-game-phase-change', { roomCode: joinedRoomCode, newPhase: 'SELECTING_FUNCTIONS' });
      setShowGameOverDialog(false); // Close dialog
    } else {
      toast({
        title: "Cannot Start New Game",
        description: "Game not over or not a player.",
        variant: "destructive"
      });
    }
  }, [socketRef, joinedRoomCode, myRole, gamePhase, toast]);


  // Determine if game is playable (at least two players)
  // This logic might need refinement depending on exactly when you consider the game "playable"
  const isGamePlayable = connectedUsers.length >= 1 && myRole !== 'spectator' && myRole !== null;
  const canStartNewGame = gamePhase === 'GAME_OVER' && myRole !== 'spectator';


  // --- Render Logic ---
  if (!joinedRoomCode) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-4">
        <div className="w-full max-w-md p-8 space-y-6 bg-card rounded-lg shadow-xl">
          <h1 className="text-3xl font-bold text-center text-primary flex items-center justify-center gap-2">
            <Gamepad2 className="w-8 h-8" /> Rational Guesser
          </h1>
          <p className="text-center text-muted-foreground">Join or create a room to play!</p>

          {isConnecting ? (
            <Alert className="bg-blue-100 border-blue-200">
              <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
              <AlertTitle>Connecting...</AlertTitle>
              <AlertDescription>Establishing connection to the game server.</AlertDescription>
            </Alert>
          ) : (
            <>
              <div className="flex flex-col gap-4">
                <Input
                  type="text"
                  placeholder="Enter 5-digit room code"
                  value={currentRoomCode}
                  onChange={handleRoomCodeChange}
                  maxLength={5}
                  className="text-center text-lg py-6"
                />
                <Button
                  onClick={handleJoinRoom}
                  disabled={currentRoomCode.length !== 5 || !socketRef.current?.connected}
                  className="py-6 text-lg"
                >
                  Join Room
                </Button>
              </div>
              {joinError && (
                <Alert variant="destructive">
                  <OctagonAlert className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{joinError}</AlertDescription>
                </Alert>
              )}
            </>
          )}
          <p className="text-sm text-center text-muted-foreground mt-4">
            Your Socket ID: {mySocketId || 'N/A'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground p-4 md:p-8">
      <header className="mb-8">
        <div className="container mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <h1 className="text-4xl font-headline text-primary flex items-center">
            <Users className="w-10 h-10 mr-2" />
            Rational Guesser - Room: {joinedRoomCode}
          </h1>
          <div className="flex items-center gap-4">
            <p className="text-lg font-medium text-muted-foreground">
              You are: <span className="font-bold text-primary">{myRole?.toUpperCase()}</span>
            </p>
            <Button onClick={handleLeaveRoom} variant="outline" size="lg">
              <RotateCcw className="mr-2 h-5 w-5" />
              Leave Room
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto flex-grow flex flex-col lg:flex-row gap-8">
        <aside className="lg:w-1/3 xl:w-1/4 space-y-6">
          <GameControls
            gamePhase={gamePhase}
            guessesRemainingCount={guessesRemaining}
            setIsGuessingActive={(value) => setIsGuessingActive(value)}
            isGuessingActive={isGuessingActive}
            player={myPlayer}
            secretFunctionId={secretFunctionId}
            onTurnFinished={handleTurnFinished}
          />

          {/* Connected Users List */}
          <div className="bg-card p-6 rounded-lg shadow-sm">
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <Users className="w-6 h-6" /> Players in Room ({connectedUsers.length + 1})
            </h2>
            <ul className="space-y-2">
              <li className="flex items-center justify-between text-lg font-medium">
                <span>Me ({myRole?.toUpperCase()})</span>
                <span className="text-muted-foreground text-sm">{mySocketId}</span>
                <span>{gamePhase.toString()}</span>
              </li>
              {connectedUsers.map(user => (
                <li key={user.id} className="flex items-center justify-between text-lg">
                  <span>{user.id} ({user.role?.toUpperCase()})</span>
                  {/* Additional info like status could go here */}
                </li>
              ))}
            </ul>
          </div>

          {/* Game Over / Winner Display */}
          {gamePhase === 'GAME_OVER' && gameWinner && (
            <Alert className="bg-green-100 border-green-300 text-green-800">
              <Swords className="h-4 w-4" />
              <AlertTitle>Game Over!</AlertTitle>
              <AlertDescription>
                {gameWinner === mySocketId ? "You won the game!" : `Player ${gameWinner} won the game!`}
                {opponentSecretFunctionId && (
                  <p className="mt-2">Opponent's secret was: {INITIAL_FUNCTIONS.find((a) => a.id === opponentSecretFunctionId)?.sillyName}</p>
                )}
              </AlertDescription>
              {canStartNewGame && (
                <Button onClick={handleStartNewGame} className="mt-4 w-full">Start New Game</Button>
              )}
            </Alert>
          )}
          {gamePhase === 'GAME_OVER' && !gameWinner && (
            <Alert variant="destructive">
              <OctagonAlert className="h-4 w-4" />
              <AlertTitle>Game Over!</AlertTitle>
              <AlertDescription>
                The game ended without a winner being declared.
              </AlertDescription>
              {canStartNewGame && (
                <Button onClick={handleStartNewGame} className="mt-4 w-full">Start New Game</Button>
              )}
            </Alert>
          )}
        </aside>

        <section className="lg:w-2/3 xl:w-3/4">
          <FunctionGrid
            gamePhase={gamePhase}
            player={myPlayer}
            onSelectSecretFunction={handleSelectSecretFunction}
            onToggleEliminate={handleToggleEliminate}
            onMakeFinalGuess={handleMakeFinalGuess}
            isGuessingActive={isGuessingActive}
            secretFunctionId={secretFunctionId}
            actualSecretFunction={opponentSecretFunctionId}
            eliminatedFunctions={eliminatedFunctions}
          />
        </section>
      </main>

      {/* Game Over Dialog */}
      <Dialog open={showGameOverDialog} onOpenChange={setShowGameOverDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{gameWinner === mySocketId ? "Congratulations!" : "Game Over!"}</DialogTitle>
            {gameWinner === mySocketId ? "You successfully guessed the opponent's function!" : `Player ${gameWinner} has won this round!`}
            {opponentSecretFunctionId && (
              <div className="mt-2">Opponent's secret was: {INITIAL_FUNCTIONS.find((a) => a.id === opponentSecretFunctionId)?.sillyName}</div>
            )}
            <div className="mt-4">Would you like to play another round?</div>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={handleLeaveRoom}>Leave Room</Button>
            {canStartNewGame && (
              <Button onClick={handleStartNewGame}>Start New Game</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
