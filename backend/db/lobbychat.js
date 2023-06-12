const db = require("./connection.js");

const create = async (username, message) => {
  return await db.one(
    "INSERT INTO lobby_messages (username, message) VALUES ($1, $2) RETURNING created_at",
    [username, message]
  );
};

const get = async () => {
  return await db.many("SELECT * FROM lobby_messages");
};

module.exports = {
  create,
  get,
};
