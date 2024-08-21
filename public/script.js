// const socket = io();

// document.getElementById('startButton').addEventListener('click', function() {
//     socket.emit('startGame');
// });

// socket.on('assignWords', ({ word }) => {
//     document.getElementById('word').textContent = `Your word is: ${word}`;

//     document.getElementById('startContainer').classList.remove('active');
//     document.getElementById('gameContainer').classList.add('active');
//     document.getElementById('chatContainer').classList.add('active');
// });

// document.getElementById('sendButton').onclick = () => {
//     const sentenceInput = document.getElementById('sentenceInput');
//     const sentence = sentenceInput.value.trim();
//     if (sentence) {
//         socket.emit('submitSentence', sentence);
//         sentenceInput.value = '';
//     }
// };

// socket.on('receiveSentence', (sentence) => {
//     const messages = document.getElementById('messages');
//     const li = document.createElement('li');
//     li.textContent = sentence;
//     messages.appendChild(li);
// });
const socket = io();

document.getElementById('createRoomButton').addEventListener('click', () => {
    const playerName = document.getElementById('playerNameInput').value.trim();
    if (playerName) {
        socket.emit('createRoom', playerName, ({ roomCode, players }) => {
            document.getElementById('nameContainer').style.display = 'none';
            document.getElementById('waitingContainer').style.display = 'block';
            document.getElementById('roomCodeDisplay').textContent = roomCode;
            document.getElementById('roomCodeInput').style.display = 'none'; // Hide room code input after creation
            updatePlayersList(players);
        });
    }
});

document.getElementById('joinRoomButton').addEventListener('click', () => {
    document.getElementById('roomCodeInput').style.display = 'block';
});

document.getElementById('roomCodeInput').addEventListener('change', () => {
    const playerName = document.getElementById('playerNameInput').value.trim();
    const roomCode = document.getElementById('roomCodeInput').value.trim().toUpperCase();
    if (playerName && roomCode) {
        socket.emit('joinRoom', { roomCode, playerName }, (response) => {
            if (response.success) {
                document.getElementById('nameContainer').style.display = 'none';
                document.getElementById('waitingContainer').style.display = 'block';
                updatePlayersList(response.players);
            } else {
                alert(response.message);
            }
        });
    }
});

socket.on('updateRoom', (players) => {
    updatePlayersList(players);
});

socket.on('displayRoomCode', (roomCode) => {
    document.getElementById('roomCodeDisplay').textContent = roomCode;
});

socket.on('assignWords', (wordAssignments) => {
    const playerName = document.getElementById('playerNameInput').value.trim(); // Assuming the player's name is set
    document.getElementById('waitingContainer').style.display = 'none';
    document.getElementById('gameContainer').style.display = 'block';
    document.getElementById('playerNameDisplay').textContent = `Your name: ${playerName}`;
    document.getElementById('wordDisplay').textContent = `Your word is: ${wordAssignments}`;
    document.getElementById('callVoteButton').style.display = 'inline-block';
});

function updatePlayersList(players) {
    const playersList = document.getElementById('playersList');
    playersList.innerHTML = '';
    players.forEach(player => {
        const li = document.createElement('li');
        li.textContent = player.name;
        playersList.appendChild(li);
    });
}

document.getElementById('sendButton').addEventListener('click', () => {
    const sentence = document.getElementById('sentenceInput').value.trim();
    if (sentence) {
        socket.emit('submitSentence', { roomCode: document.getElementById('roomCodeDisplay').textContent, sentence });
        document.getElementById('sentenceInput').value = '';
    }
});

socket.on('receiveSentence', ({ sentence, playerName }) => {
    const messages = document.getElementById('messages');
    const li = document.createElement('li');
    li.textContent = `${playerName}: ${sentence}`;
    messages.appendChild(li);
});

document.getElementById('callVoteButton').addEventListener('click', () => {
    socket.emit('callVote', document.getElementById('roomCodeDisplay').textContent);
});

socket.on('startVote', (playerNames) => {
    document.getElementById('voteContainer').style.display = 'block';
    const playerListForVote = document.getElementById('playerListForVote');
    playerListForVote.innerHTML = '';
    playerNames.forEach(name => {
        const li = document.createElement('li');
        li.textContent = name;
        li.addEventListener('click', () => {
            socket.emit('vote', { roomCode: document.getElementById('roomCodeDisplay').textContent, votedPlayerName: name });
        });
        playerListForVote.appendChild(li);
    });
});

socket.on('updateVotes', (votes) => {
    const votesDisplay = document.getElementById('votesDisplay');
    votesDisplay.innerHTML = '';
    for (const [playerName, voteCount] of Object.entries(votes)) {
        const li = document.createElement('li');
        li.textContent = `${playerName}: ${voteCount} vote(s)`;
        votesDisplay.appendChild(li);
    }
});







