const chatRoomsContainer = document.getElementById('chatRoomsContainer')
import { socket, switchRoom, chatRoomsInfo } from "./message";

socket.on("chatRoomsData", (data) => {
    chatRoomsContainer.innerHTML = ""
    for (let room of data.rooms) {
        chatRoomsInfo[room.code] = {
            code: room.code,
            password: room.password,
            name: room.name,
            createdBy: room.createdBy,
            createdDate: room.createdDate,
        }
        chatRoomsContainer.innerHTML =
            chatRoomsContainer.innerHTML +
            `<button class="chatRoomButton" id="roomCode:${room.code}">` +
            room.name + "</button>";
	document.getElementById(`roomCode:${room.code}`).addEventListener('click', () => switchRoom(room.code))
    }

});

function createChatRoom() {
}
