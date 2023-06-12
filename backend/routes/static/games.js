const express = require("express");
const router = express.Router();
const { isAuthenticated } = require("../../middleware/auth.js");

router.get("/:id", isAuthenticated, (request, response) => {
  const { id } = request.params;
  const user_id = request.session.user ? request.session.user.id : "";

  response.render("games", {
    id,
    user_id: user_id,
    title: "Term Project Oreos",
  });
});

module.exports = router;
