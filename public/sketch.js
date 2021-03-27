let map;
let id;
let clientPlayerArray = [];
let mainPlayer;
var socket;
let frames = 0;
let cameraX = 0;
let cameraY = 0;
let cameraZoom = 3;
let debugInfo = 0;
let renderedFood = 0;

// make camera work using this https://editor.p5js.org/carl-vbn/sketches/L5AFIST1U

function setup() {
  frameRate(60)
  socket = io.connect('http://109.130.192.116:3000')

  socket.on('playerId', (recievedId) => {
    id = recievedId
    console.log('Recieved ID: ' + id)
  })

  socket.on('mapData', (recievedMap) => {
    map = recievedMap;
    console.log('Recieved game map')
    createCanvas(windowWidth, windowHeight);

    for (playerObject in map.playerContainer) {
      if (playerObject != id) {
        clientPlayerArray.push(new Player(map['playerContainer'][playerObject], playerObject))
      } else {
        mainPlayer = new Player(map['playerContainer'][playerObject], playerObject)
      }
    }
    delete map['playerContainer'];
  })

  socket.on('newPlayer', (playerId) => {
    console.log('New player connected')
    clientPlayerArray.push(new Player(
      {
        x: map.size.x / 2,
        y: map.size.x / 2,
        size: 20
      },
      playerId))
  })

  socket.on('playerPosition', (positionData) => {
    // player position in clientPlayerArray is given in location.x and location.y because they are objects created from classes
    var currentlyUpdatingPlayerIndex = clientPlayerArray.map(function (player) { return player.id; }).indexOf(positionData.id);

    clientPlayerArray[currentlyUpdatingPlayerIndex]['location']['x'] = positionData.x
    clientPlayerArray[currentlyUpdatingPlayerIndex]['location']['y'] = positionData.y
    clientPlayerArray[currentlyUpdatingPlayerIndex]['size'] = positionData.size
  })

  socket.on('foodEaten', (eatenFoodIndex) => {
    map.foodArray.splice(eatenFoodIndex, 1)
  })

  socket.on('foodGenerated', (generatedFood) => {
    map.foodArray.push(generatedFood)
  })

  socket.on('playerDisconnected', (disconnectedPlayerId) => {
    clientPlayerArray.splice(clientPlayerArray.indexOf(clientPlayerArray.filter(player => player.id == disconnectedPlayerId)), 1);
  })
}

function draw() {
  if (!map || !id) {
    return;
  }

  background(220);

  cameraX = mainPlayer.location.x
  cameraY = mainPlayer.location.y

  fill('white')
  rect((0 - cameraX) * cameraZoom + windowWidth / 2, (0 - cameraY) * cameraZoom + windowHeight / 2, map.size.x * cameraZoom, map.size.y * cameraZoom)

  renderedFood = 0;
  map.foodArray.forEach((food) => {
    // cull food out of the screen to keep from lag on large maps
    if (food.x > cameraX + (windowWidth / 2 + 10) / cameraZoom || food.x < cameraX - (windowWidth / 2 + 10) / cameraZoom || food.y > cameraY + (windowHeight / 2 + 10) / cameraZoom || food.y < cameraY - (windowHeight / 2 + 10) / cameraZoom) {
      return;
    }
    fill(food.colour)
    noStroke()
    circle((food.x - cameraX) * cameraZoom + windowWidth / 2, (food.y - cameraY) * cameraZoom + windowHeight / 2, 10 * cameraZoom);
    renderedFood++;
  })

  // TODO: render players in order of opposite size so larger players appear on top :P
  clientPlayerArray.forEach((player) => {
    player.display("red", cameraX, cameraY, cameraZoom)
  })

  mainPlayer.display("blue", cameraX, cameraY, cameraZoom)
  mainPlayer.move()
  mainPlayer.checkEat(map.foodArray)

  if (cameraZoom > 20 / mainPlayer.size + 0.7) {
    let zoomDifference = (cameraZoom - (20 / mainPlayer.size + 0.7)) / 20
    if (zoomDifference < 0.0001) {
      cameraZoom = 20 / mainPlayer.size + 0.7;
    } else {
      cameraZoom -= zoomDifference;
    }
  }

  // broadcasting loop
  if (frames % 3 == 0) {
    mainPlayer.emitPosition()
  }

  if (debugInfo == 1 || debugInfo == 2) {
    textSize(16);
    fill(0, 102, 153, 255);
    text('Debug Data', 10, 20);
    fill(0, 102, 153, 200);
    text('Zoom: ' + cameraZoom + '/' + (cameraZoom - (20 / mainPlayer.size + 0.7)), 10, 40);
    text('Camera X, Y: ' + Math.floor(cameraX) + ' , ' + Math.floor(cameraY), 10, 60);
    text('Frame: ' + frames, 10, 80);
    text('Other Players Count: ' + clientPlayerArray.length, 10, 100);
    text('Total Food/Rendered Food: ' + map.foodArray.length + '/' + renderedFood, 10, 120);
    text('Frames: ' + Math.floor(frameRate()), 10, 140);
    text('Size: ' + mainPlayer.size, 10, 160);
  }

  frames++;
}

function keyPressed() {
  if (keyCode === SHIFT) {
    if (debugInfo == 1) {
      debugInfo = 0;
    } else {
      debugInfo = 1;
    }
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

function normalizeCoordinates(object) {
  let magnitude = Math.sqrt(object.x * object.x + object.y * object.y)
  return {
    x: object.x / magnitude,
    y: object.y / magnitude
  };
}

function calculateDistance(object1, object2) {
  let differenceX = object1.x - object2.x;
  if (differenceX < 0) differenceX = -differenceX;

  let differenceY = object1.y - object2.y;
  if (differenceY < 0) differenceY = -differenceY;

  return Math.sqrt(differenceX * differenceX + differenceY * differenceY);
}