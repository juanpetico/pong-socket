//* Constantes y Estado del Juego

const canvasWidth = 600;
const canvasHeight = 400;
const paddleHeight = 80;
const paddleWidth = 10;
const ballRadius = 8;

const SPEED_INCREMENT = 1;  
const MAX_SPEED = 12;         
const INITIAL_SPEED = 3;      

let gameState = {
  player1: { x: 20, y: canvasHeight / 2 - paddleHeight / 2 },
  player2: {
    x: canvasWidth - 20 - paddleWidth,
    y: canvasHeight / 2 - paddleHeight / 2,
  },
  ball: {
    x: canvasWidth / 2,
    y: canvasHeight / 2,
    dx: 3,
    dy: 3,
  },
  score: { player1: 0, player2: 0 },
};

let players = {};
let playerQueue = [];
let io;

//* Lógica Interna del Juego

function resetBall() {
    gameState.ball.x = canvasWidth / 2;
    gameState.ball.y = canvasHeight / 2;
    
    // Reiniciar la velocidad a la inicial (INITIAL_SPEED)
    gameState.ball.dx = Math.random() > 0.5 ? INITIAL_SPEED : -INITIAL_SPEED;
    gameState.ball.dy = Math.random() > 0.5 ? INITIAL_SPEED : -INITIAL_SPEED;
}

function gameLoop() {
  if (playerQueue.length < 2) return;

  // Mover la pelota
  gameState.ball.x += gameState.ball.dx;
  gameState.ball.y += gameState.ball.dy;

  // Colisiones con paredes (top/bottom) — usar posición actual y fijar
  if (gameState.ball.y <= ballRadius) {
    gameState.ball.y = ballRadius;
    gameState.ball.dy = Math.abs(gameState.ball.dy);
  } else if (gameState.ball.y >= canvasHeight - ballRadius) {
    gameState.ball.y = canvasHeight - ballRadius;
    gameState.ball.dy = -Math.abs(gameState.ball.dy);
  }

  // Colisión con paleta del jugador 1 (izquierda)
  if (
    gameState.ball.dx < 0 &&
    gameState.ball.x - ballRadius <= gameState.player1.x + paddleWidth &&
    gameState.ball.x + ballRadius >= gameState.player1.x &&
    gameState.ball.y + ballRadius >= gameState.player1.y &&
    gameState.ball.y - ballRadius <= gameState.player1.y + paddleHeight
  ) {
    gameState.ball.x = gameState.player1.x + paddleWidth + ballRadius;
    let newSpeed = Math.abs(gameState.ball.dx);
    if (newSpeed < MAX_SPEED) {
      newSpeed = Math.min(newSpeed + SPEED_INCREMENT, MAX_SPEED);
    }
    gameState.ball.dx = newSpeed;
  }

  // Colisión con paleta del jugador 2 (derecha)
  if (
    gameState.ball.dx > 0 &&
    gameState.ball.x + ballRadius >= gameState.player2.x &&
    gameState.ball.x - ballRadius <= gameState.player2.x + paddleWidth &&
    gameState.ball.y + ballRadius >= gameState.player2.y &&
    gameState.ball.y - ballRadius <= gameState.player2.y + paddleHeight
  ) {
    gameState.ball.x = gameState.player2.x - ballRadius;
    let newSpeed = Math.abs(gameState.ball.dx);
    if (newSpeed < MAX_SPEED) {
      newSpeed = Math.min(newSpeed + SPEED_INCREMENT, MAX_SPEED);
    }
    gameState.ball.dx = -newSpeed;
  }

  // Puntuación — la pelota debe salir completamente del campo
  if (gameState.ball.x + ballRadius < 0) {
    gameState.score.player2++;
    resetBall();
  } else if (gameState.ball.x - ballRadius > canvasWidth) {
    gameState.score.player1++;
    resetBall();
  }

  // Enviar el estado del juego a todos los clientes conectados
  io.sockets.emit("gameState", gameState);
}

//* Lógica de Sockets

function handleConnection(socket) {
  console.log("Nuevo jugador conectado:", socket.id);

  // Asignar jugador
  playerQueue.push(socket.id);
  let playerNumber = playerQueue.indexOf(socket.id) + 1;
  players[socket.id] = playerNumber;

  socket.emit("playerNumber", playerNumber);

  // Desconexión
  socket.on("disconnect", () => {
    console.log("Jugador desconectado:", socket.id);
    const index = playerQueue.indexOf(socket.id);
    if (index > -1) {
      playerQueue.splice(index, 1);
    }
    delete players[socket.id];
  });

  // Movimiento de paleta — validar y fijar posición en el servidor
  socket.on("paddleMove", (data) => {
    const y = Number(data.y);
    if (!Number.isFinite(y)) return;
    const clampedY = Math.max(0, Math.min(canvasHeight - paddleHeight, y));

    if (players[socket.id] === 1) {
      gameState.player1.y = clampedY;
    } else if (players[socket.id] === 2) {
      gameState.player2.y = clampedY;
    }
  });
}

//* Inicialización del Juego

export function startGame(socketIoInstance) {
  io = socketIoInstance;

  // Iniciar el Juego a 60 FPS
  setInterval(gameLoop, 1000 / 60);

  // Configurar el listener de conexión de Socket.IO
  io.on("connection", handleConnection);

  console.log("Pong iniciado.");
}
