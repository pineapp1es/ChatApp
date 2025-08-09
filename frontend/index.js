const backendBaseURI = "http://localhost:7846"
const header = { "content-type": "application/json" }

const autoLogin = await fetch(backendBaseURI + "/cookieLogin", {
  method: "POST",
  headers: header,
  credentials: 'include',
});
if (autoLogin.ok) {
  window.location.href = "./pages/chat/chat.html";
}
else {
  window.location.href = "./pages/login/login.html"
}
