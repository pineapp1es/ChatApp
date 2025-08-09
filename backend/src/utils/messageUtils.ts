import { logger } from "@utils/loggerUtil.ts";


// Example of what the function does:
// messageHistory: [
//      {
//          messageNumber: 73,
//          sender: "pineapple",
//          sentTimeInEpoch: <someEpochTime>
//          type: "text",
//          content: "hello"
//      },
//      {
//          messageNumber: 74,
//          sender: "mango",
//          sentTimeInEpoch: <someEpochTime>
//          type: "image",
//          content: "/link/to/image"
//      }
// ]
//
// formattedMessageHistory: {
//      73: "[<someDate>][<someTime>][pineapple]:<br>hello"
//      74: "[<someDate>][<someTime>][mango]:<br><img src"/link/to/image" alt="/link/to/image">"
// }
export const parseMessageHistoryToClientFormat = (messageHistory: Array<any>) => {

    logger.debug("Formatting messages to HTML for client(s)....")

    const formattedMessageHistory : {[k: string]: any} = {};

    for (let i = 0; i < messageHistory.length; i++) {
        const currMessageData = messageHistory[i];

        const messageType = currMessageData.type;
        let content = currMessageData.content;
        if (messageType == 'image')
            content = `<img src="${content}" alt="${content}">`

        const date = new Date(0);
        date.setUTCMilliseconds(currMessageData.sentTimeInEpoch);
        const formattedDateString = date.getDate() + "/" + (date.getMonth() + 1) + "/" + date.getFullYear();
        const formattedTimeString = date.getHours().toString().padStart(2, '0') +
            ":" + date.getMinutes().toString().padStart(2, '0') +
            ":" + date.getSeconds().toString().padStart(2, '0');

        const msgFormattedStringHTML = `[${formattedDateString}][${formattedTimeString}][${currMessageData.sender}]:<br>`
            + content;
        formattedMessageHistory[currMessageData.messageNumber.toString()] = msgFormattedStringHTML;
    }

    logger.debug("Done!")
    return formattedMessageHistory;
}
