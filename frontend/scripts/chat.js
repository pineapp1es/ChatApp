import { io } from "socket.io-client";
const backendBaseURI = "http://localhost:7846"
const header = { "content-type": "application/json"}

// Enable Logging levels by commenting out respective level definitions
console.debug = () => {};
// console.log = () => {};
// console.info = () => {};
// console.warn = () => {};
// console.error = () => {};


// Connect to websocket - should be done while logging in
const port = 7845;
console.debug("Connecting to web socket...");
const socket = io(`http://localhost:${port}`, {
  withCredentials : true
});
console.debug("Connected!");

socket.on('noSession', (data) => {
  window.location.href = "./../pages/login.html";
});

// Object to store all the chat histories for the chat rooms visited by the user.
let chatHistories = {};

const historyDiv = document.getElementById('chatHistory');
const chatRoomDiv = document.getElementById('chatRoomDiv');
const sendMessageForm = document.getElementById('sendMessageForm');
const messageInput = document.getElementById('messageInput');


let lastUpdatedMessageNum = 0;


// Event listener for the submit button that sends the message to server
sendMessageForm.addEventListener('submit', (e) => {
  e.preventDefault();
  sendMessage()
});


document.getElementById('logoutButton').addEventListener('click', async (e) => {
  await logout();
  e.preventDefault();
})


function sendMessage() {

   // let chatRoom = selectedChatRoom
  let chatRoom = "global";
  let message = messageInput.value;

  let data = {
    roomToSendTo: chatRoom,
    content: message,
    messageType: 'text'
  }

  console.log("Sending Message...")
  socket.emit('sendMessage', data);
  messageInput.value = "";
  // Set the history to be scrolled to the bottom when message sends
  historyDiv.scrollTop = historyDiv.scrollHeight - historyDiv.clientHeight;
}

async function logout () {
   const logout = await fetch(backendBaseURI + "/logout", {
     method : "POST",
     credentials : 'include',
     headers: header,
  });

  socket.disconnect();

  window.location.href = "../pages/login.html";
}

// Updates chatHistories object when server sends in update request
socket.on("updateChat", (data) => updateHistoryData(data));




// Function that handles updating the chatHistories object
function updateHistoryData(data) {
  console.debug("Recieved update request. Updating chat history data...");
  chatHistories[data['roomCode']] = data['history'];
  chatHistories[data['roomCode']]['msgStartNum'] = data.numOfFirstLoadedMessage;
  chatHistories[data['roomCode']]['msgEndNum'] = data.numOfLastLoadedMessage;
  console.debug("Done!\n")

  // If the currently selected chat room is the one that was updated, update the visible
  // chat
  // if (selectedChatRoom = data['roomCode']) updateChat();
  updateChat();
}


// Function that handles updating the chat selected and is visible on screen.
function updateChat() {
  console.debug("Updating current chat...");

  // checks if the user has the history scrolled to the bottom.
  // if it is at the bottom, the chat scroll bar stays at the bottom after chat update
  // if not, the chat stays fixed in place without scrolling to the bottom after update
  const isScrolledToBottom = historyDiv.scrollHeight - historyDiv.clientHeight
                             == historyDiv.scrollTop;

  // const roomCode = selectedChatRoom;
  const roomCode = "global";

  if (lastUpdatedMessageNum < chatHistories[roomCode]['msgStartNum'])
     lastUpdatedMessageNum = chatHistories[roomCode]['msgStartNum'] - 1;

  if (!chatHistories[roomCode] || Object.keys(chatHistories[roomCode]).length === 0)
    historyDiv.innerHTML = "";
  const lastMessageInHistoryNum = chatHistories[roomCode]['msgEndNum'];
  for (let i = lastUpdatedMessageNum + 1; i <= lastMessageInHistoryNum; i++) {
    historyDiv.innerHTML = historyDiv.innerHTML + chatHistories[roomCode][i.toString()] + "<br>";
  }

  if (isScrolledToBottom)
    historyDiv.scrollTop = historyDiv.scrollHeight - historyDiv.clientHeight;

  lastUpdatedMessageNum = lastMessageInHistoryNum;
  console.debug("Done!\n")

}
