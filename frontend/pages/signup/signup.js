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
  });

  if (signup.ok) {
    statusLabel.innerHTML = "Successfully signed up!"

    const validate = await fetch(backendBaseURI + "/login", {
      method: "POST",
      headers: header,
      credentials: 'include',
      body: JSON.stringify(payload)
    });

    if (validate.ok) {
      window.location.href = "./../chat/chat.html";
    }
  }
  else if (signup.status == 400) {
    statusLabel.innerHTML = "User with that username already exists. Please try a different username."
  }
  else {
    statusLabel.innerHTML = "Something went wrong.. Try again."
  }
});
