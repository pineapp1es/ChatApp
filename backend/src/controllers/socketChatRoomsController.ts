import { logger } from "@utils/loggerUtil.ts"
import { createRoomService, joinRoomService } from "../services/socketChatRoomServices.ts";
import { handleError } from "../utils/handlerUtils.ts";

export const createChatRoom = async (data: any, username: string) => {

    logger.debug("Recieved request to create room");

    if (!data || !data.code || !data.name || !username) {
        logger.warn("Did not recieve required data to create a room (room code, name, creator username), room will not be created...");
        return;
    }

    await createRoomService(data, username).catch(err => {
        handleError(err, "Creating room");
        return;
    });

    logger.debug("Finished room creation request!\n");
}

export const joinChatRoom = async (data: any, username: string) => {

    logger.debug("Recieved request to join room");

    if (!data || !data.code || !username) {
        logger.warn("Did not recieve required data to join room (room code, username), user will not join room")
        return;
    }

    await joinRoomService(data, username).catch(err => {
        handleError(err, "Joining room");
        return;
    });

    logger.debug("Finished room join request!\n");
}
