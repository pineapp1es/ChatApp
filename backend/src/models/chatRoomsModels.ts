import { handleError } from '@utils/handlerUtils.ts';
import mongoose from '@config/mongooseDB.ts';
import { envVariables } from '@config/environmentVariables.ts';

// ====================
//   SCHEMA AND MODEL
// ====================

const { Schema } = mongoose;
export const messageSchema = new Schema(
  {
    messageNumber: {
      type: Number,
      required: true,
      unique: true
    },
    sentTimeInEpoch: {
      type: Number,
      required: true
    },
    sender: {
      type: String,
      required: true
    },
    type: {
      type: String,
      required: true
    },
    content: {
      type: String,
      required: true
    }
  },
  { _id: false }
)

const messageDataSchema = new Schema(
  {
    messageCount: {
      type: Number,
      required: true
    },
    history: {
      type: [messageSchema],
      required: true
    }
  }
)

const chatRoomSchema = new Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true
    },
    password: String,
    name: {
      type: String,
      required: true
    },
    createdBy: {
      type: String,
      required: true
    },
    createdDate: {
      type: Date,
      required: true
    },
    owner: {
      type: String,
      required: true
    },
    members: {
      type: [String],
      required: true
    },
    messageData: {
      type: messageDataSchema,
      required: true
    }
  }
)

export const ChatRoom = mongoose.model('chatRoom', chatRoomSchema, envVariables.CHATROOMS_COLL_NAME);


// ====================
//   CRUD OPERATIONS
// ====================


export const checkIfChatRoomExists = async (roomCode: string) => {
  return await ChatRoom.exists({
    code: roomCode
  }).exec()
    .catch(err => handleError(err, `Checking if room with code: ${roomCode} exists`));
}

export const addMessageToChatRoom = async (messageToAdd: object, roomToAddTo: string) => {
  return await ChatRoom.updateOne({ code: roomToAddTo }, {
    $inc: {
      "messageData.messageCount" : 1
    },
    $push: {
      "messageData.history" : messageToAdd
    }
  }).exec()
    .catch(err => handleError(err, `Adding message to room: ${roomToAddTo}, message: ${JSON.stringify(messageToAdd)}`));
}

export const getOneFieldDataInRoom = async (roomCode: string, projection: object | string | Array<String>) => {
  return await ChatRoom.findOne({ code: roomCode }, projection).exec()
    .catch(err => handleError(err, `Getting field: ${projection} from chat room with code: ${roomCode}`));
}

export const getChatRoomData = async (roomCode: string) => {
  return await ChatRoom.findOne({
    code: roomCode
  }).exec()
    .catch(err => handleError(err, `Getting data for room with code: ${roomCode}`));
}

export const getRoomMessageCount = async (roomCode: string) => {
  return await ChatRoom.findOne({ code: roomCode }, "messageData.messageCount").exec()
    .catch(err => handleError(err, `Getting message count from chat room with code: ${roomCode}`));
}

export const getRoomChatHistorySlice = async (roomCode: string, start: number, end: number) => {
  return await ChatRoom.findOne({ code: roomCode }, {
        "messageData.history": {
            $slice : [ start, end ]
        }
  }).exec()
    .catch(err => handleError(err, `Getting message history from chat room with code: ${roomCode}`));
}

export const createNewEmptyChatRoom = async (
  roomCode: string,
  password: string,
  name: string,
  createdBy: string,
  createdDate: Date,
) => {
  return await ChatRoom.create({
    code: roomCode,
    password: password,
    name: name,
    createdBy: createdBy,
    createdDate: createdDate,
    owner: createdBy,
    members: [],
    messageData: {
      messageCount: 0,
      history: []
    }
  })
}
