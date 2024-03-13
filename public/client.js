const socket = io();
var statusHeading = document.getElementById("status");
var nameField = document.getElementById("nameInput");
var messageListDiv = document.getElementById("messages");
var messageField = document.getElementById("messageInput");
var sendButton = document.getElementById("sendButton");
var exitButton = document.getElementById("exitUser");
var connectButton = document.getElementById("connect");

var recipient = "";
var recipientName = "";
var currentUserName = "";

socket.on("connect", () => {
  changeStatus("connected");
});
// this will notify if someone is connected
socket.on("connectToUser", (data) => {
  recipient = data.id;
  recipientName = data.name;
  changeStatus(data.name + " connected");
});
socket.on("partnerLeft", () => {
  changeStatus("Partner left");
});

// Receive message from server and display it
socket.on("message", (data) => {
  addMessageInlist(data.message, recipientName);
});

// Function to send message to server
function sendMessage() {
  const message = messageField.value.trim();
  if (message !== "") {
    socket.emit("message", {
      recipient: recipient,
      message: message,
      sender: socket.id,
    });
    addMessageInlist(message, currentUserName);
    messageInput.value = "";
  }
}

// Function to send message to server
function exitUser() {}

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

// Attach click event listener to the exit button
exitButton.addEventListener("click", function () {
  console.log("exit");
  socket.emit("exit", recipient);
});

// Attach click event listener to connect button

connectButton.addEventListener("click", function () {
  console.log("connect clicked");
  const messageInput = nameField.value.trim();
  console.log(messageInput == "", messageInput);
  if (messageInput == "") {
    alert("Enter Name");
    return;
  }
  socket.emit("userConnectRequest", { id: socket.id, name: messageInput });
  changeStatus("finding User...");
  currentUserName = messageInput;
  nameField.value = "";
  nameField.style.visibility = "hidden";
  connectButton.style.visibility = "hidden";
});

function changeStatus(status) {
  statusHeading.innerText = status;
}

function addMessageInlist(message, sender) {
  messageListDiv.innerHTML += `<p><strong>${sender}:</strong> ${message}</p>`;
  messageListDiv.scrollTop = messageListDiv.scrollHeight;
}
