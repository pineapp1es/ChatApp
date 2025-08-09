import { handleError } from '@utils/handlerUtils.ts';
import mongoose from 'mongoose';
import { envVariables } from '@config/environmentVariables.ts';
import { logger } from '../utils/loggerUtil.ts';


logger.debug("Connecting to MongoDB through mongoose...")
mongoose.connect(envVariables.MONGODB_CLUSTER_CONNECTION_STRING as string, { dbName: envVariables.CHATAPP_DB_NAME })
        .catch(err => handleError(err, 'Mongoose Connection Error'));
logger.debug("Connected!")


export default mongoose;
