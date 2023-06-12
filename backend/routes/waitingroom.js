const express = require("express");
const {
  checkPlayerCounts,
  isOnGoingGame,
} = require("../controllers/waitingroom.js");

const router = express.Router();
router.get("/:game_id/count", checkPlayerCounts);
router.get("/:game_id/ongoing", isOnGoingGame);

module.exports = router;
