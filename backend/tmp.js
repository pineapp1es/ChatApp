const express = require('express');
const { Server } = require('socket.io');
const { createServer } = require('node:http');
const cors = require('cors');
const { MongoClient } = require('mongodb');
require('dotenv').config();


const uri = process.env.URI;
const client = new MongoClient(uri);
const db = client.db('ChatApp');
const chatRooms = db.collection('chatRooms');
const userInfo = db.collection('userInfo');

const app = express();
const port = 7845;
const server = createServer(app);
const socket = new Server(server, {
  cors: {
    origin: ["http://localhost:5173"],
    credentials: true,
  }
});
let i = 0;
socket.on('connection', (data) => {
  console.log("connected.");
  let chatRoom = {"1" : {
    "password" : 'test',
    "users" : ['Me', 'You'],
    "messageCount" : 1,
    "history" : {
      "1" : {
        "sender" : "You",
        "date" : Date.now(),
        "message" : "Hello, world!"
        }
      }
    }
  }
  chatRooms.insertOne(chatRoom);
  socket.emit( "message", "testing this");
})


server.listen(port, () => console.log(`Server listening to http://localhost:${port}`));
