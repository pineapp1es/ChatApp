const express = require('express');
const sio = require('socket.io');
const { createServer } = require('node:http')
const mongodb = require('mongodb')
const cors = require('cors');
const { stringify } = require('node:querystring');
require('dotenv').config()


// Enable Logging levels by commenting out respective level definitions
console.debug = () => {};
// console.log = () => {};
// console.info = () => {};
// console.warn = () => {};
// console.error = () => {};


// Connect to MongoDB Atlas
const uri = process.env.URI;
const client =  new mongodb.MongoClient(uri);
const db = client.db("ChatApp");
const chatRooms = db.collection("chatRooms");
const sessions = db.collection("loggedInSessions");
const userInfo = db.collection("userInfo");

// Create server and websocket
const app = express()
const port = 7845
const server = createServer(app)
const io = new sio.Server(server, {
  cors: {
    origin: ["http://localhost:5173"],
    credentials: true,
  }
});

// Object that stores socket.id:username values
// must be periodically reset
let socketUsers = {};


// When a user logs in and connects to the websocket
io.on('connection', async (socket) => {

  console.info("[INFO] " + "New Connection: Hello, " + socket.handshake.headers['username'] + "!\n");

  console.debug("[DEBUG] " + "Creating new logged in session for the user...");
  await addUserToSession(socket);
  console.debug("[DEBUG] " + "Done!\n");

  console.debug("[DEBUG] " + "Adding user to their rooms...")
  await addClientToRooms(socket);
  console.debug("[DEBUG] " + "Done!\n")

  console.debug("[DEBUG] " + "Updating new connection's global chat...");
  await initializeClientGlobalChat(socket);
  console.debug("[DEBUG] " + "Done!\n")

  socket.on("sendMessage", async (data) => await sendMessage(data, socket.id));
  // socket.on("createRoom", async(data) => await createRoom(data));
  // socket.on("leaveRoom", async(data) => await leaveRoom(data));
  // socket.on("deleteRoom", async(data) => await deleteRoom(data));
  socket.on('disconnect', async (reason) => await handleSocketDisconnection(socket, reason));

})


// Updates the global chat history on client side when the user logs in
async function initializeClientGlobalChat(socket) {
  let chatRoom = await chatRooms.findOne({roomCode : "global"});
  let result = formatMessages(chatRoom);

  let data = {
    roomCode : chatRoom['roomCode'],
    msgStartNum : result[1],
    msgEndNum : result[2],
    history : result[0]
  }

  socket.emit("updateChat", data);

}


// Adds user to loggedInSessions collection and in the socketUsers object
async function addUserToSession(socket) {

  let username = socket.handshake.headers['username'];
  let result = await sessions.insertOne({
    _id : socket.id,
    username : username
  })

  socketUsers[socket.id] = username;
}


// Gets username from socketUsers or the DB
async function getUsername(socketid) {
  if (socketUsers.hasOwnProperty(socketid))
    return socketUsers[socketid];
  else {
    let username = await sessions.findOne({_id : socketid});
    return username;
  }
}


// Get all chat rooms the user is in from MongoDB and add them to it in socket rooms
async function addClientToRooms(socket) {
  socket.join("global");
}


// When a user disconnects, their session entry in the DB is deleted by this function
async function handleSocketDisconnection(socket, reason) {
  console.log("[INFO] " + "Disconnecting socket [" + socket.id + "]...");
  console.debug("[DEBUG] " + "Reason : " + JSON.stringify(reason))
  let result = await sessions.deleteOne({_id : socket.id});
  console.debug("[DEBUG] " + "Disconnected. \n");
}


// Function that handles putting the sent message in the DB and initiates a client-side
// chat history updation request
async function sendMessage(data, id) {

  console.debug("[DEBUG] " + "Sending: " + data['message'] +
               "\nto chat room: " + data['roomCode'] + "\n");

  // Creating message data in the required format
  let sender = await getUsername(id);
  // If username related to socket id wasnt found, the message is not sent.
  if (sender == null) {
    console.error("ERROR!! Socket " + id + " doesnt exist. Not sending the message...")
    console.debug("[DEBUG] " + JSON.stringify(socketUsers));
    return;
  }
  let messageData = {
    sender : sender,
    epochTime : Date.now(),
    message : data['message']
  };


  let filter = { roomCode: data['roomCode'] };
  console.debug("[DEBUG] " + "Finding room with room code: " + data['roomCode'] + "...");
  let chatRoom = await chatRooms.findOne(filter);
  console.debug("[DEBUG] " + "Found!\n");

  let newMessageNum = chatRoom['data']['messageCount'] + 1;
  chatRoom['data']['messageCount'] = newMessageNum;
  chatRoom['data']['history'][newMessageNum.toString()] = messageData;

  let update = {
    $set: chatRoom
  }
  console.debug("[DEBUG] " + "Updating messages in room [" + data['roomCode'] + "]...");
  let updateResult = await chatRooms.updateOne(filter, update, { upsert: true });
  console.debug("[DEBUG] " + "Updated!\n");

  // After updating DB, start updation of clients chat histories
  updateClientMessages(chatRoom);
}


// Function that creates readable chats and sends them to clients for updation
function updateClientMessages (chatRoom) {

  // set end to the final message number
  let end = chatRoom['data']['messageCount'];
  // set start to 50th message from the end
  // !!!!TODO (ADD OPTION IN CLIENT SIDE TO LOAD MORE MESSAGES)!!!!
  let start = (end - 50 > 0) ? end - 50 : 1;
  let result = formatMessages(chatRoom, start, end);

  let data = {
    roomCode : chatRoom['roomCode'],
    msgStartNum : result[1],
    msgEndNum : result[2],
    history : result[0]
  }

  console.debug("[DEBUG] " + "Sending updated data to all room members...\n")
  io.to(chatRoom['roomCode']).emit("updateChat", data);
}



// Converts stored JSON message data into formatted, more readable strings for HTML
function formatMessages(chatRoom, start=-1, end=-1) {

  console.debug("[DEBUG] " + "Creating readable and formatted list of messages....")

  if (start == -1 || end == -1) {
    end = chatRoom['data']['messageCount'];
    start = (end - 50 > 0) ? end - 50 : 1;
  }

  let chatHistory = {};

  for (let i = start; i <= end; i++) {
    let msgData = chatRoom['data']['history'][i.toString()];
    let date = new Date(0);
    date.setUTCMilliseconds(msgData['epochTime']);
    let formattedDateString = date.getDate() + "/" + (date.getMonth() + 1) + "/" + date.getFullYear();
    let formattedTimeString = date.getHours().toString().padStart(2, '0') +
                              ":" + date.getMinutes().toString().padStart(2, '0') +
                              ":" + date.getSeconds().toString().padStart(2, '0');
    let msgFormattedStringHTML = `[${ formattedDateString }][${ formattedTimeString }][${ msgData['sender'] }] :<br>`
                              + msgData['message'];
    chatHistory[i.toString()] = msgFormattedStringHTML;
  }

  console.debug("[DEBUG] " + "Done!\n")
  return [chatHistory, start, end];
}



server.listen(port, () => console.log("[INFO] " + `Server listening to http://localhost:${port}`));
