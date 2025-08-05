const statusLabel = document.getElementById('statusLabel');
const backendBaseURI = "http://localhost:7846"
const header = { "content-type": "application/json" }
const usernameInput = document.getElementById('usernameInput');
const passInput = document.getElementById('passInput');
const confirmPassInput = document.getElementById('confirmPassInput');

const showPasswordCheck = document.getElementById('showPasswordBox');
showPasswordCheck.checked = false;
passInput.type = 'password';
confirmPassInput.type = 'password';

showPasswordCheck.addEventListener('change', () => {
  if (showPasswordCheck.checked) {
    passInput.type = 'text';
    confirmPassInput.type = 'text';
  }
  else {
    passInput.type = 'password';
    confirmPassInput.type = 'password';
  }
})

document.getElementById('signupForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const username = usernameInput.value;
  const password = passInput.value;
  const reEnteredPass = confirmPassInput.value;
  const rememberMeVal = document.getElementById('rememberMeBox').checked;

  if (password !== reEnteredPass) {
    statusLabel.innerHTML = "Re-entered password doesnt match";
    return;
  }

  const payload = {
    username: username,
    password: password,
    rememberMe: rememberMeVal
  }

  const signup = await fetch(backendBaseURI + "/signup", {
    method: "POST",
    headers: header,
    body: JSON.stringify(payload)
  }).then(response => response.json());

  if (signup.success) {
    statusLabel.innerHTML = "Successfully signed up!"

    const validate = await fetch(backendBaseURI + "/login", {
      method: "POST",
      headers: header,
      credentials: 'include',
      body: JSON.stringify(payload)
    }).then(response => response.json());
    console.log(document.cookie);
    if (validate.success) {
      window.location.href = "./../chat/chat.html";
    }
  }
  else {
    statusLabel.innerHTML = "Something went wrong.. Try again."
  }
});
