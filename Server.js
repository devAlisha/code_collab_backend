
const express = require("express");
const app = express();
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const server = http.createServer(app);
const io = new Server(server);
server.listen(8000, () => {
  console.log(`listening on port 8000`);
});

const userSocketMap = {};

function getAllConnectedClients(roomId) {
  const room = io.sockets.adapter.rooms.get(roomId);
  if (!room) {
    return [];
  }

  return Array.from(room).map((socketId) => ({
    socketId,
    username: userSocketMap[socketId],
  }));
}
io.on("connection", (socket) => {
  console.log(`A new socket connected ${socket.id}`);
  socket.on("join-room", ({ roomId, username }) => {
    console.log(`User ${username} joined room ${roomId}`);
    userSocketMap[socket.id] = username;
    socket.join(roomId);
    const clients = getAllConnectedClients(roomId);
    clients.forEach(({ socketId }) => {
      io.to(socketId).emit("new-user", {
        clients,
        username,
        socketId: socket.id,
      });
    });
    socket.on("code-change", ({code , roomId }) => {
      socket.broadcast .emit("code-change", { code });
    });
    
       
    console.log(clients);
    socket.on("code-sync", ({ code, socketId }) => {
      socket.broadcast.to(socketId).emit("code-sync", { code });
    });

    socket.on("disconnect", () => {
      const rooms = [...(io.sockets.adapter.rooms.get(roomId) || [])];
      rooms.forEach((roomId) => {
        socket
          .in(roomId)
          .emit("user-disconnected", {
            socketId: socket.id,
            username: userSocketMap[socket.id],
          });
      });
      delete userSocketMap[socket.id];
      socket.leave();
    });
  });
});
