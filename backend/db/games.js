const db = require("./connection.js");

const create = async (
  game_title,
  ongoing,
  top_deck,
  top_discard,
  position,
  users_required
) => {
  return await db.one(
    "INSERT INTO games (game_title, ongoing, top_deck, top_discard, position, users_required) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id",
    [game_title, ongoing, top_deck, top_discard, position, users_required]
  );
};

const getAll = async () => {
  return await db.many("SELECT * FROM games");
};

const isGameStarted = async (game_id) => {
  return await db.oneOrNone("SELECT ongoing FROM games WHERE id = $1", [
    game_id,
  ]);
};

const getNumberOfPlayers = async (game_id) => {
  return await db.oneOrNone("SELECT users_required FROM games WHERE id = $1", [
    game_id,
  ]);
};

const setGameOngoing = async (ongoing, game_id) => {
  return await db.oneOrNone(
    "UPDATE games SET ongoing=$1 WHERE id = $2 RETURNING ongoing",
    [ongoing, game_id]
  );
};

const saveGameState = async (game_id, top_deck, top_discard, position) => {
  return await db.oneOrNone(
    "UPDATE games set top_deck=$2, top_discard=$3, position=$4 WHERE id=$1 RETURNING *",
    [game_id, top_deck, top_discard, position]
  );
};

const getGameState = async (game_id) => {
  return await db.oneOrNone("SELECT * FROM games WHERE id=$1", [game_id]);
};

const getAllCards = async () => {
  return await db.manyOrNone("SELECT * FROM cards");
};

const getAllUserCards = async (user_id, game_id) => {
  return await db.manyOrNone(
    "SELECT card_id FROM user_cards WHERE user_id = $1 AND game_id=$2",
    [user_id, game_id]
  );
};

const createGameUser = async (game_id, user_id, ongoing) => {
  const { max_turn } = await db.one(
    "SELECT COALESCE(MAX(turn), -1) + 1 as max_turn FROM game_users WHERE game_id = $1",
    game_id
  );

  const turn = max_turn !== null ? parseInt(max_turn) : 0;

  return await db.tx(async (transaction) => {
    const previousPlayer = await transaction.oneOrNone(
      "SELECT user_id FROM game_users WHERE game_id = $1 AND turn = $2 FOR UPDATE",
      [game_id, turn]
    );

    const nextPlayerTurn = previousPlayer ? turn + 1 : turn;

    return await transaction.oneOrNone(
      "INSERT INTO game_users (game_id, user_id, ongoing, turn) VALUES ($1, $2, $3, $4) RETURNING *",
      [game_id, user_id, ongoing, nextPlayerTurn]
    );
  });
};

const isPlayerStarted = async (user_id, game_id) => {
  return await db.oneOrNone(
    "SELECT ongoing FROM game_users WHERE user_id=$1 AND game_id=$2",
    [user_id, game_id]
  );
};

const isPlayerExist = async (user_id, game_id) => {
  return await db.oneOrNone(
    "SELECT user_id FROM game_users WHERE user_id=$1 AND game_id=$2",
    [user_id, game_id]
  );
};

const createPlayerCard = async (game_id, user_id, card_id) => {
  return await db.oneOrNone(
    "INSERT INTO user_cards (game_id, user_id, card_id) VALUES ($1, $2, $3) RETURNING card_id",
    [game_id, user_id, card_id]
  );
};

const getPlayerCards = async (game_id, user_id) => {
  return await db.manyOrNone(
    "SELECT * FROM user_cards WHERE game_id=$1 AND user_id=$2",
    [game_id, user_id]
  );
};

const getPlayerTurn = async (game_id, user_id) => {
  const result = await db.one(
    "SELECT turn FROM game_users WHERE game_id=$1 AND user_id=$2",
    [game_id, user_id]
  );
  return parseInt(result.turn);
};

const getCurrentPlayerName = async (game_id, position) => {
  return await db.oneOrNone(
    "SELECT username FROM game_users AS gu INNER JOIN users AS u ON gu.user_id=u.id WHERE gu.game_id=$1 AND gu.turn=$2",
    [game_id, position]
  );
};

const getCurrentGamePosition = async (game_id) => {
  const result = await db.one(
    "SELECT position FROM games WHERE id=$1",
    game_id
  );
  return parseInt(result.position);
};

const updateGamePosition = async (game_id, position) => {
  return await db.oneOrNone(
    "UPDATE games SET position=$2 WHERE id=$1 RETURNING position",
    [game_id, position]
  );
};

const getUserID = async (game_id, turn) => {
  const result = await db.one(
    "SELECT user_id FROM game_users WHERE game_id=$1 AND turn=$2",
    [game_id, turn]
  );
  return parseInt(result.user_id);
};


module.exports = {
  create,
  getAll,
  isGameStarted,
  setGameOngoing,
  getNumberOfPlayers,
  saveGameState,
  getGameState,
  getAllCards,
  getAllUserCards,
  createGameUser,
  createPlayerCard,
  isPlayerStarted,
  isPlayerExist,
  getPlayerCards,
  getPlayerTurn,
  getCurrentGamePosition,
  updateGamePosition,
  getCurrentPlayerName,
  getUserID,
};
