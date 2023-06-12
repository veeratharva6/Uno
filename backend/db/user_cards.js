const db = require("./connection.js");

const drawCard = async (game_id, user_id, card_id) => {
  return await db.one(
    "INSERT INTO user_cards (game_id, user_id, card_id) VALUES ($1, $2, $3) RETURNING *",
    [game_id, user_id, card_id[0]]
  );
};

const get = async (game_id, user_id) => {
  return await db.many(
    "SELECT card_id FROM user_cards WHERE game_id = $1 AND user_id = $2",
    [game_id, user_id]
  );
};

const playCard = async (game_id, user_id, cardIDs, copiesOfCard) => {
  if(copiesOfCard == 1) {
    return await db.any(
      "DELETE FROM user_cards WHERE game_id = $1 AND user_id = $2 AND card_id = $3 RETURNING *",
      [game_id, user_id, cardIDs[0]]
    );
  };
  if(copiesOfCard == 2) {
    return await db.any(
      "DELETE FROM user_cards WHERE ctid IN ( SELECT ctid FROM user_cards WHERE game_id = $1 AND user_id = $2 AND (card_id = $3 OR card_id = $4) LIMIT 1)",
      [game_id, user_id, cardIDs[0], cardIDs[1]]
    );
  };
  if(copiesOfCard == 4) {
    return await db.any(
      "DELETE FROM user_cards WHERE ctid IN ( SELECT ctid FROM user_cards WHERE game_id = $1 AND user_id = $2 AND (card_id = $3 OR card_id = $4 OR card_id = $5 OR card_id = $6) LIMIT 1)",
      [game_id, user_id, cardIDs[0], cardIDs[1], cardIDs[2], cardIDs[3]]
    );
  };

};

const findCardID = async (card_color, card_number) => {
  const result = await db.any(
    "SELECT card_id FROM cards WHERE card_color = $1 AND card_number = $2",
    [card_color, card_number]
  );
  //parse the result to get the card_id into an array
  let resultArray = [];
  for (let i = 0; i < result.length; i++) {
    resultArray.push(parseInt(result[i].card_id));
  }
  return resultArray;

};


module.exports = {
  drawCard,
  get,
  playCard,
  findCardID,
};

