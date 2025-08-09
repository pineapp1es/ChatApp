import { Server, Socket } from "socket.io";
import { logger } from "@utils/loggerUtil.ts";
import { loadMessagesService, sendMessageService } from "@services/socketMessagesServices.ts";


export const addMessageToDB = async (messageData: any, username: string, io: Server) => {
    logger.debug("Recieved request to send message...")

    if (!messageData.messageType) {
        logger.warn("Recieved message with no message type, defaulting to 'text' type")
        messageData.type = 'text';
    }
    if (!messageData.content) {
        logger.warn("Recieved message with no content, message wont be sent..")
        return;
    }
    if (!messageData.roomToSendTo) {
        logger.warn("No chat room to send to was provided, message wont be sent..")
        return;
    }

    await sendMessageService(messageData, username);

    await updateMessagesInClient({
        roomCode: messageData.roomToSendTo,
        numberOfMessagesToSkipFromEnd: 0,
        numberOfMessagesToLoad: 100
    }, null, io);
}


export const updateMessagesInClient = async (updateRequestData: any, socket: Socket | null, io: Server | null) => {

    logger.debug("Recieved message update request... Updating messages for",  (!socket) ? " all room members" : " single room member")

    if (!updateRequestData) {
        logger.warn("Recieved no data for updation, no updation will occur..")
        return;
    }

    const roomCode = updateRequestData.roomCode;
    let numberOfMessagesToSkipFromEnd = updateRequestData.numberOfMessagesToSkipFromEnd ;
    let numberOfMessagesToLoad = updateRequestData.numberOfMessagesToLoad;

    if (!roomCode) {
        logger.warn("Recieved no room code for updation, no updation will occur..");
        return;
    }
    if (!numberOfMessagesToSkipFromEnd && numberOfMessagesToSkipFromEnd !== 0) {
        logger.warn("Recieved no number of messages to skip from, no updation will occur..");
        return;
    }
    if (!numberOfMessagesToLoad) {
        logger.warn("Recieved no number of messages to load, no updation will occur..");
        return;
    }

    const [ requestedChatHistory, numOfFirstLoadedMessage, numOfLastLoadedMessage ] = await loadMessagesService(roomCode, numberOfMessagesToSkipFromEnd, numberOfMessagesToLoad)

    const dataToSend = {
        history: requestedChatHistory,
        numOfFirstLoadedMessage: numOfFirstLoadedMessage,
        numOfLastLoadedMessage: numOfLastLoadedMessage,
        roomCode: roomCode
    }

    if (!socket && io) {
        logger.debug(`Sending updated data to all room members of room with code: ${roomCode}...\n`);
        io.to(roomCode).emit("updateChat", dataToSend);
    }
    else if (socket) {
        logger.debug("Sending updated data to requested room member...\n");
        socket.emit('updateChat', dataToSend);
    }
}
