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
const connectionList = {};

function addInConnList(user1, user2) {
  connectionList[user1.id] = user2.id;
  connectionList[user2.id] = user1.id;
}

function removeFromConnList(user) {
  delete connectionList[getConnectedPartnerId(user)];
  delete connectionList[user.id];
}

function getConnectedPartnerId(user) {
  return connectionList[user.id]?connectionList[user.id]:null;
}

function sendStatus(socket,status){
  socket.emit("status",status);
}

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
  sendStatus(socket,"connected to server");
  console.log("New client connected", socket.id);

  // Handle when a user sends a message
  socket.on("message", (data) => {
    console.log("Message received:", data);
    // Broadcast the message to the intended recipient
    socket.to(getConnectedPartnerId(socket)).emit("message", {
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

  socket.on("userConnectRequest", (userObject) => {

    console.log("received find user request from ",JSON.stringify(userObject));
    if (!userObject.random && userObject.gender && userObject.interest) {
      connectWithInterest(socket,userObject);
      setTimer(5000, () => {
        if (!getConnectedPartnerId(userObject)) {
          deleteUserFromGenderLists(userObject);
          sendStatus(socket,"cant find match");
          connectWithoutInterest(socket,userObject);
        }
      });

    } else {
      connectWithoutInterest(socket,userObject);
    }
  });


  // if user  want to exit room
  socket.on("exit", (exitingUser) => {
    console.log("exit called from user ", JSON.stringify(exitingUser));
    clearTimer();
    socket.emit("youLeft");
    if (getConnectedPartnerId(exitingUser)){
      // Notify other user if their partner left
      io.to(getConnectedPartnerId(exitingUser)).emit("partnerLeft", exitingUser);
    }
    // Find the index of the exiting user in the waitingQueue array
    var index = waitingQueue.findIndex(user => user.id === exitingUser.id);
    // Remove the exiting user from waitingQueue if found
    if (index > -1) {
      waitingQueue.splice(index, 1); // Remove one item from the array
    }
    
    if(exitingUser.gender)
      deleteUserFromGenderLists(exitingUser);
    removeFromConnList(exitingUser);

  });

  let timeoutId = null;
  function setTimer(duration, callback) {
    timeoutId = setTimeout(callback, duration);
  }

  function clearTimer() {
    if (timeoutId)
      clearTimeout(timeoutId);
  }

});

function connectWithoutInterest(socket,userObject) {
  sendStatus(socket,"finding random match");
  waitingQueue.push(userObject);

  // console.log("now all users in list are ", waitingQueue);
  // Check if there are enough users for a connection
  if (waitingQueue.length >= 2) {

    const user1 = waitingQueue.shift();
    const user2 = waitingQueue.shift();

    emitConnection(user1, user2);
  }
}

function connectWithInterest(socket,userObject) {
  sendStatus(socket,"finding user as per your interests");
  const compatiblePartner = findBasedonInterest(userObject);

  if (compatiblePartner) {

    // Emit event to establish connection between the two users
    emitConnection(userObject, compatiblePartner);

  } else {

    //added to list so that someone with compatiability picks up from list
    addToListAccordingToGender(userObject);

  }
}

function emitConnection(userObject, compatiblePartner) {
  addInConnList(userObject, compatiblePartner);
  //prevent sharing partner socket id to user
  const userId = userObject.id;
  const partnerId = compatiblePartner.id;
  delete userObject.id;
  delete compatiblePartner.id;

  io.to(userId).emit("connectToUser", compatiblePartner);
  io.to(partnerId).emit("connectToUser", userObject);
}

//deletes user from gender preference lists if added
//this function will be executed when a user does not find match within given time
//also this executes if user cancels the matchmaking process
function deleteUserFromGenderLists(removedUser) {
  var index = null;
  switch (removedUser.gender) {
    case "male":
      index = waitingQueueForMales.findIndex(user => user.id === removedUser.id);
      if (index > -1) {
        waitingQueueForMales.splice(index, 1);
      }
      break;
    case "female":
      index = waitingQueueForFemales.findIndex(user => user.id === removedUser.id);
      if (index > -1) {
        waitingQueueForFemales.splice(index, 1); // Remove one item from the array
      }
      break;
    case "other":
      index = waitingQueueForOthers.findIndex(user => user.id === removedUser.id);
      if (index > -1) {
        waitingQueueForOthers.splice(index, 1); // Remove one item from the array
      }
      break;
  }
}


server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
