const WaitingRoom = {};
const { REDIRECT_TO_GAME_ROOM } = require("../sockets/constants.js");
const Games = require("../db/games.js");

WaitingRoom.isOnGoingGame = async (req, res) => {
  const { game_id } = req.params;

  try {
    const { ongoing } = await Games.isGameStarted(game_id);

    if (ongoing) {
      res.send({
        message: "Game has already started",
        status: 200,
        ongoing: ongoing,
      });
      return;
    }

    res.send({
      message: "Game has not started...",
      status: 200,
      ongoing: ongoing,
    });
  } catch (err) {
    console.log(err);
    res.send({ message: "Error occured...", status: 500 });
  }
};

WaitingRoom.checkPlayerCounts = async (req, res) => {
  const io = req.app.get("io");
  const { game_id } = req.params;

  try {
    if (!io.sockets.adapter.rooms.get(+game_id)) {
      res.send({ message: "An error occured", status: 500 });
      return;
    }

    const numPlayers = io.sockets.adapter.rooms.get(+game_id).size;
    const { users_required } = await Games.getNumberOfPlayers(game_id);

    if (numPlayers < users_required) {
      res.send({
        message: `Need at least ${users_required}  players`,
        status: 400,
      });
      return;
    }

    io.in(+game_id).emit(REDIRECT_TO_GAME_ROOM, { game_id });
    res.send({ message: "Starting game...", status: 200 });
  } catch (err) {
    console.log(err);
    res.send({ message: "Error occured...", status: 500 });
  }
};

module.exports = WaitingRoom;
