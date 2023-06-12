const showMessage = (data) => {
  if (!document.getElementById("msg-id")) {
    return;
  }

  document.getElementById("msg-id").innerText = data.message;

  setTimeout(() => {
    document.getElementById("msg-id").innerText = "";
  }, 5000);
};

const getGameId = (location) => {
  const gameId = location.substring(location.lastIndexOf("/") + 1);

  if (gameId === "lobby") {
    return 0;
  } else {
    return parseInt(gameId);
  }
};

const isOnGoingGame = async () => {
  const game_id = getGameId(document.location.pathname);
  let isOnGoing = false;

  try {
    const res = await fetch(`/api/waitingroom/${game_id}/ongoing`);
    const data = await res.json();
    isOnGoing = data.ongoing;

    if (data.status === 400 || data.status === 500) {
      showMessage(data);
      return;
    }

    if (isOnGoing) {
      window.location.href = `/games/${game_id}`;
    }
  } catch (err) {
    console.log(err);
  }
};

const checkPlayerCount = async () => {
  const game_id = getGameId(document.location.pathname);

  try {
    const res = await fetch(`/api/waitingroom/${game_id}/count`);
    const data = await res.json();

    if (data.status === 400 || data.status === 500) {
      showMessage(data);
      return;
    }
  } catch (err) {
    console.log(err);
  }
};

isOnGoingGame();
