const socket = io();
var statusHeading = document.getElementById("status");
var nameField = document.getElementById("nameInput");
var messageListDiv = document.getElementById("messages");
var messageField = document.getElementById("messageInput");
var sendButton = document.getElementById("sendButton");
var toggleConnectionButton = document.getElementById("esc");
var camera = document.getElementById("camera");

var recipient = "";
var recipientName = "";
var currentUserName = "";

// if user close tab, then exit the user session
window.addEventListener("beforeunload", function (e) {
  console.log("exit");
  socket.emit("exit", recipient);
});

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
  addMessage(recipientName, data.message, false);
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
    addMessage("You", message, true);
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
sendButton.addEventListener("sendButton", function () {

  console.log("sendButton clicked");
  sendMessage();
});

// Attach click event listener to the send button
camera.addEventListener("camera", function () {
  console.log("sendButton clicked");
  Toastify({
    text: "This is a toast",
    duration: 3000,
    destination: "https://github.com/apvarun/toastify-js",
    newWindow: true,
    close: true,
    gravity: "top", // `top` or `bottom`
    position: "left", // `left`, `center` or `right`
    stopOnFocus: true, // Prevents dismissing of toast on hover
    style: {
      background: "linear-gradient(to right, #00b09b, #96c93d)",
    },
    onClick: function () {}, // Callback after click
  }).showToast();
  
});

// Attach click event listener to the exit button
toggleConnectionButton.addEventListener("esc", function () {
  console.log("exit");
  socket.emit("exit", recipient);
});

function connect(user) {
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
}

function changeStatus(status) {
  statusHeading.innerText = status;
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
  document.getElementById("messages").appendChild(messageContainer);
}