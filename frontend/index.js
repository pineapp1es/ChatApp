import { io } from "socket.io-client";

const port = 7845
const socket = io(`http://localhost:${port}`)

let chatHistories = {
  "global" : []
};

document.addEventListener("DOMContentLoaded", () => {
  let historyDiv = document.getElementById("history");
  historyDiv.innerHTML = "hello";
  socket.on("message", (msg) => {
      console.log("recieved: " + msg);
      historyDiv.innerHTML = historyDiv.innerHTML + "<br>" + msg;
    })

  document.getElementById("sendMessageForm").addEventListener("submit", (e) => {
    e.preventDefault();
    let msg = document.getElementById("messageInput").value;
    console.log("sending " + msg);
    let payload = {
      roomCode : "global",
      messageData : {
      sender : socket.id,
      date : Date.now(),
      message : msg
      }
    };
    console.log("payload: " + JSON.stringify(payload))
    socket.emit("sendMessage", payload)
  })

  socket.on("test", (data) => {
    console.log(data);
  })
    // historyDiv.innerHTML = historyDiv.innerHTML + "<br>" + "test";
    // console.log(historyDiv.innerHTML)
    // return false;
  socket.on("updateMessages", (data) => {
    historyDiv.innerHTML = "";
    chatHistories[data["roomCode"]] = data["messageData"];
    console.log(chatHistories[data["roomCode"]]);
    for (const msg of chatHistories[data["roomCode"]]) {
      historyDiv.innerHTML += msg + "<br>";
    }

  })
})
