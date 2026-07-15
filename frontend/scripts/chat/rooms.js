const chatRoomsContainer = document.getElementById('chatRoomsContainer')
import { socket, switchRoom } from "./message";

socket.on("chatRoomsData", (data) => {
    chatRoomsContainer.innerHTML = ""
    for (let room of data.rooms) {
        chatRoomsContainer.innerHTML =
            chatRoomsContainer.innerHTML +
            `<button class="chatRoomButton" id="roomCode:${room.code}">` +
            room.name + "</button>";
	document.getElementById(`roomCode:${room.code}`).addEventListener('click', () => switchRoom(room.code))
    }

});

function createChatRoom() {
}
