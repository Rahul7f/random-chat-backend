// server.js
const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
var path = require("path");
const bodyParser = require("body-parser");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const PORT = process.env.PORT || 3000;

// Store connected users
let waitingQueue = [];

app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public/html", "index.html"));
});

app.get("/chat", (req, res) => {
  res.sendFile(path.join(__dirname, "public/html", "chat.html"));
});

// Socket.io logic
io.on("connection", (socket) => {
  console.log("New client connected", socket.id);

  // Handle when a user sends a message
  socket.on("message", (data) => {
    console.log("Message received:", data);
    // Broadcast the message to the intended recipient
    socket.to(data.recipientId).emit("message", {
      senderId: socket.id,
      message: data.message,
    });
  });

  // Handle disconnection
  socket.on("disconnect", (data) => {
    console.log("Disconnect", data);

  });

  socket.on("userConnectRequest", (data) => {

    // Add user to connectedUsers array
    console.log("Adding user to connectedUsers, " + JSON.stringify(data));

    waitingQueue.push(data);

    console.log("now all users in list are ",waitingQueue);

    // Find a compatible partner based on interests
    const compatiblePartner = findCompatiblePartner(data);

    if (false) {
      // Emit event to establish connection between the two users
      io.to(data.id).emit("connectToUser", compatiblePartner);
      io.to(compatiblePartner.id).emit("connectToUser", data);

      // Remove both users from connectedUsers array
      waitingQueue = waitingQueue.filter( (user) => user.id !== data.id && user.id !== compatiblePartner.id  );
      console.log("compatiable matchmaking");
    }else{
      // Check if there are enough users for a connection
      if (waitingQueue.length >= 2) {

        const user1 = waitingQueue.shift();
        const user2 = waitingQueue.shift();

        // Emit event to establish connection between the two users
        io.to(user1.id).emit("connectToUser", user2);
        io.to(user2.id).emit("connectToUser", user1);

        console.log("random matchmaking");
      }
    }

  });

  // if user  want to exit room
  socket.on("exit", (exitingUser, partnerOfExitingUser) => {
    console.log("exit called from user ", JSON.stringify(exitingUser), " for user ", JSON.stringify(partnerOfExitingUser));
    
    if(partnerOfExitingUser)
    // Notify other user if their partner left
    io.to(partnerOfExitingUser.id).emit("partnerLeft",exitingUser);
  
    console.log('List before deleting ', waitingQueue);
    
    // Find the index of the exiting user in the waitingQueue array
    const index = waitingQueue.findIndex(user => user.id === exitingUser.id);
    console.log('Index of exiting user:', index);
    
    // Remove the exiting user from waitingQueue if found
    if (index > -1) {
      waitingQueue.splice(index, 1); // Remove one item from the array
    }
  });

});

function findCompatiblePartner(newUser) {
  for (const user of waitingQueue) {
    if (user.interest === newUser.gender && newUser.interest === user.gender
      && user.interest!=null && user.gender !=null && newUser.interest != null && newUser.gender != null
      ) {
      return user;
    }
  }

  return null; // No compatible partner found return any 
}

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
