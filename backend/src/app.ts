import express from 'express';
import * as socketIO from 'socket.io';
import { createServer } from 'node:http';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { logger, loggingLevels } from '@utils/loggerUtil.ts';


// Set log level
logger.setLogLevel(loggingLevels.ALL);


// creating express server
logger.debug("Creating Express Server...")
const expressServer = express()


// creating web socket
logger.debug("Creating Web Socket...")
const webSocketServer = createServer(expressServer)
const io = new socketIO.Server(webSocketServer, {
  cookie: true,
  cors: {
    origin: ["http://localhost:5173"],
    credentials: true,
  }
});


// middleware for express server
logger.debug("Setting up middleware for Express Server...")
expressServer.use(cookieParser());
expressServer.use(cors({
  origin: ["http://localhost:5173"],
  credentials: true
}));
expressServer.use(express.json());


// routes for express server
logger.debug("Adding routes to Express Server...")
import authRoutes from '@routes/authRoutes.ts';
expressServer.use(authRoutes);


// setting up socket events
logger.debug("Setting up socket events...")
import { setUpConnectionEvent } from '@routes/socketEventRoutes.ts';
await setUpConnectionEvent(io);


// opening express server and websocket for listening
const websocketPort = 7845
const expressPort = 7846
expressServer.listen(expressPort, () => logger.info(`Express server listening to http://localhost:${expressPort}`))
webSocketServer.listen(websocketPort, () => logger.log(`WebSocket listening to http://localhost:${websocketPort}`));
