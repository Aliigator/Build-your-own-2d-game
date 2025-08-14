// Basic 2D drawing game with movement and spacebar drawing

// Canvas setup
const viewport = document.getElementById('viewport');
const ctx = viewport.getContext('2d');

// World buffer so drawn strokes persist beyond camera view
const worldCanvas = document.createElement('canvas');
const worldCtx = worldCanvas.getContext('2d');

// Resize handling
function resize() {
	viewport.width = window.innerWidth;
	viewport.height = window.innerHeight;
	// Keep world large to roam; could be infinite with chunks, but static for now
	if (worldCanvas.width < 4096 || worldCanvas.height < 4096) {
		worldCanvas.width = Math.max(worldCanvas.width, 4096);
		worldCanvas.height = Math.max(worldCanvas.height, 4096);
	}
}
window.addEventListener('resize', resize);
resize();

// Player state
const player = {
	positionX: worldCanvas.width / 2,
	positionY: worldCanvas.height / 2,
	speedPixelsPerSecond: 220,
	radius: 8,
	color: '#66ffcc'
};

// Brush state
let brushColor = '#66ffcc';
let brushRadius = 6;

// Input state
const keysDown = new Set();
window.addEventListener('keydown', (e) => {
	if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key)) e.preventDefault();
	keysDown.add(e.key);
});
window.addEventListener('keyup', (e) => {
	keysDown.delete(e.key);
});

// Utility input helpers
function isPressed(...names) {
	for (const name of names) if (keysDown.has(name)) return true;
	return false;
}

// Camera
const camera = { x: 0, y: 0 };

// Drawing helpers
function drawCircle(ctx, x, y, r, color) {
	ctx.fillStyle = color;
	ctx.beginPath();
	ctx.arc(x, y, r, 0, Math.PI * 2);
	ctx.fill();
}

function drawBrushStamp(worldCtx, x, y) {
	worldCtx.fillStyle = brushColor;
	worldCtx.beginPath();
	worldCtx.arc(x, y, brushRadius, 0, Math.PI * 2);
	worldCtx.fill();
}

// Game loop
let lastTime = performance.now();
function frame(now) {
	const deltaSeconds = Math.min(0.05, (now - lastTime) / 1000);
	lastTime = now;

	// Movement
	let moveX = 0;
	let moveY = 0;
	if (isPressed('ArrowLeft', 'a', 'A')) moveX -= 1;
	if (isPressed('ArrowRight', 'd', 'D')) moveX += 1;
	if (isPressed('ArrowUp', 'w', 'W')) moveY -= 1;
	if (isPressed('ArrowDown', 's', 'S')) moveY += 1;
	if (moveX !== 0 || moveY !== 0) {
		const length = Math.hypot(moveX, moveY) || 1;
		moveX /= length;
		moveY /= length;
		player.positionX += moveX * player.speedPixelsPerSecond * deltaSeconds;
		player.positionY += moveY * player.speedPixelsPerSecond * deltaSeconds;
		player.positionX = Math.max(player.radius, Math.min(worldCanvas.width - player.radius, player.positionX));
		player.positionY = Math.max(player.radius, Math.min(worldCanvas.height - player.radius, player.positionY));
	}

	// Drawing while space held
	if (isPressed(' ')) {
		drawBrushStamp(worldCtx, player.positionX, player.positionY);
	}

	// Camera centers on player
	camera.x = player.positionX - viewport.width / 2;
	camera.y = player.positionY - viewport.height / 2;

	// Clear screen
	ctx.clearRect(0, 0, viewport.width, viewport.height);

	// Render world buffer
	ctx.drawImage(
		worldCanvas,
		camera.x, camera.y, viewport.width, viewport.height,
		0, 0, viewport.width, viewport.height
	);

	// Render player
	drawCircle(ctx, viewport.width / 2, viewport.height / 2, player.radius, player.color);

	requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// Quality-of-life controls
window.addEventListener('keydown', (e) => {
	if (e.key === 'c' || e.key === 'C') {
		worldCtx.clearRect(0, 0, worldCanvas.width, worldCanvas.height);
	}
	if (e.key === 'r' || e.key === 'R') {
		brushColor = `hsl(${Math.floor(Math.random()*360)}, 80%, 70%)`;
		player.color = brushColor;
	}
	if (e.key === '[') {
		brushRadius = Math.max(1, brushRadius - 1);
	}
	if (e.key === ']') {
		brushRadius = Math.min(64, brushRadius + 1);
	}
});