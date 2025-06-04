const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        // !!! IMPORTANT: Make sure this matches your client's origin !!!
        // Example: "http://localhost:9002" or ["http://localhost:9002", "http://localhost:3000"]
        origin: "http://localhost:9002",
        methods: ["GET", "POST"]
    }
});

// Server-side state to manage all rooms
// Structure:
// {
//    'ROOM_CODE': {
//      player1Id: string | null,
//      player2Id: string | null,
//      usersInRoom: Map<string, { id: string, role: string }>,
//      currentGamePhase: string,
//      winnerId: string | null,
//      player1SecretFunctionId: string | null, // Secret ID for Player 1
//      player2SecretFunctionId: string | null  // Secret ID for Player 2
//    },
//    ...
// }
const allRoomsState = {};

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

        // Free up player slots if the disconnected/leaving user was a player
        if (currentRoom.player1Id === socketId) {
            currentRoom.player1Id = null;
            currentRoom.player1SecretFunctionId = null; // Clear secret if player leaves
            console.log(`[Server] Player1 slot and secret freed in room ${roomCode}`);
        } else if (currentRoom.player2Id === socketId) {
            currentRoom.player2Id = null;
            currentRoom.player2SecretFunctionId = null; // Clear secret if player leaves
            console.log(`[Server] Player2 slot and secret freed in room ${roomCode}`);
        }

        if (currentRoom.usersInRoom.size > 0) {
            io.to(roomCode).emit('user-disconnected', userData);
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
                // Initial game phase is now for both players to select functions
                currentGamePhase: 'SELECTING_FUNCTIONS',
                winnerId: null,
                player1SecretFunctionId: null, // Initialize secret IDs
                player2SecretFunctionId: null  // Initialize secret IDs
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

        if (currentRoom.winnerId) {
            socket.emit('game-winner', currentRoom.winnerId);
            console.log(`[Server] Sent existing winner ${currentRoom.winnerId} to new user ${socket.id} in room ${roomCode}`);
        }

        // If game is over and secrets are known, send game-end-details to new joiner
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
        removeSocketFromRoomState(socket.id, roomCode);
        socket.data.currentRoom = null;
        socket.emit('room-leave-status', { success: true });
        console.log(`[Server] Socket ${socket.id} successfully left room ${roomCode}`);
    });

    // Handle clients setting their secret function
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

        // Only allow setting secret during the SELECTING_FUNCTIONS phase
        if (currentRoom.currentGamePhase !== 'SELECTING_FUNCTIONS') {
            console.warn(`[Server] ${socket.id} tried to set secret in wrong phase: ${currentRoom.currentGamePhase}`);
            // Optionally, emit an error back to the client
            return;
        }

        if (requestingUser.role === 'player1') {
            // Prevent player 1 from re-setting if already set
            if (currentRoom.player1SecretFunctionId) {
                console.warn(`[Server] Player 1 (${socket.id}) tried to re-set secret in ${roomCode}`);
                return;
            }
            currentRoom.player1SecretFunctionId = secretFunctionId;
            console.log(`[Server] Player 1 (${socket.id}) set secret in ${roomCode}: ${secretFunctionId}`);
        } else if (requestingUser.role === 'player2') {
            // Prevent player 2 from re-setting if already set
            if (currentRoom.player2SecretFunctionId) {
                console.warn(`[Server] Player 2 (${socket.id}) tried to re-set secret in ${roomCode}`);
                return;
            }
            currentRoom.player2SecretFunctionId = secretFunctionId;
            console.log(`[Server] Player 2 (${socket.id}) set secret in ${roomCode}: ${secretFunctionId}`);
        }

        // If both players have selected their secrets, advance the phase
        if (currentRoom.player1SecretFunctionId && currentRoom.player2SecretFunctionId) {
            currentRoom.currentGamePhase = 'P1_QUESTION'; // Advance to the first question phase
            io.to(roomCode).emit('game-phase-update', currentRoom.currentGamePhase);
            console.log(`[Server] Both players set secrets in ${roomCode}. Advancing phase to: ${currentRoom.currentGamePhase}`);
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

        // Update validPhases to include the new SELECTING_FUNCTIONS phase
        const validPhases = ['SELECTING_FUNCTIONS', 'P1_QUESTION', 'P2_QUESTION', 'GAME_OVER'];
        if (!validPhases.includes(newPhase)) {
            console.warn(`[Server] Invalid new phase requested: ${newPhase} from ${socket.id}`);
            return;
        }

        console.log(`[Server] ${socket.id} (${requestingUser.role}) requesting phase change in ${roomCode} to: ${newPhase}`);

        currentRoom.currentGamePhase = newPhase;

        io.to(roomCode).emit('game-phase-update', newPhase);
        console.log(`[Server] Broadcasted new phase '${newPhase}' to room ${roomCode}`);

        // If the game phase becomes GAME_OVER, ensure winner is cleared if it wasn't set explicitly
        if (newPhase === 'GAME_OVER') {
            // If GAME_OVER is manually set without a winner declared, clear secrets too
            if (!currentRoom.winnerId) {
                currentRoom.player1SecretFunctionId = null;
                currentRoom.player2SecretFunctionId = null;
            }
            // Always emit game-end-details when GAME_OVER is set (even if secrets are null)
            io.to(roomCode).emit('game-end-details', {
                winnerId: currentRoom.winnerId,
                player1Secret: currentRoom.player1SecretFunctionId,
                player2Secret: currentRoom.player2SecretFunctionId
            });
            console.log(`[Server] Game over in ${roomCode}. Sending game end details.`);
        } else {
            // Clear winner and secrets if phase changes from GAME_OVER to another
            currentRoom.winnerId = null;
            currentRoom.player1SecretFunctionId = null;
            currentRoom.player2SecretFunctionId = null;
            io.to(roomCode).emit('game-winner', null); // Clear winner on clients
            io.to(roomCode).emit('game-end-details', { winnerId: null, player1Secret: null, player2Secret: null }); // Clear secrets on clients
        }
    });

    socket.on('declare-winner', ({ roomCode, winnerId }) => {
        const currentRoom = allRoomsState[roomCode];
        if (!currentRoom) {
            console.warn(`[Server] Request to declare winner for non-existent room ${roomCode} by ${socket.id}`);
            return;
        }

        const requestingUser = currentRoom.usersInRoom.get(socket.id);
        if (!requestingUser || !['player1', 'player2'].includes(requestingUser.role)) {
            console.warn(`[Server] Non-player ${socket.id} tried to declare winner in room ${roomCode}`);
            return;
        }

        const canDeclareWinner = ['P1_QUESTION', 'P2_QUESTION'].includes(currentRoom.currentGamePhase);

        if (!canDeclareWinner) {
            console.warn(`[Server] ${socket.id} tried to declare winner in wrong phase: ${currentRoom.currentGamePhase}`);
            return;
        }

        // Set the winner ID and update the game phase to GAME_OVER
        currentRoom.winnerId = winnerId;
        currentRoom.currentGamePhase = 'GAME_OVER';

        console.log(`[Server] Winner declared in room ${roomCode}: ${winnerId}. Game over.`);

        // Broadcast the winner ID and game phase to all clients in the room
        io.to(roomCode).emit('game-winner', winnerId);
        io.to(roomCode).emit('game-phase-update', 'GAME_OVER');

        // Also broadcast both players' secret functions
        io.to(roomCode).emit('game-end-details', {
            winnerId: winnerId,
            player1Secret: currentRoom.player1SecretFunctionId,
            player2Secret: currentRoom.player2SecretFunctionId
        });
        console.log(`[Server] Sending game end details with secrets for room ${roomCode}`);
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
    console.log(`Signaling server (with player secrets) listening on port ${PORT}`);
});
