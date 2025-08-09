import { Server, Socket } from 'socket.io';
import { socketEmitThenDisconnect } from '@utils/socketUtils.ts'
import { socketHasValidSessionID, addSocketToRooms } from '@services/socketConnectionServices.ts';
import { setUpSocketChatRoomEvents, setUpSocketMessageEvents } from '@routes/socketEventRoutes.ts';
import { getSessionDataFromID} from '@models/sessionModels.ts';
import { logger } from "@utils/loggerUtil.ts";


export const initClientConnectionToServer = async (socket: Socket, io: Server) => {
    logger.debug("Initialising socket connection...")
    const [isValidSession, sessionID] = await socketHasValidSessionID(socket.handshake.headers.cookie);
    if (!isValidSession) {
        logger.info("Invalid session, disconnecting socket..\n")
        socketEmitThenDisconnect(socket, "noSession", {});
        return;
    }

    await addSocketToRooms(socket, sessionID);

    const socketSessionData = await getSessionDataFromID(sessionID);
    if (!socketSessionData) {
        logger.error(`Could not find any data for sessionID: ${sessionID}, disconnecting socket..\n`)
        socketEmitThenDisconnect(socket, "noSession", {});
        return;
    }
    const socketUsername = socketSessionData.username;

    setUpSocketMessageEvents(socket, socketUsername, io);
    setUpSocketChatRoomEvents(socket, socketUsername);

    logger.debug("Initialised!\n");
}
