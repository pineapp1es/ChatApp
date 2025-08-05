const express = require('express');
const sio = require('socket.io');
const { createServer } = require('node:http')
const mongodb = require('mongodb')
const cors = require('cors');
const cookieParser = require('cookie-parser');
const cookie = require('cookie');
const bcrypt = require('bcrypt');
const { randomBytes } = require('node:crypto');
require('dotenv').config()

const cookieMaxAge = 1000*60*60*24*365*10;

// Enable Logging levels by commenting out respective level definitions
// console.debug = () => {};
// console.log = () => {};
// console.info = () => {};
// console.warn = () => {};
// console.error = () => {};

// salt rounds for bcrypt
const saltRounds = 10;

// Connect to MongoDB Atlas
const uri = process.env.URI;
const client =  new mongodb.MongoClient(uri);
const db = client.db("ChatApp");
const chatRooms = db.collection("chatRooms");
const sessions = db.collection("loggedInSessions");
const userInfo = db.collection("userInfo");

// Create server and websocket
const app = express()
app.use(cookieParser());
app.use(cors({
  origin: ["http://localhost:5173"],
  credentials : true
}));
app.use(express.json());
const port1 = 7845
const port2 = 7846
const server = createServer(app)
const io = new sio.Server(server, {
  cookie: true,
  cors: {
    origin: ["http://localhost:5173"],
    credentials: true,
  }
});

// Object that stores socket.id:username values
// must be periodically reset
let socketUsers = {};


// Integer -> String
// produce a random secure string of the consumed length for cookie token
function generateToken(l=56) {
  return Buffer.from(randomBytes(l)).toString('hex');
}


app.post("/autoCookieLogin", async (req, res) => {
  const cookies = req.cookies;
  const sessionID = cookies.sessionID;

  const session = await sessions.findOne({
    _id : sessionID
  })

  if (!session) {
    res.clearCookie('sessionID');
    res.json({success : false});
  }
  else {
    const cookieExpireTime = new Date(0);
    cookieExpireTime.setUTCMilliseconds(Date.now() + cookieMaxAge);
    res.cookie("sessionID", sessionID, {maxAge : cookieMaxAge, httpOnly: true});
    try {
      await sessions.insertOne({
        _id : sessionID,
        username : session.username,
        expiresAt : cookieExpireTime
      })
    }
    catch (e) {
      console.error("[ERROR] " + "An error has occurred in saving session id:\n" + e);
    }
    res.json({success : true});
  }
});

// Check if the username exists in DB. If it does, compare the hashed password and sent password.
// If the credentials are valid, create a session cookie, store it and set it and send back a true value
// If credentials are invalid, send back a false value
app.post("/login", async (req, res) => {
  const payload = req.body;
  const userCreds = await userInfo.findOne({
    username: payload['username'],
  });

  if (!userCreds) {
    res.json({success : false});
  }
  else if (await bcrypt.compare(payload.password, userCreds.password)) {
    const sessionID = generateToken();


    const cookieOptions = {
      httpOnly : true
    };
    const cookieExpireTime = new Date(0);
    if (payload.rememberMe) {
      cookieExpireTime.setUTCMilliseconds(Date.now() + cookieMaxAge);
      cookieOptions.maxAge = cookieMaxAge;
    }
    else {
      cookieExpireTime.setUTCMilliseconds(Date.now() + 1000*60*60*12);
    }
    try {
      await sessions.insertOne({
        _id : sessionID,
        username : payload['username'],
        expiresAt : cookieExpireTime
      })
    }
    catch (e) {
      console.error("[ERROR] " + "An error has occurred in saving session id:\n" + e);
    }
    res.cookie('sessionID', sessionID, cookieOptions);

    res.json({success : true});

  }
  else
    res.json({success : false});
})



app.post("/signup", async (req, res) => {
  const payload = req.body;

  const username = payload.username;
  const hashedPassword = await bcrypt.hash(payload.password, saltRounds);

  const existing = await userInfo.findOne({username : username});

  if (!existing) {
    try {
      await userInfo.insertOne({
        username: username,
        password: hashedPassword
      });
    }
    catch (e) {
      console.error("[ERROR] " + "Error occurred while storing new user data:\n" + e);
    }

    res.json({success : true, alreadyExists : false});
  }
  else {
    res.json({success : false, alreadyExists : true});
  }

})


app.post("/logout", async (req, res) => {
  const cookies = req.cookies;
  res.clearCookie('sessionID');
  await sessions.deleteOne({
    _id : cookies.sessionID
  });

  res.json({success : true});
})


// When a user logs in and connects to the websocket
io.on('connection', async (socket) => {

  console.debug("[DEBUG] " + "Validating session id...")
  if (!socket.handshake.headers.cookie) {
    socket.disconnect(true);
    return;
  }
  const cookies = cookie.parse(socket.handshake.headers.cookie)
  if (!cookies.sessionID) {
    socket.emit('noSession');
    socket.disconnect(true);
    return;
  }

  if (!validSession(cookies.sessionID)) {
    socket.disconnect(true);
    return;
  }
  console.debug("[DEBUG] " + "Validated!");

  console.debug("[DEBUG] " + "New Connection, Cookies : " + socket.handshake.headers.cookie + "\n");


  console.debug("[DEBUG] " + "Adding user to their rooms...")
  await addClientToRooms(socket);
  console.debug("[DEBUG] " + "Done!\n")

  console.debug("[DEBUG] " + "Updating new connection's global chat...");
  // await initializeClientGlobalChat(socket);
  await updateClientMessages("global", socket);
  console.debug("[DEBUG] " + "Done!\n")

  socket.on("sendMessage", async (data) => await sendMessage(data, cookies.sessionID));
  // socket.on("createRoom", async(data) => await createRoom(data));
  // socket.on("leaveRoom", async(data) => await leaveRoom(data));
  // socket.on("deleteRoom", async(data) => await deleteRoom(data));

})


// String (sessionID) -> Boolean
// produces true if the sessionID exists in the sessions collection in DB
async function validSession(sessionID) {
  try {
    const result = await sessions.findOne({
      _id : sessionID
    })

    if (!result)
      return false;

    return true;
  }
  catch (e) {
    console.error("[ERROR] " + "INVALID SESSION ID : " + sessionID);
  }
}


// Gets username from socketUsers or the DB
async function getUsername(sessionID) {
  if (socketUsers.hasOwnProperty(sessionID))
    return socketUsers[sessionID];
  else {
    let data = await sessions.findOne({_id : sessionID});
    console.log(sessionID);
    console.log(data);
    return data.username;
  }
}


// Get all chat rooms the user is in from MongoDB and add them to it in socket rooms
async function addClientToRooms(socket) {
  socket.join("global");
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
    console.error("[ERROR] " + "Session " + id + " doesnt exist. Not sending the message...")
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
  await updateClientMessages(chatRoom);
}


// Function that creates readable chats and sends them to clients for updation
async function updateClientMessages (chatRoom, socket=null) {

  if (typeof chatRoom === 'string') {
    chatRoom = await chatRooms.findOne({
      roomCode : chatRoom
    })
  }
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

  if (!socket) {
    console.debug("[DEBUG] " + "Sending updated data to all room members...\n");
    io.to(chatRoom['roomCode']).emit("updateChat", data);
  }
  else {
    console.debug("[DEBUG] " + "Sending updated data to requested room member");
    socket.emit('updateChat', data);
  }
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

  console.debug("[DEBUG] " + "Done!")
  return [chatHistory, start, end];
}


app.listen(port2, () => console.info("[INFO] " + `Express server listening to http://localhost:${port2}`))
server.listen(port1, () => console.log("[INFO] " + `WebSocket listening to http://localhost:${port1}`));
