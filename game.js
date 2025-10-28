//* Constantes y Estado del Juego

const canvasWidth = 600;
const canvasHeight = 400;
const paddleHeight = 80;
const paddleWidth = 10;
const ballRadius = 8;

let gameState = {
    player1: { x: 20, y: canvasHeight / 2 - paddleHeight / 2 },
    player2: { x: canvasWidth - 20 - paddleWidth, y: canvasHeight / 2 - paddleHeight / 2 },
    ball: { 
        x: canvasWidth / 2, 
        y: canvasHeight / 2, 
        dx: 3, 
        dy: 3
    },
    score: { player1: 0, player2: 0 }
};

let players = {};
let playerQueue = []; 
let io; // Referencia global a la instancia de Socket.IO

//* Funciones de Lógica Interna

function resetBall() {
    gameState.ball.x = canvasWidth / 2;
    gameState.ball.y = canvasHeight / 2;
    gameState.ball.dx = Math.random() > 0.5 ? 3 : -3;
    gameState.ball.dy = Math.random() > 0.5 ? 3 : -3;
}

function gameLoop() {
    if (playerQueue.length < 2) return; // No hacer nada si no hay 2 jugadores

    // Mover la pelota
    gameState.ball.x += gameState.ball.dx;
    gameState.ball.y += gameState.ball.dy;

    // Colisiones con paredes
    if (gameState.ball.y + gameState.ball.dy > canvasHeight - ballRadius || 
        gameState.ball.y + gameState.ball.dy < ballRadius) {
        gameState.ball.dy = -gameState.ball.dy;
    }

    // Colisiones con paletas
    if (gameState.ball.x - ballRadius <= gameState.player1.x + paddleWidth && 
        gameState.ball.y > gameState.player1.y && gameState.ball.y < gameState.player1.y + paddleHeight) {
        gameState.ball.dx = -gameState.ball.dx;
    }
    if (gameState.ball.x + ballRadius >= gameState.player2.x &&
        gameState.ball.y > gameState.player2.y && gameState.ball.y < gameState.player2.y + paddleHeight) {
        gameState.ball.dx = -gameState.ball.dx;
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
    io.sockets.emit('gameState', gameState);
}


//* Lógica de Sockets (Manejo de Conexiones y Eventos)

function handleConnection(socket) {
    console.log('Nuevo jugador conectado:', socket.id);

    // Asignar jugador
    playerQueue.push(socket.id);
    let playerNumber = playerQueue.indexOf(socket.id) + 1;
    players[socket.id] = playerNumber;

    socket.emit('playerNumber', playerNumber); 

    // Evento: Desconexión
    socket.on('disconnect', () => {
        console.log('Jugador desconectado:', socket.id);
        const index = playerQueue.indexOf(socket.id);
        if (index > -1) {
            playerQueue.splice(index, 1);
        }
        delete players[socket.id];
    });

    // Evento: Movimiento de paleta
    socket.on('paddleMove', (data) => {
        if (players[socket.id] === 1) {
            gameState.player1.y = data.y;
        } else if (players[socket.id] === 2) {
            gameState.player2.y = data.y;
        }
    });
}


//* Función de Inicialización del Juego

export function startGame(socketIoInstance) {
    io = socketIoInstance;
    
    // Iniciar el Game Loop a 60 FPS
    setInterval(gameLoop, 1000 / 60); 

    // Configurar el listener de conexión de Socket.IO
    io.on('connection', handleConnection);
    
    console.log('Pong iniciado.');
}