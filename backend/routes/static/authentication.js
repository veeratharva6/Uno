const express = require("express");
const router = express.Router();
const { redirectToLobby } = require("../../middleware/auth.js");

router.get("/register", redirectToLobby, (_request, response) => {
  response.render("register", { title: "Term Project Oreos" });
});

router.get("/login", redirectToLobby, (_request, response) => {
  response.render("login", { title: "Term Project Oreos" });
});

module.exports = router;
