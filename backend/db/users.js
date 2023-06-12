const db = require("./connection.js");

const create = (username, email, hash) =>
  db.oneOrNone(
    "INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING id",
    [username, email, hash]
  );

const findByEmailOrUsername = (email, oldUsername) =>
  db.oneOrNone("SELECT * FROM users WHERE email=$1 OR username=$2", [
    email,
    oldUsername,
  ]);

module.exports = {
  create,
  findByEmailOrUsername,
};
