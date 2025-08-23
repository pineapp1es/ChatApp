import { createNewEmptyChatRoom } from "@models/chatRoomsModels.ts";
import { addRoomToUserRoomList } from "@models/userInfoModels.ts"
import { handleError } from "@utils/handlerUtils.ts";
import { logger } from "@utils/loggerUtil.ts";
import { checkIfPasswordIsCorrect } from "../utils/securityUtils.ts";

export const createRoomService = async (roomData: any, username: string) => {
    const roomCode = roomData.code;
    const roomName = roomData.roomName;
    const roomPass = (!roomData.password) ? "" : roomData.password;
    const roomCreatedBy = username;
    const roomCreatedDate = new Date()

    logger.debug(`Creating new chat room (code:${roomCode}), attempt by username: ${username}`);

    await createNewEmptyChatRoom(roomCode, roomPass, roomName, roomCreatedBy, roomCreatedDate)
        .catch(err => {
            throw("Creating new room with data: " + JSON.stringify(roomData) +
                ", attempt by username: " + username + "\n ERROR: " + err);
        });

    logger.debug(`Room (code:${roomCode}) was created! Adding creator to the room...`);

    await addRoomToUserRoomList(roomCode, username).catch(err => {
        throw("Adding username: " + username + `to room (roomcode:${roomCode}` + "\n ERROR: " + err);
    })

    logger.debug(`user (username:${username}) was added to room (roomcode:${roomCode})!`);
}

export const joinRoomService = async (roomData: any, username: string) => {

    const roomCode = roomData.code;
    const roomPass = (!roomData.password) ? "" : roomData.password;

    logger.debug(`user (username:${username}) is attempting to join room (roomcode:${roomCode})`);

    const actualHashedPass = await getChatRoomHashedPassword(roomCode);

    const wasSubmittedPasswordCorrect = await checkIfPasswordIsCorrect(roomPass, actualHashedPass);

    if (!wasSubmittedPasswordCorrect) {
        logger.debug("Submitted password was incorrect!")
        return "incorrect";
    }

    await addRoomToUserRoomList(roomCode, username).catch(err => {
        throw("Adding username: " + username + `to room (roomcode:${roomCode}` + "\n ERROR: " + err);
    })

    logger.debug(`user (username:${username}) was added to room (roomcode:${roomCode})!`);
}
