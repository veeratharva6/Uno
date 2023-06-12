const express = require("express");
const { isAuthenticated } = require("../../middleware/auth.js");

const router = express.Router();

router.get("/:id", isAuthenticated, (_request, response) => {
  const { id } = _request.params;
  const user_id = _request.session.user ? _request.session.user.id : "";

  response.render("waitingroom", {
    id,
    user_id: user_id,
    title: "Term Project Oreos",
  });
});

module.exports = router;
