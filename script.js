let stompClient = null;
let username = null;

document.addEventListener('DOMContentLoaded', function() {
    createRegistrationForm();
});

function createRegistrationForm() {
    const formContainer = document.createElement('div');
    formContainer.innerHTML = `
        <h2>Register</h2>
        <form id="registrationForm">
            <label for="username">Username:</label>
            <input type="text" id="regUsername" name="username" required><br><br>
            
            <label for="password">Password:</label>
            <input type="password" id="regPassword" name="password" required><br><br>
            
            <button type="submit">Register</button>
        </form>
    `;
    document.body.insertBefore(formContainer, document.body.firstChild);
    document.getElementById("registrationForm").addEventListener("submit", function(event) {
        event.preventDefault();
        registerTheUser();
    });
}

function createLoginForm() {
    const formContainer = document.createElement('div');
    formContainer.innerHTML = `
        <h2>Login</h2>
        <form id="loginForm">
            <label for="username">Username:</label>
            <input type="text" id="loginUsername" name="username" required><br><br>
            
            <label for="password">Password:</label>
            <input type="password" id="loginPassword" name="password" required><br><br>
            
            <button type="submit">Login</button>
        </form>
        <p id="loginError" style="color: red;"></p> <!-- Error message if login fails -->
    `;
    document.body.insertBefore(formContainer, document.body.firstChild);
    document.getElementById("loginForm").addEventListener("submit", function(event) {
        event.preventDefault();
        loginUser();
    });
}

function registerTheUser() {
    const username = document.getElementById("regUsername").value;
    const password = document.getElementById("regPassword").value;
    if (!username || !password) {
        alert("Please enter a username and password");
        return;
    }
    const user = {
        username: username,
        password: password
    };
    fetch("http://localhost:8080/users/register", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(user)
    })
    .then(response => {
        if (response.ok) {
            alert("User registered successfully! Please login.");
            // Hide registration form and show login form
            document.getElementById("registrationForm").parentElement.style.display = "none";
            createLoginForm();
        } else {
            return response.json().then(data => {
                alert(`Registration failed: ${data.message}`);
            });
        }
    })
    .catch(error => {
        console.error("Error during registration:", error);
        alert("An error occurred. Please try again later.");
    });
}

function loginUser() {
    const username = document.getElementById("loginUsername").value;
    const password = document.getElementById("loginPassword").value;
    if (!username || !password) {
        alert("Please enter a username and password");
        return;
    }
    const user = {
        username: username,
        password: password
    };
    fetch("http://localhost:8080/users/login", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(user)
    })
    .then(response => {
        if (response.ok) {
            // Hide login form and show chat
            document.getElementById("loginForm").parentElement.style.display = "none";
            connect();
            createChatInterface();
        } else {
            return response.json().then(data => {
                document.getElementById("loginError").textContent = "Invalid username or password";
            });
        }
    })
    .catch(error => {
        console.error("Error during login:", error);
        alert("An error occurred. Please try again later.");
    });
}

function createChatInterface() {
    const chatContainer = document.createElement('div');
    chatContainer.innerHTML = `
        <h1 id="center">First Chat Room</h1>
        <div>
            <h4>Username: ${username}</h4>
        </div>
        <div id="messages"></div>
        <div>
            <textarea id="messageInput" placeholder="Type a message"></textarea>
            <button onclick="sendMessage()">Send</button>
        </div>
    `;
    document.body.appendChild(chatContainer);
}

function connect() {
    username = document.getElementById("loginUsername").value;
    if (!username) {
        alert("Please enter a username");
        return;
    }

    const socket = new SockJS('http://localhost:8080/websocket');
    stompClient = Stomp.over(socket);
    stompClient.connect({}, function(frame) {
        console.log('Connected: ' + frame);

        stompClient.subscribe('/topic/openMessage', function (messageOutput) {
            showMessage(JSON.parse(messageOutput.body));
        });
        
        stompClient.subscribe('user/queue/privateMessage', function (messageOutput) {
            showMessage(JSON.parse(messageOutput.body));
        });
    });
}

function sendMessage() {
    const messageContent = document.getElementById("messageInput").value;
    if (!messageContent) {
        alert("Please enter a message");
        return;
    }

    const message = {
        from: username,
        to: "public",
        content: messageContent
    };
    stompClient.send("app/openChat", {}, JSON.stringify(message));
    document.getElementById("messageInput").value = "";
}

function showMessage(message) {
    const messageArea = document.getElementById("messages");
    messageArea.innerHTML += `<div><strong>${message.from}</strong>: ${message.content}</div>`;
    messageArea.scrollTop = messageArea.scrollHeight;
}
