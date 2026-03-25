const chatRoomsContainer = document.getElementById('chatRoomsContainer')
import { socket } from "./message";

socket.on("chatRoomsData", (data) => {
    for (let room of data.rooms) {
        chatRoomsContainer.innerHTML =
            chatRoomsContainer.innerHTML +
            '<button class="chatRoomButton" onclick="switchRoom(' + room.code + ')">' +
            room.name + "</button>";
    }
});
