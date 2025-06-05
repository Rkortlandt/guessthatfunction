const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: ["http://localhost:9002", "http://localhost:3000", "http://frontend:9002"], // Ensure this matches your client's origin
        methods: ["GET", "POST"]
    }
});

// Server-side state to manage all rooms
// Structure:
// {
//     'ROOM_CODE': {
//         player1Id: string | null,
//         player2Id: string | null,
//         usersInRoom: Map<string, { id: string, role: string }>,
//         currentGamePhase: string,
//         winnerId: string | null,
//         player1SecretFunctionId: string | null,
//         player2SecretFunctionId: string | null,
//         player1GuessesRemaining: number | undefined, // Added
//         player2GuessesRemaining: number | undefined  // Added
//     },
//     ...
// }
const allRoomsState = {};

// Helper to define the starting number of guesses
const STARTING_GUESSES = 5; // 🎯 Define how many guesses players start with

// Helper to remove a socket from its current room's state
function removeSocketFromRoomState(socketId, roomCode) {
    if (!roomCode || !allRoomsState[roomCode]) {
        return;
    }

    const currentRoom = allRoomsState[roomCode];
    const userData = currentRoom.usersInRoom.get(socketId);

    if (userData) {
        currentRoom.usersInRoom.delete(socketId);
        console.log(`[Server] Socket ${socketId} removed from room state ${roomCode}`);

        if (currentRoom.player1Id === socketId) {
            currentRoom.player1Id = null;
            currentRoom.player1SecretFunctionId = null;
            currentRoom.player1GuessesRemaining = undefined; // Clear guesses if player leaves
            console.log(`[Server] Player1 slot, secret, and guesses freed in room ${roomCode}`);
        } else if (currentRoom.player2Id === socketId) {
            currentRoom.player2Id = null;
            currentRoom.player2SecretFunctionId = null;
            currentRoom.player2GuessesRemaining = undefined; // Clear guesses if player leaves
            console.log(`[Server] Player2 slot, secret, and guesses freed in room ${roomCode}`);
        }

        if (currentRoom.usersInRoom.size > 0) {
            io.to(roomCode).emit('user-disconnected', userData);
            // If a player leaves mid-game, and guesses were initialized, update remaining clients
            if (userData.role === 'player1' || userData.role === 'player2') {
                io.to(roomCode).emit('guesses-remaining-update', {
                    player1: currentRoom.player1GuessesRemaining,
                    player2: currentRoom.player2GuessesRemaining
                });
            }
            console.log(`[Server] Notified others in ${roomCode} about ${socketId} disconnection/leave (Role: ${userData.role})`);
        } else {
            console.log(`[Server] Room ${roomCode} is now empty. Cleaning up room state.`);
            delete allRoomsState[roomCode];
        }
    }
}

io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);
    socket.data.currentRoom = null;

    socket.on('join-room', (roomCode) => {
        if (typeof roomCode !== 'string' || !/^\d{5}$/.test(roomCode)) {
            socket.emit('room-join-status', { success: false, message: 'Invalid room code. Must be 5 digits.' });
            console.warn(`[Server] Invalid room code attempt from ${socket.id}: ${roomCode}`);
            return;
        }

        if (socket.data.currentRoom && socket.data.currentRoom !== roomCode) {
            console.log(`[Server] ${socket.id} leaving old room ${socket.data.currentRoom} to join ${roomCode}`);
            socket.leave(socket.data.currentRoom);
            removeSocketFromRoomState(socket.id, socket.data.currentRoom);
        }

        socket.join(roomCode);
        socket.data.currentRoom = roomCode;
        console.log(`[Server] Socket ${socket.id} joined room: ${roomCode}`);

        if (!allRoomsState[roomCode]) {
            allRoomsState[roomCode] = {
                player1Id: null,
                player2Id: null,
                usersInRoom: new Map(),
                currentGamePhase: 'SELECTING_FUNCTIONS',
                winnerId: null,
                player1SecretFunctionId: null,
                player2SecretFunctionId: null,
                player1GuessesRemaining: undefined, // Initialize guess counts
                player2GuessesRemaining: undefined  // Initialize guess counts
            };
            console.log(`[Server] Created new room state for ${roomCode}, initial phase: ${allRoomsState[roomCode].currentGamePhase}`);
        }

        const currentRoom = allRoomsState[roomCode];
        let assignedRole = null;

        if (!currentRoom.player1Id) {
            currentRoom.player1Id = socket.id;
            assignedRole = 'player1';
        } else if (!currentRoom.player2Id) {
            currentRoom.player2Id = socket.id;
            assignedRole = 'player2';
        } else {
            assignedRole = 'spectator';
        }

        const userData = { id: socket.id, role: assignedRole };
        currentRoom.usersInRoom.set(socket.id, userData);

        socket.emit('room-join-status', { success: true, roomCode: roomCode });
        socket.emit('assign-role', assignedRole);
        console.log(`[Server] ${socket.id} assigned role: ${assignedRole} in room ${roomCode}`);

        const allUsersInCurrentRoom = Array.from(currentRoom.usersInRoom.values());
        socket.emit('current-users', allUsersInCurrentRoom);
        console.log(`[Server] Sent current-users to ${socket.id} in room ${roomCode}:`, allUsersInCurrentRoom.map(u => u.id));

        socket.to(roomCode).emit('user-connected', userData);
        console.log(`[Server] Notified others in ${roomCode} about new user: ${socket.id} (Role: ${assignedRole})`);

        socket.emit('game-phase-update', currentRoom.currentGamePhase);
        console.log(`[Server] Sent current phase ${currentRoom.currentGamePhase} to new user ${socket.id} in room ${roomCode}`);

        // If guesses have already been initialized (e.g., joining mid-game after secrets are set), send them
        if (typeof currentRoom.player1GuessesRemaining === 'number' && typeof currentRoom.player2GuessesRemaining === 'number') {
            socket.emit('guesses-remaining-update', {
                player1: currentRoom.player1GuessesRemaining,
                player2: currentRoom.player2GuessesRemaining
            });
        }

        if (currentRoom.winnerId) {
            socket.emit('game-winner', currentRoom.winnerId);
            console.log(`[Server] Sent existing winner ${currentRoom.winnerId} to new user ${socket.id} in room ${roomCode}`);
        }

        if (currentRoom.currentGamePhase === 'GAME_OVER' && currentRoom.player1SecretFunctionId && currentRoom.player2SecretFunctionId) {
            socket.emit('game-end-details', {
                winnerId: currentRoom.winnerId,
                player1Secret: currentRoom.player1SecretFunctionId,
                player2Secret: currentRoom.player2SecretFunctionId
            });
            console.log(`[Server] Sent existing game end details to new user ${socket.id} in room ${roomCode}`);
        }
    });

    socket.on('leave-room', (roomCode) => {
        if (socket.data.currentRoom !== roomCode) {
            console.warn(`[Server] ${socket.id} tried to leave room ${roomCode} but was in ${socket.data.currentRoom}`);
            socket.emit('room-leave-status', { success: false, message: 'You are not in this room.' });
            return;
        }

        socket.leave(roomCode);
        removeSocketFromRoomState(socket.id, roomCode); // This will handle guess updates if a player leaves
        socket.data.currentRoom = null;
        socket.emit('room-leave-status', { success: true });
        console.log(`[Server] Socket ${socket.id} successfully left room ${roomCode}`);
    });

    socket.on('set-secret-function', ({ roomCode, secretFunctionId }) => {
        const currentRoom = allRoomsState[roomCode];
        if (!currentRoom) {
            console.warn(`[Server] Set secret function for non-existent room ${roomCode} by ${socket.id}`);
            return;
        }

        const requestingUser = currentRoom.usersInRoom.get(socket.id);
        if (!requestingUser || !['player1', 'player2'].includes(requestingUser.role)) {
            console.warn(`[Server] Non-player ${socket.id} tried to set secret function in room ${roomCode}`);
            return;
        }

        if (currentRoom.currentGamePhase !== 'SELECTING_FUNCTIONS') {
            console.warn(`[Server] ${socket.id} tried to set secret in wrong phase: ${currentRoom.currentGamePhase}`);
            return;
        }

        if (requestingUser.role === 'player1') {
            if (currentRoom.player1SecretFunctionId) {
                console.warn(`[Server] Player 1 (${socket.id}) tried to re-set secret in ${roomCode}`);
                return;
            }
            currentRoom.player1SecretFunctionId = secretFunctionId;
            console.log(`[Server] Player 1 (${socket.id}) set secret in ${roomCode}: ${secretFunctionId}`);
        } else if (requestingUser.role === 'player2') {
            if (currentRoom.player2SecretFunctionId) {
                console.warn(`[Server] Player 2 (${socket.id}) tried to re-set secret in ${roomCode}`);
                return;
            }
            currentRoom.player2SecretFunctionId = secretFunctionId;
            console.log(`[Server] Player 2 (${socket.id}) set secret in ${roomCode}: ${secretFunctionId}`);
        }

        if (currentRoom.player1SecretFunctionId && currentRoom.player2SecretFunctionId) {
            currentRoom.currentGamePhase = 'P1_QUESTION';
            // ✨ Initialize guesses when both players have set secrets
            currentRoom.player1GuessesRemaining = STARTING_GUESSES;
            currentRoom.player2GuessesRemaining = STARTING_GUESSES;

            io.to(roomCode).emit('game-phase-update', currentRoom.currentGamePhase);
            // 📢 Broadcast initial guess counts
            io.to(roomCode).emit('guesses-remaining-update', {
                player1: currentRoom.player1GuessesRemaining,
                player2: currentRoom.player2GuessesRemaining
            });
            console.log(`[Server] Both players set secrets in ${roomCode}. Advancing phase to: ${currentRoom.currentGamePhase}. Guesses initialized.`);
        }
    });

    socket.on('request-game-phase-change', ({ roomCode, newPhase }) => {
        const currentRoom = allRoomsState[roomCode];
        if (!currentRoom) {
            console.warn(`[Server] Request to change phase for non-existent room ${roomCode} by ${socket.id}`);
            return;
        }

        const requestingUser = currentRoom.usersInRoom.get(socket.id);
        if (!requestingUser || !['player1', 'player2'].includes(requestingUser.role)) {
            console.warn(`[Server] Non-player ${socket.id} tried to change phase in room ${roomCode}`);
            return;
        }

        const validPhases = ['SELECTING_FUNCTIONS', 'P1_QUESTION', 'P2_QUESTION', 'GAME_OVER'];
        if (!validPhases.includes(newPhase)) {
            console.warn(`[Server] Invalid new phase requested: ${newPhase} from ${socket.id}`);
            return;
        }

        console.log(`[Server] ${socket.id} (${requestingUser.role}) requesting phase change in ${roomCode} to: ${newPhase}`);
        const oldPhase = currentRoom.currentGamePhase;
        currentRoom.currentGamePhase = newPhase;
        io.to(roomCode).emit('game-phase-update', newPhase);
        console.log(`[Server] Broadcasted new phase '${newPhase}' to room ${roomCode}`);

        if (newPhase === 'GAME_OVER') {
            // ... (game over logic for emitting game-end-details remains the same)
            io.to(roomCode).emit('game-end-details', {
                winnerId: currentRoom.winnerId,
                player1Secret: currentRoom.player1SecretFunctionId,
                player2Secret: currentRoom.player2SecretFunctionId
            });
            console.log(`[Server] Game over in ${roomCode}. Sending game end details.`);
        } else {
            // Clear winner and secrets if phase changes from GAME_OVER to another (implying a reset)
            if (oldPhase === 'GAME_OVER') {
                currentRoom.winnerId = null;
                currentRoom.player1SecretFunctionId = null;
                currentRoom.player2SecretFunctionId = null;
                io.to(roomCode).emit('game-winner', null);
                io.to(roomCode).emit('game-end-details', { winnerId: null, player1Secret: null, player2Secret: null });
            }

            // Reset guesses to undefined if starting a new game selection phase
            if (newPhase === 'SELECTING_FUNCTIONS') {
                currentRoom.player1GuessesRemaining = undefined;
                currentRoom.player2GuessesRemaining = undefined;
                io.to(roomCode).emit('guesses-remaining-update', { player1: undefined, player2: undefined });
                console.log(`[Server] Game reset to SELECTING_FUNCTIONS in ${roomCode}. Guesses cleared.`);
            }
            // THE PROBLEMATIC BLOCK IS REMOVED FROM HERE
            // No other conditions in this handler should reset guesses to STARTING_GUESSES.
            // That is handled by 'set-secret-function' when gameplay is ready to begin.
        }
    });

    socket.on('make-guess', ({ roomCode, guessedFunctionId }) => {
        console.log("guess " + guessedFunctionId)
        const currentRoom = allRoomsState[roomCode];
        if (!currentRoom) {
            console.warn(`[Server] Guess for non-existent room ${roomCode} by ${socket.id}`);
            socket.emit('guess-result', { success: false, message: 'Room not found.' });
            return;
        }

        const guessingPlayer = currentRoom.usersInRoom.get(socket.id);
        if (!guessingPlayer || !['player1', 'player2'].includes(guessingPlayer.role)) {
            console.warn(`[Server] Non-player ${socket.id} tried to make a guess in room ${roomCode}`);
            socket.emit('guess-result', { success: false, message: 'You are not a player.' });
            return;
        }

        const isPlayer1Turn = guessingPlayer.role === 'player1' && currentRoom.currentGamePhase === 'P1_QUESTION';
        const isPlayer2Turn = guessingPlayer.role === 'player2' && currentRoom.currentGamePhase === 'P2_QUESTION';

        if (!isPlayer1Turn && !isPlayer2Turn) {
            console.warn(`[Server] ${socket.id} tried to guess in wrong phase: ${currentRoom.currentGamePhase}`);
            socket.emit('guess-result', { success: false, message: 'It\'s not your turn to make a final guess.' });
            return;
        }

        let playerGuessesRemaining;
        let opponentSecret;
        let opponentId;
        let playerRoleForGuessCount;

        if (guessingPlayer.role === 'player1') {
            playerGuessesRemaining = currentRoom.player1GuessesRemaining;
            opponentSecret = currentRoom.player2SecretFunctionId;
            opponentId = currentRoom.player2Id;
            playerRoleForGuessCount = 'player1';
        } else { // player2
            playerGuessesRemaining = currentRoom.player2GuessesRemaining;
            opponentSecret = currentRoom.player1SecretFunctionId;
            opponentId = currentRoom.player1Id;
            playerRoleForGuessCount = 'player2';
        }

        // Fallback: Ensure guesses are initialized if somehow they weren't
        if (typeof playerGuessesRemaining !== 'number') {
            console.error(`[Server] CRITICAL: Guesses not initialized for ${guessingPlayer.role} in room ${roomCode} before guess attempt. Forcing initialization.`);
            currentRoom.player1GuessesRemaining = STARTING_GUESSES;
            currentRoom.player2GuessesRemaining = STARTING_GUESSES;
            playerGuessesRemaining = (guessingPlayer.role === 'player1') ? currentRoom.player1GuessesRemaining : currentRoom.player2GuessesRemaining;

            io.to(roomCode).emit('guesses-remaining-update', { // Notify all clients of this correction
                player1: currentRoom.player1GuessesRemaining,
                player2: currentRoom.player2GuessesRemaining
            });
            // It might be better to emit an error here and prevent the guess,
            // but for robustness, we'll allow the guess with freshly initialized counts.
        }


        if (playerGuessesRemaining <= 0) {
            console.log(`[Server] Player ${socket.id} has no guesses left in room ${roomCode}.`);
            socket.emit('guess-result', { success: false, message: 'You have no guesses left!' });
            if (currentRoom.currentGamePhase !== 'GAME_OVER') {
                currentRoom.currentGamePhase = 'GAME_OVER';
                currentRoom.winnerId = opponentId;
                io.to(roomCode).emit('game-phase-update', 'GAME_OVER');
                io.to(roomCode).emit('game-winner', opponentId);
                io.to(roomCode).emit('game-end-details', {
                    winnerId: opponentId,
                    player1Secret: currentRoom.player1SecretFunctionId,
                    player2Secret: currentRoom.player2SecretFunctionId
                });
            }
            return;
        }

        if (playerRoleForGuessCount === 'player1') {
            currentRoom.player1GuessesRemaining--;
        } else {
            currentRoom.player2GuessesRemaining--;
        }

        io.to(roomCode).emit('guesses-remaining-update', {
            player1: currentRoom.player1GuessesRemaining,
            player2: currentRoom.player2GuessesRemaining
        });
        console.log(`[Server] Player ${socket.id} made a guess. ${guessingPlayer.role === 'player1' ? 'P1' : 'P2'} Guesses left: ${guessingPlayer.role === 'player1' ? currentRoom.player1GuessesRemaining : currentRoom.player2GuessesRemaining}`);

        if (guessedFunctionId === opponentSecret) {
            console.log(`[Server] Correct guess by ${socket.id} in room ${roomCode}. Winner declared! 🎉`);
            currentRoom.winnerId = socket.id;
            currentRoom.currentGamePhase = 'GAME_OVER';

            socket.emit('guess-result', { success: true, correct: true, winnerId: socket.id });
            io.to(roomCode).emit('game-winner', socket.id);
            io.to(roomCode).emit('game-phase-update', 'GAME_OVER');
            io.to(roomCode).emit('game-end-details', {
                winnerId: socket.id,
                player1Secret: currentRoom.player1SecretFunctionId,
                player2Secret: currentRoom.player2SecretFunctionId
            });
        } else {
            console.log(`[Server] Incorrect guess by ${socket.id} in room ${roomCode}.`);
            socket.emit('guess-result', { success: true, correct: false, message: 'Incorrect guess. 🤔' });

            const currentPlayerOutOfGuesses =
                (guessingPlayer.role === 'player1' && currentRoom.player1GuessesRemaining <= 0) ||
                (guessingPlayer.role === 'player2' && currentRoom.player2GuessesRemaining <= 0);

            if (currentPlayerOutOfGuesses) {
                console.log(`[Server] Player ${socket.id} ran out of guesses. Opponent ${opponentId} wins. 🏆`);
                currentRoom.winnerId = opponentId;
                currentRoom.currentGamePhase = 'GAME_OVER';

                io.to(roomCode).emit('game-winner', opponentId);
                io.to(roomCode).emit('game-phase-update', 'GAME_OVER');
                io.to(roomCode).emit('game-end-details', {
                    winnerId: opponentId,
                    player1Secret: currentRoom.player1SecretFunctionId,
                    player2Secret: currentRoom.player2SecretFunctionId
                });
            } else {
                const nextPhase = guessingPlayer.role === 'player1' ? 'P2_QUESTION' : 'P1_QUESTION';
                currentRoom.currentGamePhase = nextPhase;
                io.to(roomCode).emit('game-phase-update', nextPhase);
                console.log(`[Server] Advancing phase to: ${nextPhase} after incorrect guess.`);
            }
        }
    });

    socket.on('disconnect', () => {
        console.log(`Socket disconnected: ${socket.id}`);
        if (socket.data.currentRoom) {
            removeSocketFromRoomState(socket.id, socket.data.currentRoom);
        }
    });
});

const PORT = 3001;
httpServer.listen(PORT, () => {
    console.log(`🚀 Signaling server (with player secrets & guess tracking) listening on port ${PORT}`);
});
