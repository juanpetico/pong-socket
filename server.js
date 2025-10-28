import express from "express";
import http from "http";
import { Server as socketIo } from "socket.io";
import { startGame } from "./game.js";

const app = express();
const server = http.createServer(app);
const io = new socketIo(server);

// Middleware
app.use(express.static("public"));

const PORT = 3000;

server.listen(PORT, () => {
  console.log(`Servidor Pong en http://localhost:${PORT}`);
  startGame(io);
});
