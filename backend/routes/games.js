const express = require("express");
const {
  createGame,
  startGame,
  endGame,
  playCard,
  drawCard,
  callUno,
  sendMessage,
  getAllMessages,
  saveGameState,
} = require("../controllers/games.js");

const {
  sendMessageLobby,
  getMessageLobby,
  getAllGames,
} = require("../controllers/lobby.js");

const { isAuthenticated } = require("../middleware/auth.js");

const router = express.Router();
router.post("/create", isAuthenticated, createGame);
router.post("/lobby-chat", isAuthenticated, sendMessageLobby);
router.get("/lobby-chat", isAuthenticated, getMessageLobby);
router.post("/:game_id/start", isAuthenticated, startGame);
router.post("/:game_id/end", isAuthenticated, endGame);
router.put("/:game_id/play", isAuthenticated, playCard);
router.put("/:game_id/draw", isAuthenticated, drawCard);
router.put("/:game_id/uno", isAuthenticated, callUno);
router.post("/:game_id/chat", isAuthenticated, sendMessage);
router.get("/:game_id/chat", isAuthenticated, getAllMessages);
router.get("/all-games", isAuthenticated, getAllGames);
router.put("/:game_id/state", isAuthenticated, saveGameState);

module.exports = router;
