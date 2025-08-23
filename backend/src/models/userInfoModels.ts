import { handleError } from '@utils/handlerUtils.ts';
import mongoose from '@config/mongooseDB.ts';
import { envVariables } from '@config/environmentVariables.ts';


// ====================
//   SCHEMA AND MODEL
// ====================

const { Schema } = mongoose;

const userInfoSchema = new Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true
    },
    password: {
      type: String,
      required: true
    },
    isMemberOfRooms: {
      type: [String],
      required: true
    }
  }
);

export const UserInfo = mongoose.model('userInfo', userInfoSchema, envVariables.USERINFO_COLL_NAME);


// ====================
//   CRUD OPERATIONS
// ====================

export const getUserData = async (username: string) => {
  return await UserInfo.findOne({ username: username }).exec().catch(err => handleError(err, `Getting ${username}'s data'`));
}

export const checkIfUsernameExists = async (username: string) => {
  return await UserInfo.exists({ username: username }).exec().catch(err => handleError(err, `Checking if ${username} exists`))
}

export const createNewUserData = async (username: string, hashedPassword: string) => {
  return await UserInfo.create({
    username: username,
    password: hashedPassword,
    isMemberOfRooms: ['global']
  }).catch(err => handleError(err, `Creating New User Data: Username: ${username}, Password(Hashed): ${hashedPassword}`));
}

export const addRoomToUserRoomList = async (roomCode: string, username: string) => {
  return await UserInfo.updateOne({ username: username }, {
    $push: {
      isMemberOfRooms: roomCode
    }
  }).exec();
}
