const { CHAT } = require("../sockets/constants.js");
const Chat = require("../db/lobbychat.js");
const Lobby = {};
const Games = require("../db/games.js");

Lobby.sendMessageLobby = async (req, res) => {
  const { message, user_id, username, game_id } = req.body;
  const io = req.app.get("io");

  if (!user_id || !username) {
    res.send({ message: "Bad Request", status: 400 });
    return;
  }

  if (!message || message.trim().length === 0) {
    res.send({ message: "Please type a message", status: 400 });
    return;
  }

  try {
    await Chat.create(username, message);
    io.in(game_id).emit(CHAT, { message, username });
    res.send({ message: message, username: username, status: 200 });
  } catch (err) {
    console.log(err);
    res.send({ message: "Error sending message", status: 500 });
    return;
  }
};

Lobby.getMessageLobby = async (req, res) => {
  try {
    const messageArray = await Chat.get();
    res.send({ messageArray: messageArray, status: 200 });
  } catch (err) {
    res.send({ message: "Error sending message", status: 500 });
  }
};

Lobby.getAllGames = async (req, res) => {
  try {
    const messageArray = await Games.getAll();
    res.send({ messageArray: messageArray, status: 200 });
  } catch (err) {
    res.send({ message: "Error getting all messages", status: 500 });
  }
};

module.exports = Lobby;
