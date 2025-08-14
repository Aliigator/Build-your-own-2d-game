const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d", { alpha: true });

const devicePixelRatioClamped = Math.min(window.devicePixelRatio || 1, 2);

let viewportWidthCss = 0;
let viewportHeightCss = 0;

function resizeCanvas() {
  viewportWidthCss = Math.max(1, Math.floor(window.innerWidth));
  viewportHeightCss = Math.max(1, Math.floor(window.innerHeight));
  canvas.width = Math.floor(viewportWidthCss * devicePixelRatioClamped);
  canvas.height = Math.floor(viewportHeightCss * devicePixelRatioClamped);
  canvas.style.width = viewportWidthCss + "px";
  canvas.style.height = viewportHeightCss + "px";
}

window.addEventListener("resize", resizeCanvas, { passive: true });
resizeCanvas();

const worldSize = 4096;
const worldCanvas = document.createElement("canvas");
worldCanvas.width = worldSize;
worldCanvas.height = worldSize;
const world = worldCanvas.getContext("2d");
world.lineCap = "round";
world.lineJoin = "round";

const player = {
  x: worldSize / 2,
  y: worldSize / 2,
  radius: 8,
  speedPixelsPerSecond: 280
};

let brushSize = 6;
let brushColor = "#38bdf8";

const pressedKeys = new Set();
let spaceHeld = false;

function onKeyDown(e) {
  const code = e.code;
  if (["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "PageUp", "PageDown"].includes(code)) {
    e.preventDefault();
  }
  pressedKeys.add(code);
  if (code === "Space") spaceHeld = true;
  if (code === "KeyR") brushColor = randomBrightColor();
  if (code === "BracketLeft") brushSize = Math.max(1, Math.min(64, brushSize - 1));
  if (code === "BracketRight") brushSize = Math.max(1, Math.min(64, brushSize + 1));
  if (code === "KeyC") world.clearRect(0, 0, worldSize, worldSize);
}

function onKeyUp(e) {
  const code = e.code;
  pressedKeys.delete(code);
  if (code === "Space") spaceHeld = false;
}

window.addEventListener("keydown", onKeyDown);
window.addEventListener("keyup", onKeyUp);
window.addEventListener("blur", () => {
  pressedKeys.clear();
  spaceHeld = false;
});

document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    pressedKeys.clear();
    spaceHeld = false;
    lastTime = performance.now();
  }
});

function randomBrightColor() {
  const h = Math.floor(Math.random() * 360);
  const s = 90;
  const l = 60;
  return `hsl(${h} ${s}% ${l}%)`;
}

function getMovementVector() {
  let dx = 0;
  let dy = 0;
  if (pressedKeys.has("ArrowLeft") || pressedKeys.has("KeyA")) dx -= 1;
  if (pressedKeys.has("ArrowRight") || pressedKeys.has("KeyD")) dx += 1;
  if (pressedKeys.has("ArrowUp") || pressedKeys.has("KeyW")) dy -= 1;
  if (pressedKeys.has("ArrowDown") || pressedKeys.has("KeyS")) dy += 1;
  if (dx === 0 && dy === 0) return { x: 0, y: 0 };
  const invLen = 1 / Math.hypot(dx, dy);
  return { x: dx * invLen, y: dy * invLen };
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

let lastTime = performance.now();

function frame(now) {
  const dt = Math.min(0.05, (now - lastTime) / 1000);
  lastTime = now;

  const move = getMovementVector();
  const oldX = player.x;
  const oldY = player.y;

  if (move.x !== 0 || move.y !== 0) {
    player.x += move.x * player.speedPixelsPerSecond * dt;
    player.y += move.y * player.speedPixelsPerSecond * dt;
    player.x = clamp(player.x, player.radius, worldSize - player.radius);
    player.y = clamp(player.y, player.radius, worldSize - player.radius);
  }

  if (spaceHeld && (oldX !== player.x || oldY !== player.y)) {
    world.strokeStyle = brushColor;
    world.lineWidth = brushSize * 2;
    world.beginPath();
    world.moveTo(oldX, oldY);
    world.lineTo(player.x, player.y);
    world.stroke();
  }

  const vpw = canvas.width / devicePixelRatioClamped;
  const vph = canvas.height / devicePixelRatioClamped;
  let camX = player.x - vpw / 2;
  let camY = player.y - vph / 2;
  camX = clamp(camX, 0, worldSize - vpw);
  camY = clamp(camY, 0, worldSize - vph);

  ctx.save();
  ctx.scale(devicePixelRatioClamped, devicePixelRatioClamped);
  ctx.clearRect(0, 0, vpw, vph);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(worldCanvas, camX, camY, vpw, vph, 0, 0, vpw, vph);

  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(vpw / 2, vph / 2, player.radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();

  requestAnimationFrame(frame);
}

window.focus();
requestAnimationFrame(frame);