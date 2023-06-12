const express = require("express");
const router = express.Router();
const { redirectToLobby } = require("../../middleware/auth.js");

router.get("/", (request, response) => {
  const user_id = request.session.user ? request.session.user.id : "";
  response.render("home", { user_id: user_id, title: "Term Project Oreos" });
});

module.exports = router;
