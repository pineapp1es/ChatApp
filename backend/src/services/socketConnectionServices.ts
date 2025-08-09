import { checkIfSessionExists, getSessionDataFromID } from "@models/sessionModels.ts";
import cookie from 'cookie';
import { handleError } from "@utils/handlerUtils.ts";
import { logger } from '@utils/loggerUtil.ts';
import { Socket } from "socket.io";
import { getUserData } from "@models/userInfoModels.ts";


export const socketHasValidSessionID = async (socketCookies: string | undefined) => {
    logger.debug("Validating session id...")

    try {
        const socketSessionID = cookie.parse(socketCookies as string).sessionID as string;
        const isValidSession = await checkIfSessionExists(socketSessionID);

        logger.debug("Validated!");
        if (isValidSession) return [true, socketSessionID] as const;

    } catch (err) {
        handleError(err, "Validating Socket's SessionID");
    }


    logger.debug("Invalid Session!")
    return [false, ""] as const;
}

export const addSocketToRooms = async (socket: Socket, sessionID: string) => {
    logger.debug("Adding user to their rooms...")
    const sessionData = await getSessionDataFromID(sessionID);
    if (!sessionData){
        logger.error(`No Session Data was Found for socketId: ${socket.id} with sessionId: ${sessionID}`);
        return;
    }

    const username = sessionData?.username;
    const userData = await getUserData(username);
    if (!userData) {
        logger.error(`No User Data was Found for username: ${username}`);
        return;
    }

    const roomsToAddSocketTo = userData?.isMemberOfRooms;
    if (!roomsToAddSocketTo) {
        logger.debug("No rooms found to add.")
        return;
    }

    for (let room of roomsToAddSocketTo) {
        logger.debug(`Adding ${username} to room with code: ${room}`);
        socket.join(room)
    }
    logger.debug("Done!")
}

