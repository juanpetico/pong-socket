//* Conectar al servidor
const socket = io();

//* Elementos del DOM
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const playerNumberDisplay = document.getElementById('player-number');
const score1Display = document.getElementById('score-1');
const score2Display = document.getElementById('score-2');

let myPlayerNumber;
let localPaddleY;
const paddleHeight = 80;

//* Recibir el número de jugador asignado por el servidor
socket.on('playerNumber', (num) => {
    myPlayerNumber = num;
    playerNumberDisplay.textContent = myPlayerNumber;
    console.log(`Eres el jugador: ${myPlayerNumber}`);
});

//* Recibir el estado del juego desde el servidor 
socket.on('gameState', (gameState) => {
    // Borra el canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height); 

    // Dibuja la pelota
    drawBall(gameState.ball);
    
    // Dibuja las paletas
    drawPaddle(gameState.player1);
    drawPaddle(gameState.player2);

    // Actualiza la puntuación
    score1Display.textContent = gameState.score.player1;
    score2Display.textContent = gameState.score.player2;
});

//* Evento para mover la paleta con el ratón
canvas.addEventListener('mousemove', (event) => {
    // Calcula la nueva posición y la limita al canvas
    localPaddleY = event.offsetY - paddleHeight / 2;
    if (localPaddleY < 0) localPaddleY = 0;
    if (localPaddleY > canvas.height - paddleHeight) localPaddleY = canvas.height - paddleHeight;
    
    // Envía la nueva posición de la paleta al servidor
    socket.emit('paddleMove', { y: localPaddleY });
});

//* Funciones de dibujo
function drawBall(ball) {
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, 8, 0, Math.PI * 2);
    ctx.fillStyle = 'white';
    ctx.fill();
    ctx.closePath();
}

function drawPaddle(paddle) {
    ctx.fillStyle = 'white';
    ctx.fillRect(paddle.x, paddle.y, 10, paddleHeight);
}