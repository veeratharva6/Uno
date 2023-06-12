const showMessage = (data) => {
  if (!document.getElementById("msg-id")) {
    return;
  }

  document.getElementById("msg-id").innerText = data.message;

  setTimeout(() => {
    document.getElementById("msg-id").innerText = "";
  }, 10000);
};

const getUserSession = async () => {
  try {
    const res = await fetch("/api/users/user-session");
    const data = await res.json();
    return data.user;
  } catch (err) {
    console.log(err);
  }
};

const getGameId = (location) => {
  const gameId = location.substring(location.lastIndexOf("/") + 1);

  if (gameId === "lobby") {
    return 0;
  } else {
    return parseInt(gameId);
  }
};

const createGame = async () => {
  const form = document.getElementById("create-game-form-id");
  const formData = new FormData(form);
  const formDataJson = {};

  for (const [key, value] of formData) {
    formDataJson[key] = value;
  }

  const userSession = await getUserSession();
  formDataJson["user_id"] = userSession.id;

  const options = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(formDataJson),
  };

  try {
    const res = await fetch("/api/games/create", options);
    const data = await res.json();

    if (data.status === 400) {
      showMessage(data);
      return;
    }
  } catch (err) {
    console.log(err);
  }
};

const getAllGames = async () => {
  try {
    const res = await fetch("/api/games/all-games", { method: "GET" });
    const data = await res.json();
    const messageArray = data.messageArray;

    if (data.status === 400 || data.status === 500) {
      return;
    }

    let gameList = document.getElementById("games-list-id");

    if (!gameList) {
      return;
    }

    gameList.innerHTML = "";

    messageArray.map((msg) => {
      let li = document.createElement("div");
      li.className = "game";
      li.innerHTML = `<a class="game-room-link" href="/waitingroom/${msg.id}">Title: ${msg.game_title}, # ${msg.id}, Players: ${msg.users_required}, Started: ${msg.ongoing}</a>`;
      gameList.appendChild(li);
    });
  } catch (err) {
    console.log(err);
  }
};

const getAllMessages = async () => {
  try {
    const res = await fetch("/api/games/lobby-chat", { method: "GET" });
    const data = await res.json();
    const messageArray = data.messageArray;

    if (data.status === 400 || data.status === 500) {
      return;
    }

    let chatList = document.getElementById("chat-list-id");

    if (!chatList) {
      return;
    }

    chatList.innerHTML = "";

    messageArray.map((msg) => {
      const date = new Date(msg.created_at);

      const createdAtFormatted = date.toLocaleString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "numeric",
      });

      let li = document.createElement("div");
      li.className = "message";

      let usernameSpan = document.createElement("span");
      usernameSpan.style.fontWeight = "bold";
      usernameSpan.textContent = msg.username;

      let createdAtSpan = document.createElement("span");
      createdAtSpan.style.marginLeft = "5px";
      createdAtSpan.textContent = createdAtFormatted;

      let messageP = document.createElement("p");
      messageP.style.margin = "5px";
      messageP.textContent = msg.message;

      li.appendChild(usernameSpan);
      li.appendChild(createdAtSpan);
      li.appendChild(document.createTextNode(": "));
      li.appendChild(messageP);

      chatList.appendChild(li);
    });
  } catch (err) {
    console.log(err);
  }
};

const sendMessage = async () => {
  const form = document.getElementById("send-chat-form-id");
  const formData = new FormData(form);
  const formDataJson = {};

  for (const [key, value] of formData) {
    formDataJson[key] = value;
  }

  const userSession = await getUserSession();
  formDataJson["user_id"] = userSession.id;
  formDataJson["username"] = userSession.username;
  const game_id = getGameId(document.location.pathname);
  formDataJson["game_id"] = game_id;

  const options = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(formDataJson),
  };

  try {
    const res = await fetch("/api/games/lobby-chat", options);
    const data = await res.json();

    if (data.status === 400 || data.status === 500) {
      showMessage(data);
      return;
    }
  } catch (err) {
    console.log(err);
  }
};

getAllMessages();
getAllGames();
