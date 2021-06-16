class Client {
    constructor(id, size) {
        this.id = id;
        this.size = size;
        this.status = 0;
        this.camera = {
            x: 0,
            y: 0,
            zoom: 5
        };
        this.foodArray = [];
        this.playerArray = [];
        this.debugMode = false;
    };

    checkStatus() {
        if (this.status == 1) {
            fill('darkred')
            textSize(50)
            text('You got eaten!', windowWidth / 2, windowHeight / 2);
            textSize(26);
            fill(theme.secondaryText);
            text('If you want to play again, refresh the page.', windowWidth / 2, windowHeight / 2 + 60);
            return true;
        } else if (client.status == 2) {
            background(theme.background);
            fill(theme.text)
            textSize(50)
            text('You are disconnected from the server', windowWidth / 2, windowHeight / 2);
            textSize(26);
            fill(theme.secondaryText);
            text('If you want to play again, refresh the page.', windowWidth / 2, windowHeight / 2 + 60);
            return true;
        }
    };

    adjustZoom() {
        let idealZoom = 30 / client.playerArray[client.playerArray.map((player) => { return player.id }).indexOf(client.id)].size + 0.7
        let zoomDifference = Math.abs(idealZoom - client.camera.zoom) / 20
        if (client.camera.zoom < idealZoom) {
            if (zoomDifference < 0.0000001) {
                client.camera.zoom = idealZoom;
            } else {
                client.camera.zoom += zoomDifference;
            }
        } else if (client.camera.zoom > idealZoom) {
            if (zoomDifference < 0.0000001) {
                client.camera.zoom = idealZoom;
            } else {
                client.camera.zoom -= zoomDifference;
            }
        }
    };

    renderDebugMode() {
        textAlign(LEFT)
		textSize(16);
		fill(theme.accent);
		text('Debug Data', 10, 20);
		fill(theme.secondaryText);
		text('Zoom/zoomDifference: ' + this.camera.zoom + '/' + Math.abs((30 / client.playerArray[client.playerArray.map((player) => { return player.id }).indexOf(client.id)].size + 0.7) - client.camera.zoom)/20, 10, 40);
		text('Camera X, Y: ' + Math.floor(this.camera.x) + ' , ' + Math.floor(this.camera.y), 10, 60);
		text('Frame: ' + frameCount, 10, 80);
		text('Players count: ' + this.playerArray.length, 10, 100);
		text('Rendered/Total Food: ' + renderedFood + '/' + this.foodArray.length, 10, 120);
		text('Frames: ' + Math.floor(frameRate()), 10, 140);
		text('Size: ' + this.playerArray[this.playerArray.map((player) => { return player.id }).indexOf(this.id)].size, 10, 160);
    };

    drawMap() {
        background(theme.background);
	    fill(theme.content)
	    rect((0 - this.camera.x) * this.camera.zoom + windowWidth / 2, (0 - this.camera.y) * this.camera.zoom + windowHeight / 2, this.size.x * this.camera.zoom, this.size.y * this.camera.zoom);
    }
}