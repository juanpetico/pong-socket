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

  // Colisiones con paredes
  if (
    gameState.ball.y + gameState.ball.dy > canvasHeight - ballRadius ||
    gameState.ball.y + gameState.ball.dy < ballRadius
  ) {
    gameState.ball.dy = -gameState.ball.dy;
  }

  // Colisiones con paletas
  if (
    gameState.ball.x - ballRadius <= gameState.player1.x + paddleWidth &&
    gameState.ball.y > gameState.player1.y &&
    gameState.ball.y < gameState.player1.y + paddleHeight
  ) {
    let newDx = -gameState.ball.dx;

    if (Math.abs(newDx) < MAX_SPEED) {
      newDx += (newDx > 0 ? SPEED_INCREMENT : -SPEED_INCREMENT); 
    }
    gameState.ball.dx = newDx;
  }

  if (
    gameState.ball.x + ballRadius >= gameState.player2.x &&
    gameState.ball.y > gameState.player2.y &&
    gameState.ball.y < gameState.player2.y + paddleHeight
  ) {
    let newDx = -gameState.ball.dx;

    if (Math.abs(newDx) < MAX_SPEED) {
      newDx += (newDx > 0 ? SPEED_INCREMENT : -SPEED_INCREMENT); 
    }
    gameState.ball.dx = newDx;
  }

  // Puntuación
  if (gameState.ball.x < 0) {
    gameState.score.player2++;
    resetBall();
  } else if (gameState.ball.x > canvasWidth) {
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

  // Movimiento de paleta
  socket.on("paddleMove", (data) => {
    if (players[socket.id] === 1) {
      gameState.player1.y = data.y;
    } else if (players[socket.id] === 2) {
      gameState.player2.y = data.y;
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
