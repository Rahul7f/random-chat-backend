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
  socket.emit("exit", selfUserObject);
  connectedUserObject = null;
}

//calling resize as without this the screen will collapse in windows browser
resize();





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
  console.log("connected to server");
  // Retrieving data:
  let text = localStorage.getItem("userdata");
  let userObject = null;
  console.log
  if (text) {
    console.log("Data found in localstorage");
    userObject = JSON.parse(text);
    userObject.random=false;
  } else {
    console.log("No data found in localstorage");
    userObject = {
      name: "Stranger", gender: null, interest: null, random:true,
    };
  }
  userObject.id = socket.id;
  selfUserObject = userObject;
  exitOrConnectButton();

});
// this will notify if someone is connected
socket.on("connectToUser", (data) => {
  console.log("connected to a partner");
  connectedUserObject = data;
  addStatus(data.name + " connected");
});

socket.on("status",(status)=>{
  addStatus(status);
})

socket.on("partnerLeft", (otheruser) => {
  console.log("received partnerLeft from server");
  addStatus("User " + otheruser.name + " left");
  connectedUserObject = null;
  toggleConnectionButton.innerText = "NEW";
  isFindingMatch = false;
});

socket.on("youLeft", () => {
  console.log("received youLeft from server");
  addStatus("You've left the chat");
  connectedUserObject = null;
  toggleConnectionButton.innerText = "NEW";
  isFindingMatch = false;
});

// Receive message from server and display it
socket.on("message", (data) => {
  addMessage(connectedUserObject.name, data.message, false);
});


function exitOrConnectButton() {
  console.log("pressed exit or connect button");
  if (connectedUserObject || isFindingMatch) {
    exitChat();
    toggleConnectionButton.innerText = "New";
    isNewButtonPressed = false;
  }
  else if (connectedUserObject == null && !isFindingMatch) {
    isNewButtonPressed = true;
    connectChat();
    toggleConnectionButton.innerText = "ESC";
  }
}

// Function to send message to server
function sendMessage() {
  const message = messageField.value.trim();
  if (message !== "" && connectedUserObject != null) {
    socket.emit("message", {
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
  showMessage("COMING SOON!");
});

let isFindingMatch = false;
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

function onPrefUpdate(cb) {
  selfUserObject.random = !cb.checked;
}

function connectChat() {
  console.log("userConnectRequest Called");
  //messageListDiv.innerHTML = "";
  isFindingMatch=true;
  socket.emit("userConnectRequest", selfUserObject);
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
  showMessage(status);
  const statusContainer = document.createElement("div");
  statusContainer.setAttribute("style", "text-align: center; align-self: center;");
  const strongElement = document.createElement("strong");
  strongElement.innerText = status;
  strongElement.setAttribute("style", "margin: auto; width: fit-content;");
  statusContainer.appendChild(strongElement);
  messageListDiv.appendChild(statusContainer);
  messageListDiv.scrollTop = messageListDiv.scrollHeight;
}


function addPreferenceCheckbox() {

  const checkboxContainer = document.createElement("div");
  checkboxContainer.setAttribute("style", "text-align: center; align-self: center;");


  if (selfUserObject.interest && selfUserObject.gender) {
    const checkbox = document.createElement("input");
    checkbox.setAttribute("type", "checkbox");
    checkbox.setAttribute("id", "matchingPrefs");
    checkbox.setAttribute("onclick", "onPrefUpdate(this);");

    const checkBoxText = document.createElement("strong");
    checkBoxText.innerText = " Match using Interests?";

    checkboxContainer.appendChild(checkbox);
    checkboxContainer.appendChild(checkBoxText);
  } else {
    const updateInterest = document.createElement("a")
    updateInterest.setAttribute("href", "/");
    updateInterest.innerText = "Update interests to use matchmaking"
    checkboxContainer.appendChild(updateInterest);
  }

  messageListDiv.appendChild(checkboxContainer);
}

//exception handling callbacks
//need to store the socket id in case if the page refreshes or the server reconnects this can be helpful
socket.on('connect_error', err => handleErrors("connect_error", err))
socket.on('connect_failed', err => handleErrors("connect_failed", err))
socket.on('disconnect', err => handleErrors("disconnect", err))

function handleErrors(event, err) {
  console.log("error occured on ", event, err);
}