const bcrypt = require("bcrypt");
const Users = require("../db/users.js");

const User = {};
const SALT_ROUNDS = 10;

User.signin = async (req, res) => {
  const { password } = req.body;
  const oldUsername = req.body.username;
  const email = req.body.emailAddress;

  try {
    const {
      id,
      username,
      password: hash,
    } = await Users.findByEmailOrUsername(email, oldUsername);
    const isValidUser = await bcrypt.compare(password, hash);

    if (isValidUser) {
      req.session.user = {
        id,
        username,
        email,
      };

      res.send({
        url: "/lobby",
        status: 200,
        user: { username: username, id: id },
      });
    } else {
      res.send({ message: "Invalid credentials", status: 400 });
    }
  } catch (error) {
    res.send({ message: "Error signing in", status: 500 });
  }
};

User.register = async (req, res) => {
  const { username, password } = req.body;
  const email = req.body.emailAddress;

  if (
    !username ||
    !email ||
    !password ||
    username.length === 0 ||
    email.length === 0 ||
    password.length === 0
  ) {
    res.send({ message: "Fields cannot be blank", status: 400 });
    return;
  }

  const salt = await bcrypt.genSalt(SALT_ROUNDS);
  const hash = await bcrypt.hash(password, salt);

  try {
    const oldUser = await Users.findByEmailOrUsername(email, username);
    if (oldUser?.email) {
      res.send({ message: "Error signing up", status: 400 });
      return;
    }

    const result = await Users.create(username, email, hash);
    const id = result.id;

    req.session.user = {
      id,
      username,
      email,
    };

    res.send({
      url: "/lobby",
      status: 200,
      user: { username: username, id: id },
    });
  } catch (error) {
    res.send({ message: "Error signing up", status: 500 });
  }
};

User.signout = async (req, res) => {
  try {
    req.session.destroy();
    res.send({ url: "/", status: 200 });
  } catch (err) {
    res.send({ message: "Error logging out", status: 500 });
  }
};

User.getUserSession = async (req, res) => {
  res.send({ user: req.session.user });
};

module.exports = User;
