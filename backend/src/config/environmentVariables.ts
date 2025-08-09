import dotenv from 'dotenv'
import { logger } from '@utils/loggerUtil.ts';
import { exit } from 'process';


logger.debug("Loading environment variables from server root directory...")
export const envVariables = dotenv.config({
    path: import.meta.dirname + '/../../.env'
}).parsed


if (!envVariables.MONGODB_CLUSTER_CONNECTION_STRING ||
    !envVariables.CHATAPP_DB_NAME ||
    !envVariables.USERINFO_COLL_NAME ||
    !envVariables.CHATROOMS_COLL_NAME ||
    !envVariables.SESSIONS_COLL_NAME) {
    logger.error("Required .env variables fields were not found.. \n" +
        "Add the following fields to '.env' file in server root directory\n" +
        "MONGODB_CLUSTER_CONNECTION_STRING='<mongodb connection string to the cluster with chatapp database>'\n" +
        "CHATAPP_DB_NAME='<name of the database in the cluster with required collections>'\n" +
        "SESSIONS_COLL_NAME='<name of collection in database with session data>'\n" +
        "CHATROOMS_COLL_NAME='<name of collection in database with chat rooms data>'\n" +
        "USERINFO_COLL_NAME='<name of collection in database with user info data>'" +
        + "\nexiting program...");
    exit();
}
logger.debug("Loaded!")
