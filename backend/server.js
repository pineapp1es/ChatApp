const express = require('express');
const sio = require('socket.io');
const { createServer } = require('node:http')
const mongodb = require('mongodb')
const cors = require('cors')
require('dotenv').config()

const uri = process.env.URI;
const client =  new mongodb.MongoClient(uri);
const db = client.db("ChatApp");

const chatRooms = db.collection("chatRooms");
const userInfo = db.collection("userInfo");

const app = express()
const port = 7845
const server = createServer(app)
const io = new sio.Server(server, {
  cors: {
    origin: ["http://localhost:5173"],
    credentials: true,
  }
});



io.on('connection', (socket) => {

  console.info("New Connection: Hello, " + socket.handshake.headers['username'] + "!");

  console.debug("Adding user to their rooms...")
  addClientToRooms(socket);
  console.debug("Done!\n")

  socket.on("sendMessage", async (data) => await sendMessage(data));
  // socket.on("createRoom", async(data) => await createRoom(data));
  // socket.on("leaveRoom", async(data) => await leaveRoom(data));
  // socket.on("deleteRoom", async(data) => await deleteRoom(data));

})


function addClientToRooms(socket) {
  socket.join("global");
}


async function sendMessage(data) {

  console.info("Sending\n" + data['messageData']['message'] +
    "\n to chat room [code]\n" + data['roomCode']);

  let filter = { roomCode: data['roomCode'] };
  console.debug("Finding room with room code: " + data['roomCode'] + "...");
  let chatRoom = await chatRooms.findOne(filter);
  console.debug("Found!\n");

  let newMessageNum = chatRoom['data']['messageCount'] + 1;
  chatRoom['data']['messageCount'] = newMessageNum;
  chatRoom['data']['history'][newMessageNum.toString()] = data['messageData'];

  let update = {
    $set: chatRoom
  }
  console.debug("Updating messages in room [" + data['roomCode'] + "]...");
  let updateResult = await chatRooms.updateOne(filter, update, { upsert: true });
  console.debug("Updated!\n");

  updateClientMessages(chatRoom);
}


function updateClientMessages (chatRoom) {

  let chatHistory = {};

  console.debug("Creating readable and formatted list of messages....")
  // set end to the final message number
  let end = chatRoom['data']['messageCount'];
  // set start to 50th message from the end
  // !!!!TODO (ADD OPTION IN CLIENT SIDE TO LOAD MORE MESSAGES)!!!!
  let start = (end - 50 > 0) ? end - 50 : 1;
  for (let i = start; i <= end; i++) {
    let msgData = chatRoom['data']['history'][i.toString()];
    let date = new Date();
    date.setUTCMilliseconds(msgData['epochTime']);
    let formattedDateString = date.getDate() + "/" + (date.getMonth() + 1) + "/" + date.getFullYear();
    let formattedTimeString = date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds();
    let msgFormattedStringHTML = `[${ formattedDateString }][${ formattedTimeString }][${ msgData['sender'] }] :<br>`
                              + msgData['message'];
    chatHistory[i.toString()] = msgFormattedStringHTML;
  }
  console.debug("Done!\n")

  let data = {
    roomCode : chatRoom['roomCode'],
    msgStartNum : start,
    msgEndNum : end,
    history : chatHistory
  }

  console.debug("Sending updated data to all room members...\n")
  io.to(chatRoom['roomCode']).emit("updateChat", data);
}










// io.on('connection', async(socket) => {
//   console.log("connected.");

//   socket.on("sendMessage", async(socket) => {
//     console.log("recieving and sending message to " + socket.roomCode);
//     console.log("message data: " + JSON.stringify(socket.messageData));
//     let filter  = {roomCode : socket.roomCode};
//     let chatRoom = await chatRooms.findOne(filter);
//     let messageNum = (chatRoom["data"]["messageCount"] + 1);
//     console.log("updating...")
//     let update = {
//       $set : {
//         data : {
//           ...chatRoom["data"],
//           messageCount : messageNum,
//           history : {
//             ...chatRoom["data"]["history"],
//             [messageNum.toString()] : socket["messageData"]
//           }
//         }
//       }
//     }
//     let result = await chatRooms.updateOne(filter, update, {upsert : true})
//     console.log("successfully updated")
//     chatRoom = await chatRooms.findOne(filter);
//     console.log(typeof chatRoom["data"]["history"])
//     let messages = [];
//     for (let i = 1; i <= chatRoom["data"]["messageCount"]; i++ ) {
//       console.log(i + " : " + JSON.stringify(chatRoom["data"]["history"][i.toString()]));
//       let sender = chatRoom["data"]["history"][i.toString()]["sender"];
//       let d = new Date()
//       let sendTime = chatRoom["data"]["history"][i.toString()]["date"];
//       d.setSeconds(sendTime);
//       let formattedTime = d.getDate() + "/" + d.getMonth()+1 + "/" + d.getFullYear() + " "
//                         + d.getHours() + ":" + d.getMinutes() + ":" + d.getSeconds();
//       let message = chatRoom["data"]["history"][i.toString()]["message"];

//       messages.push(`[${ sender }][${ formattedTime }]:${ message }`);
//     }
//     console.log(messages);
//     io.to(socket.roomCode).emit("updateMessages", {
//       roomCode : socket.roomCode,
//       messageData : messages
//     });
//   })


//   socket.join("global")
// })



server.listen(port, () => console.log(`Server listening to http://localhost:${port}`));
