const db = require("./connection.js");

const create = async (username, message, room_id) => {
  return await db.one(
    "INSERT INTO game_room_messages (username, message, room_id) VALUES ($1, $2, $3) RETURNING created_at",
    [username, message, room_id]
  );
};

const get = async (game_id) => {
  return await db.many("SELECT * FROM game_room_messages WHERE room_id = $1", [
    game_id,
  ]);
};

module.exports = {
  create,
  get,
};
