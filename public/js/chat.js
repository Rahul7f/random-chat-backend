const socket = io();
// var statusHeading = document.getElementById("status");
var nameField = document.getElementById("nameInput");
var messageListDiv = document.getElementById("messages");
var messageField = document.getElementById("messageInput");
var sendButton = document.getElementById("sendButton");
var toggleConnectionButton = document.getElementById("esc");
var camera = document.getElementById("camera");
var centerDiv = document.getElementById("center");
var body = document.getElementById("body");
var connectedUserObject = null;
var selfUserObject = null;

// if user close tab, then exit the user session
window.addEventListener("beforeunload", function (e) {
  exitChat();
});

function exitChat() {
  console.log("exitChat called");
  socket.emit("exit", selfUserObject, connectedUserObject);
  connectedUserObject = null;
  addStatus("You've exited the chat");
}

//calling resize as without this the screen will collapse in windows browser
resize();

let timeoutId=null;
function asyncTimer(duration, callback) {
  timeoutId=setTimeout(callback, duration);
}

function clearTimeoutCallback(){
  if(timeoutId)
    clearTimeout(timeoutId);
}

// Example usage:
// console.log("Starting async timer...");
// asyncTimer(3000, () => {
//   console.log("Async timer completed after 3 seconds.");
// });

// Attach an event listener to the window resize event
window.addEventListener("resize", function () {
  // Call checkScreenType() when the window is resized
  resize();
});

//this will send debug message to be printed on nodejs server
function debug(msg) {
  socket.emit("debug", msg);
}


function resize() {
  //reinitializing 100% as changing orientation cause instable innerHeight and innerWidth without this
  body.style.height = "100%";
  body.style.width = "100%";

  //getting innerHeight and innerWidth to assign it to body
  var windowHeight = window.innerHeight;
  var windowWidth = window.innerWidth;

  windowHeight += 'px';
  windowWidth += 'px';
  body.style.height = windowHeight;
  body.style.width = windowWidth;
}


socket.on("connect", () => {
  console.log("connected");
  addStatus("connected to server");

  // Retrieving data:
  let text = localStorage.getItem("userdata");
  let userObject = null;
  console.log
  if (text) {
    console.log("Data found in localstorage");
    userObject = JSON.parse(text);

  } else {
    console.log("No data found in localstorage");
    userObject = {
      name: "Stranger", gender: null, interest: null
    };
  }
  userObject.id = socket.id;
  selfUserObject = userObject;
  exitOrConnectButton();

});
// this will notify if someone is connected
socket.on("connectToUser", (data) => {
  clearTimeoutCallback();
  connectedUserObject = data;
  addStatus(data.name + " connected");
});

socket.on("partnerLeft", (otheruser) => {
  addStatus("user " + otheruser.name + " left");
  connectedUserObject = null;
  toggleConnectionButton.innerText = "NEW";
  isNewButtonPressed = false;
});

// Receive message from server and display it
socket.on("message", (data) => {
  addMessage(connectedUserObject.name, data.message, false);
});


function exitOrConnectButton() {
  clearTimeoutCallback();
  if (connectedUserObject || (connectedUserObject == null && isNewButtonPressed)) {
    exitChat();
    toggleConnectionButton.innerText = "New";
    isNewButtonPressed = false;
  }
  else if (connectedUserObject == null && !isNewButtonPressed) {
    isNewButtonPressed = true;
    isUsingPreferenceForMatching = true;
    connectChat();
    toggleConnectionButton.innerText = "ESC";
  }
}

// Function to send message to server
function sendMessage() {
  const message = messageField.value.trim();
  if (message !== "" && connectedUserObject != null) {
    socket.emit("message", {
      recipientId: connectedUserObject.id,
      message: message,
    });
    addMessage(selfUserObject.name, message, true);
    messageInput.value = "";
  }
}

// Function to handle pressing Enter key to send message
try {
  messageField.addEventListener("keyup", function (event) {
    if (event.key === "Enter") {
      sendMessage();
    }
  });
} catch (e) {
  console.log("error", e);
}

// Attach click event listener to the send button
sendButton.addEventListener("click", function () {
  console.log("sendButton clicked");
  sendMessage();
});

// Attach click event listener to the send button
camera.addEventListener("click", function () {
  showMessage("COMMING SOON! ");
});

let isNewButtonPressed = false;
// Attach click event listener to the exit button
toggleConnectionButton.addEventListener("click", function () {
  exitOrConnectButton();
});

function showMessage(recipient) {
  Toastify({
    text: recipient,
    duration: 3000,
    destination: "https://github.com/apvarun/toastify-js",
    newWindow: true,

    gravity: "top", // `top` or `bottom`
    position: "right", // `left`, `center` or `right`
    stopOnFocus: true, // Prevents dismissing of toast on hover
    style: {
      background: "#32CD32",
    },
    onClick: function () { }, // Callback after click
  }).showToast();
}

let isUsingPreferenceForMatching = true;

function connectChat() {
  console.log("userConnectRequest Called");
  if (isUsingPreferenceForMatching && selfUserObject.gender && selfUserObject.interest) {
    socket.emit("userConnectRequestwithInterest", selfUserObject);
    addStatus("waiting for user as per your preference");
    asyncTimer(5000, () => {
      if (!connectedUserObject) {
        socket.emit("removeMeFromInterestMatchmaking", selfUserObject);
        addStatus("unable to find your match trying in random matching")
        isUsingPreferenceForMatching = false;
        connectChat();
      }
    })
  } else {
    socket.emit("userConnectRequest", selfUserObject);
    addStatus("waiting for user");
  }
  // currentUserName = messageInput; kyo h ye line?
}


function addMessage(name, text, isSelf) {
  const messageContainer = document.createElement("div");
  messageContainer.className = "message-container";

  const message = document.createElement("div");
  message.className = isSelf ? "selfmessage" : "othermessage";

  const strongElement = document.createElement("strong");
  strongElement.textContent = name;
  strongElement.style.fontSize = "10px";

  const brElement = document.createElement("br");

  const textNode = document.createTextNode(text);

  message.appendChild(strongElement);
  message.appendChild(brElement);
  message.appendChild(textNode);

  messageContainer.appendChild(message);
  messageListDiv.appendChild(messageContainer);
  messageListDiv.scrollTop = messageListDiv.scrollHeight;
}

function addStatus(status) {
  const statusContainer = document.createElement("div");
  statusContainer.setAttribute("style", "text-align: center; align-self: center;");
  const strongElement = document.createElement("strong");
  strongElement.innerText = status;
  strongElement.setAttribute("style", "margin: auto; width: fit-content;");
  statusContainer.appendChild(strongElement);
  messageListDiv.appendChild(statusContainer);
  messageListDiv.scrollTop = messageListDiv.scrollHeight;
}


//exception handling callbacks
//need to store the socket id in case if the page refreshes or the server reconnects this can be helpful
socket.on('connect_error', err => handleErrors("connect_error", err))
socket.on('connect_failed', err => handleErrors("connect_failed", err))
socket.on('disconnect', err => handleErrors("disconnect", err))

function handleErrors(event, err) {
  console.log("error occured on ", event, err);
}