// Generate map
let foodArray = []
let playerContainer = {};
let deletedPlayersQueue = []
let size = {
	x: 300,
	y: 300
}

// Cache food colour map
let foodColourCache = []
for (i = 0; i < 50; i++) {
	foodColourCache.push('#' + ('00000' + (Math.random() * (1 << 24) | 0).toString(16)).slice(-6))
}

// Quick retrieval of random value from colour cache
function getRandomColour() {
	return foodColourCache[Math.floor(Math.random() * foodColourCache.length)];
}

function getNewFood() {
	return {
		x: Math.floor(Math.random() * size.x),
		y: Math.floor(Math.random() * size.y),
		colour: getRandomColour()
	}
}

for (i = 0; i < size.x / 5; i++) {
	foodArray.push(getNewFood());
};

// Start networking
const express = require('express');
const socket = require('socket.io');
const app = express();
const server = app.listen(3000);
const io = socket(server);
app.use(express.static('public'));
io.sockets.on('connect', connectionEvent);

console.log('Le server is ready to recieve players...');

// On-Connection event
function connectionEvent(socket) {
	console.log('New connection: ' + socket.id);

	socket.on('username', (recievedUsername) => {
		console.log(socket.id + ' has the username ' + recievedUsername);
		playerContainer[socket.id] = {
			x: Math.floor(Math.random() * size.x),
			y: Math.floor(Math.random() * size.y),
			size: 20,
			velocity: {
				x: 0,
				y: 0
			},
			colour: getRandomColour(),
			username: recievedUsername
		};
	
		socket.emit('gameData', { 
			'foodArray': foodArray,
			'playerContainer': playerContainer,
			'size': size,
			'id': socket.id
		});
		socket.broadcast.emit('newPlayer', {playerEntity: playerContainer[socket.id], playerId: socket.id});
	})
	socket.on('disconnect', disconnectPlayer);
	socket.on('rotation', updateVelocity)

	function updateVelocity(velocity) {
		if (!playerContainer[this.id]) return;
		playerContainer[this.id]['velocity'] = velocity;
	};
	function disconnectPlayer() {
		console.log('Player disconnected: ' + this.id);
		if (!playerContainer[this.id]) return console.log('the player was dead, already deleted');
		deletedPlayersQueue.push(this.id);
	};
};

// Tick loop
function tickLoop() {
	// Move players
	for (player in playerContainer) {
		// TODO: change this 'algorithm' to keep slowing down but less and less idk find a balance
		playerContainer[player]['x'] += playerContainer[player]['velocity']['x'] / playerContainer[player]['size'] * 300
		playerContainer[player]['y'] += playerContainer[player]['velocity']['y'] / playerContainer[player]['size'] * 300
		normalizeCoordinates(playerContainer[player])
	};
	
	// Check for food eating
	for (player in playerContainer) {
		for (food of foodArray) {
			if (calculateDistance(playerContainer[player], food) < playerContainer[player].size / 2 - 2) {
				playerContainer[player].size += 200 / playerContainer[player].size;
				let foodIndex = foodArray.indexOf(food)
				foodArray.splice(foodIndex, 1);
				
				io.sockets.emit('foodEaten', foodIndex);
				
				while (foodArray.length < size.x / 5) {
					let food = getNewFood();
					foodArray.push(food);
					io.sockets.emit('foodGenerated', food);
				};
			};
		};
	};
	
	// TODO: send this after everything and find more efficient method to update only the ones that moved/ate or only the data we care about
	io.sockets.emit('playersUpdate', playerContainer);
	
	// Check for player eating
	// TODO find a way to order the array in size in order to skip check for bigger or smaller player later (if it's faster)
	// Maybe to not sort it everytime check if the number changed and if yes then redo and sort and if no then check if every element is same and then if yes reuse old (if ever sorting is slow)
	let playerCache = Object.keys(playerContainer);
	for (let i = 0; i < playerCache.length - 1; i++) {
		for (let j = i + 1; j < playerCache.length; j++) {
			if (playerContainer[playerCache[i]].size == playerContainer[playerCache[j]].size) continue;
			largerPlayer = playerContainer[playerCache[i]].size > playerContainer[playerCache[j]].size ? playerCache[i] : playerCache[j]
			smallerPlayer = playerContainer[playerCache[i]].size < playerContainer[playerCache[j]].size ? playerCache[i] : playerCache[j]
			
			if (calculateDistance(playerContainer[smallerPlayer], playerContainer[largerPlayer]) < playerContainer[largerPlayer].size / 2) {
				console.log(smallerPlayer + ' was eaten by ' + largerPlayer)
				let data = {
					eatenPlayerId: smallerPlayer,
					eatingPlayerId: largerPlayer,
					growingSize: playerContainer[smallerPlayer].size / playerContainer[largerPlayer].size * 50
				};
				deletedPlayersQueue.push(data)
				playerCache.splice(playerCache.indexOf(playerCache.filter(playerId => playerId == smallerPlayer)), 1);
			};
		};
	};
	for (data of deletedPlayersQueue) {
		deletedPlayersQueue.pop(deletedPlayersQueue.indexOf(data));
		if (data.eatenPlayerId) {
			playerContainer[data.eatingPlayerId].size += data.growingSize;
			delete playerContainer[data.eatenPlayerId];
			io.sockets.emit('eatenPlayer', data);
		} else {
			delete playerContainer[data];
			io.sockets.emit('playerDisconnected', data)
		}
	}
};

// TODO: move to ZtereoMATH when it will exist
function calculateDistance(object1, object2) {
	if (!object1 || !object2) return;
	let differenceX = object1.x - object2.x;
	let differenceY = object1.y - object2.y;
	return Math.sqrt(differenceX * differenceX + differenceY * differenceY);
};

function normalizeCoordinates(player) {
	if (player.x > size.x) {
		player.x = size.x
	}
	if (player.x < 0) {
		player.x = 0
	}
	if (player.y > size.y) {
		player.y = size.y
	}
	if (player.y < 0) {
		player.y = 0
	}
}

setInterval(tickLoop, 50);

process.on('unhandledRejection', error => {
    console.error('Unhandled promise rejection:', error);
});