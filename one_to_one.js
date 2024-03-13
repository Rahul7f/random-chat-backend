// server.js
const express = require("express");
const http = require("http");
const socketIo = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const PORT = process.env.PORT || 3000;

// Store connected users
let connectedUsers = [];

app.use(express.static("public"));
// Socket.io logic
io.on("connection", (socket) => {
  console.log("New client connected",socket.id);

  // Handle when a user sends a message
  socket.on("message", (data) => {
    console.log("Message received:", data);

    // Broadcast the message to the intended recipient
    socket.to(data.recipient).emit("message", {
      sender: socket.id,
      message: data.message,
    });
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    console.log("Client disconnected");
    // Remove the disconnected user from connectedUsers array
    connectedUsers = connectedUsers.filter((user) => user !== socket.id);
    // Notify the remaining user if their partner left
    if (connectedUsers.length === 1) {
      const remainingUserId = connectedUsers[0];
      console.log("partner left from app");
      io.to(remainingUserId).emit("partnerLeft");
    }
  });


  socket.on("userConnectRequest",(data)=>{
   // Add user to connectedUsers array
   console.log("Adding user to connectedUsers, " + JSON.stringify(data));

   // check if user is already connected

    connectedUsers.push(data);
    // Check if there are enough users for a connection
    if (connectedUsers.length >= 2) {
      // Get the last two users from the connectedUsers array
      const user1 = connectedUsers.pop();
      const user2 = connectedUsers.pop();

      // Emit event to establish connection between the two users
      io.to(user1.id).emit("connectToUser", user2);
      io.to(user2.id).emit("connectToUser", user1);
    }
  })

  // if user  want to exit room
  socket.on("exit", (leftUser) => {
    console.log("partner left check");
    // notifiy other user if there partner left
    io.to(leftUser).emit("partnerLeft");
  });


});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
