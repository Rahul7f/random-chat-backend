const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
var path = require("path");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();
app.use(cors({ origin: 'https://strangerchat.fun' }))
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
    if (user.interest === partner.gender
      //respecting interest of other partner
      && partner.interest === user.gender
      //avoiding connecting user to self if both gender and interest are same
      && user.id !== partner.id) {
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

app.get("/terms", (req, res) => {
  res.sendFile(path.join(__dirname, "public/html", "terms.html"));
});
app.get("/policy", (req, res) => {
  res.sendFile(path.join(__dirname, "public/html", "policy.html"));
});
app.get("/guideline", (req, res) => {
  res.sendFile(path.join(__dirname, "public/html", "guideline.html"));
});

app.get("/comingsoon", (req, res) => {
  res.sendFile(path.join(__dirname, "public/html", "comingsoon.html"));
});



// Socket.io logic
io.on("connection", (socket) => {
  var isConnected=false;
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

  socket.on("isConnected",(status)=>{
    isConnected=status;
    clearTimer();
  });

  socket.on("debug", (data) => {
    console.log(data);
  });

  // Handle disconnection
  socket.on("disconnect", (data) => {
    isConnected=false;
    console.log("Disconnect", data);

  });

  socket.on("userConnectRequest", (userObject) => {
    isConnected=false;
    clearTimer();
    console.log("received find user request from ",JSON.stringify(userObject));
    if (!userObject.random && userObject.gender && userObject.interest) {
      connectWithInterest(socket,userObject);
      setTimer(5000, () => {
        if (!isConnected) {
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
  socket.on("exit", (exitingUser, partnerOfExitingUser) => {
    isConnected=false;
    clearTimer();
    console.log("exit called from user ", JSON.stringify(exitingUser));

    if (partnerOfExitingUser)
      // Notify other user if their partner left
      io.to(partnerOfExitingUser.id).emit("partnerLeft", exitingUser);

    // Find the index of the exiting user in the waitingQueue array
    var index = waitingQueue.findIndex(user => user.id === exitingUser.id);

    // Remove the exiting user from waitingQueue if found
    if (index > -1) {
      waitingQueue.splice(index, 1); // Remove one item from the array
    }

    // if(exitingUser.gender)
      deleteUserFromGenderLists(exitingUser);
    

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

function sendStatus(socket,status){
  socket.emit("status",status);
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
  io.to(userObject.id).emit("connectToUser", compatiblePartner);
  io.to(compatiblePartner.id).emit("connectToUser", userObject);
}

//deletes user from gender preference lists if added
function deleteUserFromGenderLists(exitingUser){
  var index=null;
  console.log("exiting user",exitingUser);
  switch (exitingUser.gender) {
    case "male":
      index = waitingQueueForMales.findIndex(user => user.id === exitingUser.id);
      if (index > -1) {
        waitingQueueForMales.splice(index, 1);
      }
      break;
    case "female":
      index = waitingQueueForFemales.findIndex(user => user.id === exitingUser.id);
      if (index > -1) {
        waitingQueueForFemales.splice(index, 1); // Remove one item from the array
      }
      break;
    case "other":
      index = waitingQueueForOthers.findIndex(user => user.id === exitingUser.id);
      if (index > -1) {
        waitingQueueForOthers.splice(index, 1); // Remove one item from the array
      }
      break;
  }
}


server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
