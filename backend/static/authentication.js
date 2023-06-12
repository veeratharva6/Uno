const express = require("express");
const router = express.Router();


router.get("/register", (_request, response) => {
  response.render("register", { title: "Team Oreos Term Project" });
});

router.post("/register", (_request, response) => {
    response.render("register", { title: "Team Oreos Term Project" });
  });



router.get("/login", (_request, response) => {
  response.render("login", { title: "Team Oeros Term Project" });
});

router.get("/post", (_request, response) => {
    response.render("login", { title: "Team Oeros Term Project" });
});

router.get("/logout", (_request, response) => {
    response.redirect("/");
});


module.exports = router;
