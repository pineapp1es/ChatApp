import { Socket } from 'socket.io';
import { logger } from "@utils/loggerUtil.ts";


export const socketEmitThenDisconnect = (socket: Socket, emitMessage: string, emitData: object) => {
    logger.debug("Closing socket connection..")
    socket.emit(emitMessage, emitData);
    socket.disconnect(true);
}
