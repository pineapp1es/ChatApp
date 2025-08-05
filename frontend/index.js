const backendBaseURI = "http://localhost:7846"
const header = { "content-type": "application/json" }

const autoLogin = await fetch(backendBaseURI + "/autoCookieLogin", {
  method: "POST",
  headers: header,
  credentials: 'include',
}).then(response => response.json());
if (autoLogin.success) {
  window.location.href = "./pages/chat/chat.html";
}
else {
  window.location.href = "./pages/login/login.html"
}
