// const express = require("express");
// const http = require("http");
// const { Server } = require("socket.io");

// const app = express();
// const server = http.createServer(app);
// const io = new Server(server);

// // Serve static files from the 'public' directory
// app.use(express.static("public"));

// // Define a list of words for the game
// const words = ["apple", "banana", "cherry", "date"];

// let assignedWords = {}; // Track assigned words by socket ID

// io.on("connection", (socket) => {
//     console.log("A user connected");

//     // Handle 'startGame' event for individual clients
//     socket.on("startGame", () => {
//         console.log("Game started by client");

//         // Shuffle words and assign
//         const shuffledWords = [...words].sort(() => 0.5 - Math.random());
//         const commonWord = shuffledWords[0];
//         const uniqueWord = shuffledWords[1];

//         // Assign a word to the current client
//         const word = Object.keys(assignedWords).length === 3 ? uniqueWord : commonWord;
//         assignedWords[socket.id] = word;

//         // Emit the word assignment only to the current client
//         socket.emit("assignWords", { word });
//         console.log(`Assigned word ${word} to client ${socket.id}`);
//     });

//     // Handle incoming sentences and broadcast them
//     socket.on("submitSentence", (sentence) => {
//         console.log("Received sentence:", sentence);
//         socket.broadcast.emit("receiveSentence", sentence); // Broadcast the sentence to all other clients
//     });

//     socket.on("disconnect", () => {
//         console.log("User disconnected");
//         delete assignedWords[socket.id]; // Clean up when a client disconnects
//     });
// });

// server.listen(3000, () => {
//     console.log("Listening on *:3000");
// });
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Serve static files from the 'public' directory
app.use(express.static("public"));

const words = ["apple", "banana", "cherry", "date"];
const rooms = {}; // Stores rooms and their players

io.on("connection", (socket) => {
    console.log("A user connected");

    socket.on('createRoom', (playerName, callback) => {
        const roomCode = generateRoomCode();
        rooms[roomCode] = { 
            players: [{ id: socket.id, name: playerName, word: '' }], 
            wordAssignments: [], 
            votes: {} 
        };
        socket.join(roomCode);
        io.to(socket.id).emit('displayRoomCode', roomCode);
        io.to(socket.id).emit('updateRoom', rooms[roomCode].players);
    });

    socket.on('joinRoom', ({ roomCode, playerName }, callback) => {
        if (rooms[roomCode]) {
            if (rooms[roomCode].players.length < 4) {
                rooms[roomCode].players.push({ id: socket.id, name: playerName, word: '' });
                socket.join(roomCode);
                io.to(roomCode).emit('updateRoom', rooms[roomCode].players);
                callback({ success: true, players: rooms[roomCode].players });

                // Check if room is full
                if (rooms[roomCode].players.length === 4) {
                    startGame(roomCode);
                }
            } else {
                callback({ success: false, message: "Room is full" });
            }
        } else {
            callback({ success: false, message: "Room does not exist" });
        }
    });

    function startGame(roomCode) {
        const shuffledWords = [...words].sort(() => 0.5 - Math.random());
        const wordAssignments = shuffledWords.slice(0, 4);
        rooms[roomCode].wordAssignments = wordAssignments;
        rooms[roomCode].players.forEach((player, index) => {
            player.word = wordAssignments[index];
            io.to(player.id).emit('assignWords', player.word);
        });
        io.to(roomCode).emit('startVote', rooms[roomCode].players.map(p => p.name));
    }

    socket.on('submitSentence', ({ roomCode, sentence }) => {
        const player = rooms[roomCode].players.find(p => p.id === socket.id);
        io.to(roomCode).emit('receiveSentence', { sentence, playerName: player.name });
    });

    socket.on('callVote', (roomCode) => {
        io.to(roomCode).emit('startVote', rooms[roomCode].players.map(p => p.name));
    });

    socket.on('vote', ({ roomCode, votedPlayerName }) => {
        if (!rooms[roomCode].votes) rooms[roomCode].votes = {};
        rooms[roomCode].votes[votedPlayerName] = (rooms[roomCode].votes[votedPlayerName] || 0) + 1;
        io.to(roomCode).emit('updateVotes', rooms[roomCode].votes);
    });

    socket.on('disconnect', () => {
        console.log("User disconnected");
        for (const roomCode in rooms) {
            const room = rooms[roomCode];
            room.players = room.players.filter(p => p.id !== socket.id);
            if (room.players.length === 0) {
                delete rooms[roomCode];
            } else {
                io.to(roomCode).emit('updateRoom', room.players);
            }
        }
    });
});

function generateRoomCode() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}

server.listen(3000, () => {
    console.log("Listening on *:3000");
});


