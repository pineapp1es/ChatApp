import mongoose from '@config/mongooseDB.ts';
import { handleError } from '@utils/handlerUtils.ts';
import { envVariables } from '@config/environmentVariables.ts';

// ====================
//   SCHEMA AND MODEL
// ====================

const { Schema } = mongoose;
const sessionSchema = new Schema(
  {
    sessionID: {
      type: String,
      required: true,
      unique: true
    },
    username: {
      type: String,
      required: true
    },
    rememberSession: {
      type: Boolean,
      required: true
    },
    expiresAt: {
      type: Date,
      required: true
    }
  }
);

export const Session = mongoose.model('session', sessionSchema, envVariables.SESSIONS_COLL_NAME);


// ====================
//   CRUD OPERATIONS
// ====================

export const createSession = async (sessionID: string, username: string, rememberSession: boolean, expireTime: Date) => {
  return await Session.create({
    sessionID: sessionID,
    username: username,
    rememberSession: rememberSession,
    expiresAt: expireTime
  }).catch(err => handleError(err, `Saving Session, sessionID: ${sessionID}, username: ${username}, expireTime: ${expireTime}`));
}

export const getSessionDataFromID = async (sessionID: string) => {
  return await Session.findOne({
    sessionID: sessionID
  }).exec()
    .catch(err => handleError(err, `Getting Session Data from ID, sessionID: ${sessionID}`));
}

export const getAllSessionsDataFromUsername = async (username: string) => {
  return await Session.find({
    username: username
  }).exec()
    .catch(err => handleError(err, `Getting All Session Data of ${username}`));
}

export const deleteSession = async (sessionID: string) => {
  return await Session.deleteOne({
    sessionID: sessionID
  }).catch(err => handleError(err, `Deleting Session, sessionID: ${sessionID}`));
}

export const checkIfSessionExists = async (sessionID: string) => {
  return await Session.exists({
    sessionID: sessionID
  }).exec()
    .catch(err => handleError(err, `Checking If Session With ID: ${sessionID} Exists.`))
}
