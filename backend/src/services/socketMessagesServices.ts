import { logger } from '@utils/loggerUtil.ts';
import { addMessageToChatRoom, checkIfChatRoomExists, getRoomChatHistorySlice, getRoomMessageCount } from "@models/chatRoomsModels.ts";
import { parseMessageHistoryToClientFormat } from "@utils/messageUtils.ts";

export const sendMessageService = async (messageData: any, username: string) => {

    const roomToSendTo = messageData.roomToSendTo;

    logger.debug(`Sending message from ${username} to room with code: ${roomToSendTo}`);

    const chatRoomExists = await checkIfChatRoomExists(roomToSendTo);

    if (!chatRoomExists) {
        logger.error(`No chat room with room code ${roomToSendTo} found. Message will not be sent..`)
        return;
    }

    const roomDataWithOnlyMessageCount = await getRoomMessageCount(roomToSendTo);
    if (!roomDataWithOnlyMessageCount) {
        logger.error(`No room data with message count found in room with code ${roomToSendTo}. Message will not be sent..`);
        return;
    }

    const messageCountInRoom = roomDataWithOnlyMessageCount.messageData.messageCount;
    const messageDataToAddToDB = {
        messageNumber: messageCountInRoom + 1,
        sentTimeInEpoch: Date.now(),
        sender: username,
        type: messageData.messageType,
        content: messageData.content
    }

    await addMessageToChatRoom(messageDataToAddToDB, roomToSendTo);
    logger.debug('Message Sent!\n')
}

export const loadMessagesService = async (roomCode: string, numOfMessagesToSkipFromEnd: number, numOfMessagesToLoad: number) => {

    const roomDataWithOnlyMessageCount = await getRoomMessageCount(roomCode);
    if (!roomDataWithOnlyMessageCount) {
        logger.error(`No message count found in room with code ${roomCode}. Messages will not be loaded..`);
        return [{}, 0, 0] as const;
    }
    const messageCountInRoom = roomDataWithOnlyMessageCount.messageData.messageCount;
    const messageNumberToLoadTill = messageCountInRoom - numOfMessagesToSkipFromEnd;
    const messageNumberToLoadFrom = (messageNumberToLoadTill - numOfMessagesToLoad < 0) ? 0 : messageNumberToLoadTill - numOfMessagesToLoad;

    logger.debug(`Loading messages with message number from ${messageNumberToLoadFrom}, till ${messageNumberToLoadTill}`);

    const roomDataWithOnlyHistory = await getRoomChatHistorySlice(roomCode, messageNumberToLoadFrom, messageNumberToLoadTill);
    if (!roomDataWithOnlyHistory) {
        logger.error(`No message history field found for room with code: ${roomCode}, nothing will be loaded`)
        return [{}, 0, 0] as const;
    }

    const roomMessageHistory = roomDataWithOnlyHistory.messageData.history;

    const formattedMessageHistory = parseMessageHistoryToClientFormat(roomMessageHistory)

    logger.debug("Loaded!");
    return [formattedMessageHistory, messageNumberToLoadFrom, messageNumberToLoadTill] as const;
}
