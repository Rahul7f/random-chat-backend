// server.js
const express = require("express");
const http = require("http");
const socketIo = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const PORT = process.env.PORT || 3000;

// Socket.io logic
io.on("connection", (socket) => {
  console.log("New client connected");

  // Handle when a user sends a message
  socket.on("message", (data) => {
    console.log("Message received:", data);

    // Broadcast the message to all other connected clients
    socket.broadcast.emit("message", data);
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    console.log("Client disconnected");
  });
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
