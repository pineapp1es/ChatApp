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




io.on('connection', async(socket) => {
  console.log("connected.");

  socket.on("sendMessage", async(socket) => {
    console.log("recieving and sending message to " + socket.roomCode);
    console.log("message data: " + JSON.stringify(socket.messageData));
    let filter  = {roomCode : socket.roomCode};
    let chatRoom = await chatRooms.findOne(filter);
    let messageNum = (chatRoom["data"]["messageCount"] + 1);
    console.log("updating...")
    let update = {
      $set : {
        data : {
          ...chatRoom["data"],
          messageCount : messageNum,
          history : {
            ...chatRoom["data"]["history"],
            [messageNum.toString()] : socket["messageData"]
          }
        }
      }
    }
    let result = await chatRooms.updateOne(filter, update, {upsert : true})
    console.log("successfully updated")
    chatRoom = await chatRooms.findOne(filter);
    console.log(typeof chatRoom["data"]["history"])
    let messages = [];
    for (let i = 1; i <= chatRoom["data"]["messageCount"]; i++ ) {
      console.log(i + " : " + JSON.stringify(chatRoom["data"]["history"][i.toString()]));
      let sender = chatRoom["data"]["history"][i.toString()]["sender"];
      let d = new Date()
      let sendTime = chatRoom["data"]["history"][i.toString()]["date"];
      d.setSeconds(sendTime);
      let formattedTime = d.getDate() + "/" + d.getMonth()+1 + "/" + d.getFullYear() + " "
                        + d.getHours() + ":" + d.getMinutes() + ":" + d.getSeconds();
      let message = chatRoom["data"]["history"][i.toString()]["message"];

      messages.push(`[${ sender }][${ formattedTime }]:${ message }`);
    }
    console.log(messages);
    io.to(socket.roomCode).emit("updateMessages", {
      roomCode : socket.roomCode,
      messageData : messages
    });
  })


  socket.join("global")
})



server.listen(port, () => console.log(`Server listening to http://localhost:${port}`));
