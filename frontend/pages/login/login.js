const backendBaseURI = "http://localhost:7846"
const header = { "content-type": "application/json"}
const showPasswordCheck = document.getElementById('showPasswordBox');
const passwordInput = document.getElementById('passInput')
showPasswordCheck.checked = false;
passwordInput.type = 'password';

showPasswordCheck.addEventListener('change', () => {
  if (showPasswordCheck.checked)
    passwordInput.type = 'text';
  else
    passwordInput.type = 'password';
})


document.getElementById("loginForm").addEventListener('submit', async (e) => {
  e.preventDefault();

  const username = document.getElementById('usernameInput').value;
  const password = document.getElementById('passInput').value;
  const rememberMeVal = document.getElementById('rememberMeBox').checked;
  const payload = {
    username : username,
    password : password,
    rememberMe : rememberMeVal
  }

  const validate = await fetch(backendBaseURI +  "/login", {
    method : "POST",
    headers: header,
    credentials: 'include',
    body : JSON.stringify(payload)
  }).then(response => response.json());
  console.log(document.cookie);
  if (validate.success) {
    statusLabel.innerHTML = "Successfully logged in!"
    window.location.href = "./../chat/chat.html";
  }
  else {
    statusLabel.innerHTML = "Wrong Username or Password."
  }
})
