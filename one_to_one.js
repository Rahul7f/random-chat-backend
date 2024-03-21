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
let waitingQueueForMales = []
let waitingQueueForFemales = []
let waitingQueueForOthers = []


function addToListAccordingToGender(userObject) {
  switch (userObject.gender) {
    case "male":
      waitingQueueForMales.push(userObject);
      break;
    case "female":
      waitingQueueForFemales.push(userObject);
      break;
    case "other":
      waitingQueueForOthers.push(userObject);
      break;
  }
}

function findBasedonInterest(userObject) {
  switch (userObject.interest) {
    case "male":
      return lookInGivenQueue(waitingQueueForMales, userObject);
    case "female":
      return lookInGivenQueue(waitingQueueForFemales, userObject);
    case "other":
      return lookInGivenQueue(waitingQueueForOthers, userObject);
  }
  return null;
}

function lookInGivenQueue(queue, user) {
  for (let i = 0; i < queue.length; i++) {
    let partner = queue[i];
    //conditions to find match if this satisfied then match is found
    //respecting the interest of user
    if (user.interest == partner.gender
      //respecting interest of other partner
      && partner.interest == user.gender
      //avoiding connecting user to self if both gender and interest are same
      && user.id != partner.id) {
      queue.splice(i, 1);
      //als
      return partner;
    }
  }
  return null;
}


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

  socket.on("debug", (data) => {
    console.log(data);
  });

  // Handle disconnection
  socket.on("disconnect", (data) => {
    console.log("Disconnect", data);

  });

  socket.on("userConnectRequestwithInterest", (userObject) => {

    // Find a compatible partner based on interests
    const compatiblePartner = findBasedonInterest(userObject);

    if (compatiblePartner) {

      // Emit event to establish connection between the two users
      io.to(userObject.id).emit("connectToUser", compatiblePartner);
      io.to(compatiblePartner.id).emit("connectToUser", userObject);

    } else {

      //added to list so that someone with compatiability picks up from list
      addToListAccordingToGender(userObject);

    }

  })

  socket.on("userConnectRequest", (userObject) => {

    // Add user to connectedUsers array
    console.log("Adding user to connectedUsers, " + JSON.stringify(userObject));

    waitingQueue.push(userObject);

    // console.log("now all users in list are ", waitingQueue);

    // Check if there are enough users for a connection
    if (waitingQueue.length >= 2) {

      const user1 = waitingQueue.shift();
      const user2 = waitingQueue.shift();

      // Emit event to establish connection between the two users
      io.to(user1.id).emit("connectToUser", user2);
      io.to(user2.id).emit("connectToUser", user1);

      console.log("random matchmaking");
    }


  });

  // if user  want to exit room
  socket.on("exit", (exitingUser, partnerOfExitingUser) => {
    console.log("exit called from user ", JSON.stringify(exitingUser), " for user ", JSON.stringify(partnerOfExitingUser));

    if (partnerOfExitingUser)
      // Notify other user if their partner left
      io.to(partnerOfExitingUser.id).emit("partnerLeft", exitingUser);

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


server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
