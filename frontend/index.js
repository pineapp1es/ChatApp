import { io } from "socket.io-client";

localStorage.setItem('username', 'pineapple')

const port = 7845;
console.debug("Connecting to web socket...");
const socket = io(`http://localhost:${port}`, {
  extraHeaders : {
    username : localStorage.getItem('username')
  }
});
console.debug("Connected!");

let chatHistories = {};

const historyDiv = document.getElementById('historyDiv');
const chatRoomDiv = document.getElementById('chatRoomDiv');
const sendMessageForm = document.getElementById('sendMessageForm');
const messageInput = document.getElementById('messageInput');



sendMessageForm.addEventListener('submit', (e) => {
  e.preventDefault();
  sendMessage()
});


socket.on("updateChat", (data) => updateHistoryData(data));


function sendMessage() {

   // let chatRoom = selectedChatRoom
  let chatRoom = "global";
  let sender = localStorage.getItem('username');
  let message = messageInput.value;
  let epochTime = Date.now();

  let data = {
    roomCode : chatRoom,
    messageData : {
      sender : sender,
      epochTime : epochTime,
      message : message
    }
  }

  console.log("Sending Message...")
  socket.emit('sendMessage', data);
}


function updateHistoryData(data) {
  console.debug("Recieved update request. Updating chat history data...");
  chatHistories[data['roomCode']] = data['history'];
  chatHistories[data['roomCode']]['msgStartNum'] = data['msgStartNum'];
  chatHistories[data['roomCode']]['msgEndNum'] = data['msgEndNum'];
  console.debug("Done!\n")

  // if (selectedChatRoom = data['roomCode']) updateChat();
  updateChat();
}


function updateChat() {
  console.debug("Updating current chat...");

  // let roomCode = selectedChatRoom;
  let roomCode = "global";
  // let lastUpdatedMessage = getLastUpdatedMessage;
  let lastUpdatedMessageNum = chatHistories[roomCode]['msgStartNum'];
  let lastMessageInHistoryNum = chatHistories[roomCode]['msgEndNum'];
  for (let i = lastUpdatedMessageNum; i <= lastMessageInHistoryNum; i++) {
    historyDiv.innerHTML = historyDiv.innerHTML + chatHistories[roomCode][i.toString()] + "<br>";
  }

  console.debug("Done!\n")
}


// document.addEventListener("DOMContentLoaded", () => {
//   let historyDiv = document.getElementById("history");
//   historyDiv.innerHTML = "hello";
//   socket.on("message", (msg) => {
//       console.log("recieved: " + msg);
//       historyDiv.innerHTML = historyDiv.innerHTML + "<br>" + msg;
//     })

//   document.getElementById("sendMessageForm").addEventListener("submit", (e) => {
//     e.preventDefault();
//     let msg = document.getElementById("messageInput").value;
//     console.log("sending " + msg);
//     let payload = {
//       roomCode : "global",
//       messageData : {
//       sender : socket.id,
//       date : Date.now(),
//       message : msg
//       }
//     };
//     console.log("payload: " + JSON.stringify(payload))
//     socket.emit("sendMessage", payload)
//   })

//   socket.on("test", (data) => {
//     console.log(data);
//   })
//     // historyDiv.innerHTML = historyDiv.innerHTML + "<br>" + "test";
//     // console.log(historyDiv.innerHTML)
//     // return false;
//   socket.on("updateMessages", (data) => {
//     historyDiv.innerHTML = "";
//     chatHistories[data["roomCode"]] = data["messageData"];
//     console.log(chatHistories[data["roomCode"]]);
//     for (const msg of chatHistories[data["roomCode"]]) {
//       historyDiv.innerHTML += msg + "<br>";
//     }

//   })
// })
