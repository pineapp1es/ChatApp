import { Server, Socket } from 'socket.io';
import { initClientConnectionToServer } from '@controllers/socketConnectionController.ts'
import { addMessageToDB, updateMessagesInClient } from '@controllers/socketMessagesController.ts';
import { logger } from '../utils/loggerUtil.ts';
import { createChatRoom } from '../controllers/socketChatRoomsController.ts';


export const setUpConnectionEvent = async (io: Server) => io.on('connection', (socket) => initClientConnectionToServer(socket, io));

export const setUpSocketMessageEvents = (socket: Socket, username: string, io: Server) => {
    logger.debug("Setting socket message events..");
    socket.on("sendMessage", async (data) => await addMessageToDB(data, username, io));
    socket.on("loadMessages", async(data) => await updateMessagesInClient(data, socket, null));
    logger.debug("Done!")
}

export const setUpSocketChatRoomEvents = (socket: Socket, username: string) => {
    logger.debug("Setting socket chat room events..");
    // TODO
    socket.on("createRoom", async(data) => await createChatRoom(data, username));
    socket.on("joinRoom"), async(data) => await joinChatRoom(data, username));
    // socket.on("leaveRoom", async(data) => await leaveChatRoom(data, username));
    // socket.on("deleteRoom", async(data) => await deleteChatRoom(data, username));
    logger.debug("Done!")
}
