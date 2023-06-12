import io from "socket.io-client";
import { getGameId } from "./get-game-id";
import { showMessage } from "./show-alert-message";
import {
  CHAT,
  JOIN_GAME,
  CREATE_GAME,
  START_GAME,
  REDIRECT_TO_GAME_ROOM,
  PLAY_CARD,
  DRAW_CARD,
  CALL_UNO,
  LEAVE_GAME,
} from "./constants";

const socket = io();
const game_id = getGameId(document.location.pathname);
const imgPath = "../images/";
const user = JSON.parse(localStorage.getItem("user"));

const quitBtn = document.getElementById("quit-btn-id");

if (quitBtn) {
  quitBtn.addEventListener("click", () => {
    socket.emit(LEAVE_GAME, { game_id, user });
  });
}

socket.emit(JOIN_GAME, { game_id, user });

socket.on(REDIRECT_TO_GAME_ROOM, ({ game_id }) => {
  window.location.href = `/games/${game_id}`;
});

socket.on(CREATE_GAME, ({ gametitle, count, game_id, ongoing }) => {
  let gamesList = document.getElementById("games-list-id");

  if (!gamesList) {
    return;
  }

  let li = document.createElement("div");
  li.style.backgroundColor = "rgb(139, 246, 210)";
  li.style.marginBottom = "1px";
  li.innerHTML = `<a class="game-room-link" href="/waitingroom/${game_id}">Title: ${gametitle}, # ${game_id} Players: ${count}, Started: ${ongoing}</a>`;
  gamesList.appendChild(li);
});

socket.on(CHAT, ({ message, username }) => {
  let chatList = document.getElementById("chat-list-id");

  if (!chatList) {
    return;
  }

  const createdAtFormatted = new Date().toLocaleString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "numeric",
  });

  let li = document.createElement("div");
  li.style.backgroundColor = "rgb(59, 245, 149)";
  li.style.marginBottom = "1px";

  let usernameSpan = document.createElement("span");
  usernameSpan.style.fontWeight = "bold";
  usernameSpan.textContent = username;

  let createdAtSpan = document.createElement("span");
  createdAtSpan.style.marginLeft = "5px";
  createdAtSpan.textContent = createdAtFormatted;

  let messageP = document.createElement("p");
  messageP.style.margin = "5px";
  messageP.textContent = message;

  li.appendChild(usernameSpan);
  li.appendChild(createdAtSpan);
  li.appendChild(document.createTextNode(": "));
  li.appendChild(messageP);

  chatList.appendChild(li);
});

const updateOpponentCards = (players) => {
  const parentHandUI = document.getElementById("opponents-hand-parent-id");
  parentHandUI.innerHTML = "";

  players.forEach((player) => {
    if (user.id !== player.user_id) {
      let playerHandUI = document.createElement("div");
      playerHandUI.innerHTML = "";
      playerHandUI.id = "opponent-hand-id";
      playerHandUI.className = "opponent-hand";
      const playerTitle = document.createElement("p");
      playerTitle.innerText = `Opponent: ${player.name}`;
      playerTitle.className = "player-name";

      player.hand.forEach((card) => {
        const cardImage = document.createElement("img");
        cardImage.setAttribute("src", `${imgPath}back.png`);
        cardImage.id = card + "-id";
        cardImage.setAttribute("class", "opponent-card");
        cardImage.setAttribute("width", "100px");
        cardImage.setAttribute("height", "135px");
        playerHandUI.appendChild(cardImage);
      });

      parentHandUI.appendChild(playerTitle);
      parentHandUI.appendChild(playerHandUI);
    }
  });
};

socket.on(
  START_GAME,
  ({ top_deck, top_discard, players, currentPlayerName }) => {
    console.log(currentPlayerName);
    if (
      !document.getElementById("deck-img-id") ||
      !document.getElementById("discard-img-id") ||
      !document.getElementById("current-player-name-id")
    ) {
      return;
    }

    document.getElementById("deck-img-id").src = imgPath + top_deck;
    document.getElementById("discard-img-id").src = imgPath + top_discard;
    document.getElementById("current-player-name-id").innerText =
      currentPlayerName;

    updateOpponentCards(players);
  }
);

socket.on(JOIN_GAME, ({ message, numPlayers }) => {
  if (!document.getElementById("num-of-players-id")) {
    return;
  }

  if (game_id && game_id !== 0) {
    document.getElementById("num-of-players-id").innerText =
      "Number of Players: " + numPlayers;
  }

  showMessage(message);
});

socket.on(LEAVE_GAME, ({ message, numPlayers }) => {
  if (!document.getElementById("num-of-players-id")) {
    return;
  }

  if (game_id && game_id !== 0) {
    document.getElementById("num-of-players-id").innerText =
      "Number of Players: " + numPlayers;
  }

  showMessage(message);
});

socket.on(
  PLAY_CARD,
  ({ top_discard, game_id, players, currentPlayerName, draw2CardsUserId }) => {
    if (draw2CardsUserId && draw2CardsUserId === user.id) {
      window.location.href = `/games/${game_id}`;
      return;
    }
    document.getElementById("discard-img-id").src = imgPath + top_discard;
    document.getElementById("current-player-name-id").innerText =
      currentPlayerName;
    updateOpponentCards(players);
  }
);

socket.on(DRAW_CARD, ({ top_deck, players, currentPlayerName }) => {
  document.getElementById("deck-img-id").src = imgPath + top_deck;
  document.getElementById("current-player-name-id").innerText =
    currentPlayerName;
  updateOpponentCards(players);
});

socket.on(CALL_UNO, ({ message }) => {
  document.getElementById("call-uno-msg-id").innerText = message;

  setTimeout(() => {
    document.getElementById("call-uno-msg-id").innerText = "";
  }, 7000);
});
