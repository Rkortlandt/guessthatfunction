'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { FunctionGrid } from '@/components/game/FunctionGrid';
import { GameControls } from '@/components/game/GameControls';
import { Button } from '@/components/ui/button';
import { RotateCcw, Users, Loader2, OctagonAlert, Gamepad2, Swords, StopCircle, LogOut, FireExtinguisher } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { INITIAL_FUNCTIONS } from '@/lib/game-data';

import { io, Socket } from 'socket.io-client'; // Import Socket.IO client
import { BouncingVideoPlayer } from '@/components/game/BouncingVideoPlayer';
import { Warning } from 'postcss';

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

const YOUTUBE_VIDEO_URLS = [
  "https://www.youtube.com/watch?v=Eo9GZ93sbkg",
  "https://www.youtube.com/watch?v=JDQr1vICu54",
  "https://www.youtube.com/watch?v=0c4KWfPhgWA",
  "https://www.youtube.com/watch?v=ChBg4aowzX8",
  "https://www.youtube.com/watch?v=6JFdWzw6R90",
  "https://www.youtube.com/watch?v=_iKaWU2fz28",
  "https://www.youtube.com/watch?v=huZUnRSmNSE",
  "https://www.youtube.com/watch?app=desktop&v=rLHEedCjiOU"
];

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
  const [isConnecting, setIsConnecting] = useState<boolean>(true);
  const [gamePhase, setGamePhase] = useState<GamePhase>('SELECTING_FUNCTIONS');
  const [secretFunctionId, setSecretFunctionId] = useState<string | null>(null);
  const [opponentSecretFunctionId, setOpponentSecretFunctionId] = useState<string | null>(null);
  const [eliminatedFunctions, setEliminatedFunctions] = useState<string[]>([]);
  const [gameWinner, setGameWinner] = useState<GameWinner>(undefined);
  const [player1GuessesRemaining, setPlayer1GuessesRemaining] = useState<number>(5);
  const [player2GuessesRemaining, setPlayer2GuessesRemaining] = useState<number>(5);
  const [isGuessingActive, setIsGuessingActive] = useState<boolean>(false);

  // --- UI State ---
  const [showGameOverDialog, setShowGameOverDialog] = useState<boolean>(false);
  const [showFailedGuessDialog, setShowFailedGuessDialog] = useState<boolean>(false);
  const [bouncingVideos, setBouncingVideos] = useState<string[]>([]);

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
      setGamePhase('SELECTING_FUNCTIONS');
      setSecretFunctionId(null);
      setOpponentSecretFunctionId(null);
      setEliminatedFunctions([]);
      setGameWinner(undefined);
      setPlayer1GuessesRemaining(5);
      setPlayer2GuessesRemaining(5);
      setShowGameOverDialog(false);
      setShowFailedGuessDialog(false);
      setIsConnecting(true); // Go back to connecting state
      toast({
        title: "Disconnected",
        description: "Lost connection to the server.",
        variant: "destructive"
      });
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

    socketInstance.on('guess-result', (data: { success: boolean; correct?: boolean; message?: string; winnerId?: string }) => {
      console.log("[Client] Guess Result Received:", data);
      setIsGuessingActive(false); // Always exit guessing mode after a guess attempt

      if (!data.success) {
        // Handle server-side errors or invalid states (e.g., "not your turn", "no guesses left")

      } else if (data.correct) {

        // The game-winner and game-phase-update events will follow this from the server
      } else {
        // Incorrect guess
        setShowFailedGuessDialog(true);
        // The server will also send 'guesses-remaining-update' and 'game-phase-update'
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
        setPlayer1GuessesRemaining(5);
        setPlayer2GuessesRemaining(5);
        setShowGameOverDialog(false); // Close the game over dialog
      }


      setGamePhase(phase); // Always update the current game phase

      if (Math.random() < 0.1) { // 10% chance
        console.log('Adding a vid')
        const randomVideoIndex = Math.floor(Math.random() * YOUTUBE_VIDEO_URLS.length);
        const selectedVideoSrc = YOUTUBE_VIDEO_URLS[randomVideoIndex];

        setBouncingVideos(prevVideos => [...prevVideos, selectedVideoSrc]);
      };
    });


    socketInstance.on('guesses-remaining-update', (guessesRemaining: { player1: number, player2: number }) => {
      console.log(`Updateing guesses, P1: ${guessesRemaining.player1}, P2: ${guessesRemaining.player2}`);
      setPlayer1GuessesRemaining(guessesRemaining.player1);
      setPlayer2GuessesRemaining(guessesRemaining.player2);
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
    socketInstance.on('game-end-details', (data: {
      winnerId: string | null;
      player1Secret: string | null;
      player2Secret: string | null
    }) => {
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
      socketInstance.off('guesses-remaining-update');
      socketInstance.off('room-join-status');
      socketInstance.off('game-phase-update');
      socketInstance.off('game-winner');
      socketInstance.off('game-end-details'); // Clean up
      socketInstance.disconnect();
    };
  }, []);

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
      setPlayer1GuessesRemaining(5);
      setPlayer2GuessesRemaining(5);
      setBouncingVideos([]);
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
    if (socketRef.current && joinedRoomCode && myRole && ['player1', 'player2'].includes(myRole)) {
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
    // You would likely emit a socket event here to sync elimination:
    // socketRef.current?.emit('toggle-elimination', { roomCode: joinedRoomCode, functionId: id });
  }, [eliminatedFunctions]);

  const handleMakeFinalGuess = useCallback((guessedId: string) => {
    // Crucial: Only emit the guess to the server. The server will validate.
    if (socketRef.current && joinedRoomCode && myRole && ['player1', 'player2'].includes(myRole)) {
      // We no longer check guessesRemaining or opponentSecretFunctionId here directly for game logic.
      // The server is authoritative for these.

      console.log(`[Client] Emitting 'make-guess' for function ID: ${guessedId} in room: ${joinedRoomCode}`);
      socketRef.current.emit('make-guess', { roomCode: joinedRoomCode, guessedFunctionId: guessedId });

      toast({
        title: "Guess Sent!",
        description: `You guessed: ${INITIAL_FUNCTIONS.find((f) => f.id === guessedId)?.sillyName || guessedId}. Waiting for server validation...`,
        variant: "default" // Changed to info, as outcome is not yet known
      });


    } else {
      toast({
        title: "Cannot Make Guess",
        description: "You are not a player or not in a game.",
        variant: "destructive"
      });
    }
  }, [
    socketRef,
    joinedRoomCode,
    myRole,
    toast // Ensure toast is in dependencies
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
  console.log(myPlayer, player1GuessesRemaining, player2GuessesRemaining);
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground p-2 md:p-4">
      {bouncingVideos.map((vid, index) => <BouncingVideoPlayer key={index} videoUrl={vid} />)}
      <header className="mb-4">
        <div className="container mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex w-full align-middle justify-between md:justify-start">
            <h1 className="md:text-2xl text-lg font-bold text-primary flex items-center">
              <Users className="w-10 h-10 mr-2" />
              Rational Guesser - Room: {joinedRoomCode}
            </h1>
            <p className="text-lg font-bold sm:pl-10 text-primary flex items-center">
              {myRole?.toUpperCase()}
            </p>
          </div>
          <div className="flex justify-start sm:justify-end w-full sm:w-auto items-center gap-4">

            <Button onClick={handleLeaveRoom} variant="outline" size="lg">
              <LogOut className="mr-2 h-5 w-5" />
              Leave Room
            </Button>
            <Button onClick={handleLeaveRoom} variant="default" size="lg">
              <FireExtinguisher className="mr-2 h-5 w-5" />
              Rage Quit
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto flex-grow flex flex-col lg:flex-row gap-8">
        <aside className="lg:w-1/3 xl:w-1/4 space-y-6">
          <GameControls
            gamePhase={gamePhase}
            guessesRemainingCount={(myPlayer.role === "player1") ? player1GuessesRemaining : player2GuessesRemaining}
            setIsGuessingActive={(value) => setIsGuessingActive(value)}
            isGuessingActive={isGuessingActive}
            player={myPlayer}
            secretFunctionId={secretFunctionId}
            onTurnFinished={handleTurnFinished}
          />

          {/* Connected Users List */}

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
            </Alert>
          )}
          {gamePhase === 'GAME_OVER' && !gameWinner && (
            <Alert variant="destructive">
              <OctagonAlert className="h-4 w-4" />
              <AlertTitle>Game Over!</AlertTitle>
              <AlertDescription>
                The game ended without a winner being declared.
              </AlertDescription>
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
            opponentSecretFunction={opponentSecretFunctionId}
            eliminatedFunctions={eliminatedFunctions}
          />
        </section>
      </main>
      <footer>
        <div className="bg-card p-6 rounded-lg shadow-sm">
          <h2 className="text-2xl font-semibold mb-4 flex items-center 
            gap-2">
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

      </footer>

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
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={showFailedGuessDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Incorrect Guess</DialogTitle>
            <StopCircle color='red' />
            <p>You have {(myPlayer.role === 'player1') ? player1GuessesRemaining : player2GuessesRemaining} guesses left</p>
          </DialogHeader>
          <DialogFooter>
            <DialogClose onClick={() => setShowFailedGuessDialog(false)}>
              Close
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div >
  );
}
