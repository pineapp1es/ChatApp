const chatRoomsContainer = document.getElementById('chatRoomsContainer')
import { socket } from "./message";

socket.on("chatRoomsData", (data) => {
    for (let room of data.rooms) {
        chatRoomsContainer.innerHTML =
            chatRoomsContainer.innerHTML +
            `<button class="chatRoomButton" id="roomCode:${room.code}">` +
            room.name + "</button>";
    }

    document.getElementById(`roomCode:${data.code}`).addEventListener('click', () => switchRooms(data.code))
});

function switchRooms(code) {
    console.log(code)
}
