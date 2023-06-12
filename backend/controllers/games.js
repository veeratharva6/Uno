const {
  CHAT,
  CREATE_GAME,
  START_GAME,
  PLAY_CARD,
  DRAW_CARD,
  CALL_UNO,
} = require("../sockets/constants.js");
const Game = {};
const GAMECHAT = require("../db/gamechat.js");
const Games = require("../db/games.js");
const user_cards = require("../db/user_cards.js");

let top_deck = "";
let top_discard = "";
let position = 0;
let players = [];
let hostPlayer = {};
let cardsSet = new Set();
let isInReverse = false;

const shuffleCards = (cards) => {
  let temp = null;
  for (let i = cards.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    temp = cards[i];
    cards[i] = cards[j];
    cards[j] = temp;
  }

  return cards;
};
const getCards = async () => {
  const cardsArr = [];

  const cards = await Games.getAllCards();

  for (const card of cards) {
    cardsArr.push({
      id: card.card_id,
      name: card.card_color + "-" + card.card_number + ".png",
    });
  }

  return cardsArr;
};

const getCardID = (str) => {
  const regex = /^(\d+)-(\d+)\.png$/;
  const match = str.match(regex);

  if (match) {
    const firstInteger = parseInt(match[1]);
    const secondInteger = parseInt(match[2]);
    return [firstInteger, secondInteger];
  }

  return null;
};

const getCurrentPlayerName = async (game_id) => {
  const player = await Games.getCurrentPlayerName(game_id, position);
  const username = "Current Turn: " + player?.username;
  return username;
};

const getRandomCard = () => {
  let color, number;

  do {
    color = Math.floor(Math.random() * 5);
    number = Math.floor(Math.random() * 15);
  } while (
    (number >= 13 && color < 4) ||
    (number < 13 && (color === 3 || color === 4))
  );

  return [color, number];
};

Game.createGame = async (req, res) => {
  const { gametitle, count, user_id } = req.body;
  const io = req.app.get("io");

  if (!user_id) {
    res.send({ message: "Bad Request", status: 400 });
    return;
  }

  if (!gametitle || gametitle.trim().length === 0 || !count) {
    res.send({ message: "Please fill out game info", status: 400 });
    return;
  }

  const game_title = gametitle;
  const users_required = count;

  let top_deck_arr = getRandomCard();
  top_deck = `${top_deck_arr[0]}-${top_deck_arr[1]}`;
  let top_discard_arr = getRandomCard();
  top_discard = `${top_discard_arr[0]}-${top_discard_arr[1]}`;

  const maxAttempts = 20;
  let attempts = 0;
  while (top_deck === top_discard && attempts < maxAttempts) {
    top_deck_arr = getRandomCard();
    top_deck = `${top_deck_arr[0]}-${top_deck_arr[1]}`;
    top_discard_arr = getRandomCard();
    top_discard = `${top_discard_arr[0]}-${top_discard_arr[1]}`;
    attempts++;
  }

  const { id: game_id } = await Games.create(
    game_title,
    false,
    top_deck,
    top_discard,
    0,
    users_required
  );

  io.emit(CREATE_GAME, { gametitle, count, user_id, game_id, ongoing: false });
  res.send({
    game_id: game_id,
    gametitle: gametitle,
    ongoing: false,
    player_count: count,
    user_id: user_id,
    status: 201,
  });
};

const addPlayersCardsToSet = () => {
  cardsSet = new Set();
  cardsSet.add(top_deck);
  cardsSet.add(top_discard);
  players.forEach((player) => {
    player.hand?.forEach((card) => {
      cardsSet.add(card);
    });
  });
};

const handleExistingPlayer = (playerInfo, user_id) => {
  let foundExistingPlayer = false;

  for (let i = 0; i < players.length; i++) {
    if (players[i].user_id === user_id) {
      foundExistingPlayer = true;
      players[i].hand = playerInfo.hand;
      break;
    }
  }

  if (!foundExistingPlayer) {
    players.push(playerInfo);
    return;
  }
};

const setTopDeckAndDiscard = async (game_id) => {
  const gameState = await Games.getGameState(game_id);
  top_deck = gameState.top_deck ? gameState.top_deck + ".png" : "0-0.png";
  top_discard = gameState.top_discard
    ? gameState.top_discard + ".png"
    : "1-1.png";
  cardsSet.add(top_deck);
  cardsSet.add(top_discard);
};

Game.startGame = async (req, res) => {
  const { game_id, user_id } = req.body;

  try {
    const io = req.app.get("io");

    const numPlayers = io.sockets.adapter.rooms.get(game_id).size;

    let users_required = await Games.getNumberOfPlayers(game_id);
    users_required = users_required?.users_required || 2;

    if (numPlayers < users_required) {
      res.send({
        url: `/lobby`,
        message: `Need at least ${users_required} players`,
        status: 400,
      });
      return;
    }

    let isPlayerExist = await Games.isPlayerExist(user_id, game_id);
    isPlayerExist = isPlayerExist?.user_id || null;
    const currentPlayerName = await getCurrentPlayerName(game_id);

    if (isPlayerExist) {
      const userCards = await Games.getAllUserCards(user_id, game_id);

      const userCardsObj = {};
      userCards.forEach((elem) => {
        userCardsObj[elem.card_id] = elem;
      });

      let cardsArr = await getCards();
      let cards = shuffleCards(cardsArr);

      const playerInfo = {
        name: req.session.user?.username,
        user_id: user_id,
        hand: [],
      };

      cards.forEach((card) => {
        if (card.id in userCardsObj) {
          playerInfo.hand.push(card.name);
        }
      });

      handleExistingPlayer(playerInfo, user_id);
      await setTopDeckAndDiscard(game_id);
      addPlayersCardsToSet();

      io.in(game_id).emit(START_GAME, {
        top_deck,
        top_discard,
        game_id,
        players,
        currentPlayerName,
      });
      res.send({
        message: "Game already started",
        status: 200,
        playerInfo: playerInfo,
        hostPlayer: hostPlayer,
      });
      return;
    }

    let cardsArr = await getCards();
    let cards = shuffleCards(cardsArr);
    const playerInfo = {
      name: req.session.user?.username,
      user_id: user_id,
      hand: [],
    };

    await Games.createGameUser(game_id, user_id, true);
    await setTopDeckAndDiscard(game_id);

    const cardsInHand = 7;
    for (let i = 0; i < cardsInHand; i++) {
      let poppedCard = cards.pop();
      let card_id = poppedCard.id;
      let card_name = poppedCard.name;

      const maxAttempts = 20;
      let attempts = 0;
      while (cardsSet.has(card_name) && attempts < maxAttempts) {
        poppedCard = cards.pop();
        card_id = poppedCard.id;
        card_name = poppedCard.name;
        attempts++;
      }

      await Games.createPlayerCard(game_id, user_id, card_id);
      playerInfo.hand.push(card_name);
      cardsSet.add(card_name);
    }
    let ongoingUpdated = await Games.setGameOngoing(true, game_id);

    ongoingUpdated = ongoingUpdated?.ongoing || false;

    handleExistingPlayer(playerInfo, user_id);
    addPlayersCardsToSet();

    io.in(game_id).emit(START_GAME, {
      top_deck,
      top_discard,
      game_id,
      players,
      currentPlayerName,
    });
    res.send({
      message: "Game started",
      playersCount: numPlayers,
      playerInfo: playerInfo,
      hostPlayer: hostPlayer,
      ongoingUpdated: ongoingUpdated,
      status: 200,
    });
  } catch (err) {
    console.log(err);
    res.send({ message: "Error occured", status: 500 });
  }
};

Game.endGame = async (req, res) => {
  // TODO implement
  res.send({ message: "Game ended" });
};

// ------------------------
// Play Card
// ------------------------
Game.playCard = async (req, res) => {
  // make sure user is in the game
  // make sure player turn
  // make sure player can play the card
  // handle special hards

  //user_id = user who played the card
  //game_id = game where the card was played in
  //card_id = id of the discard card that needs to be matched with
  const { game_id, user_id, card_id } = req.body; //extract from the request body
  const io = req.app.get("io");

  //empty arrays for player Info
  let playerInfo = [];

  //loop through players, if uid matches then assign playerInfo
  for (let i = 0; i < players.length; i++) {
    if (user_id === players[i].user_id) {
      playerInfo = players[i];
      break;
    }
  }

  //Add your UNO rules condition here
  const followsUNORules = checkUNORules(card_id, playerInfo.hand);

  if (!followsUNORules) {
    res.status(400).send({
      message: "Card does not follow UNO rules: " + card_id,
      playerInfo: playerInfo,
      status: 400,
    });
    return;
  }
  const isValidTurn = await checkTurn(game_id, user_id);
  if (isValidTurn === false) {
    res.send({
      message: "Not your turn",
      status: 400,
    });
    return;
  }

  let draw2CardsUserId = "";
  if (user_id === playerInfo.user_id) {
    let idx = Array.from(playerInfo.hand.indexOf(card_id));
    playerInfo.hand.splice(idx, 1);
  }

  const playedNumber = parseInt(card_id.split("-")[1]);

  if (playedNumber === 10) {
    if (isInReverse) {
      console.log("reverse skip");
      await skipNextPlayerReverse();
    } else {
      console.log("skip");
      await skipNextPlayer();
    }
  }
  if (playedNumber === 11) {
    if (isInReverse) {
      await updatePosition(game_id);
    } else {
      await reverseGameOrder(game_id);
    }
  }
  if (playedNumber === 12) {
    //reverse not implemented yet
    const draw2UserId = await drawTwoCards(game_id);
    draw2CardsUserId = draw2UserId;
  }

  console.log("Player's Hand AFTER checking rule");
  console.log(playerInfo);

  top_discard = card_id;

  if (cardsSet.has(top_discard)) {
    cardsSet.delete(top_discard);
  }

  let cardID_arr = getCardID(card_id);
  let playedCardIDs = await user_cards.findCardID(cardID_arr[0], cardID_arr[1]);
  await user_cards.playCard(
    game_id,
    user_id,
    playedCardIDs,
    playedCardIDs.length
  );

  await Games.saveGameState(
    game_id,
    top_deck.split(".")[0],
    top_discard.split(".")[0],
    position
  );

  const currentPlayerName = await getCurrentPlayerName(game_id);

  io.in(game_id).emit(PLAY_CARD, {
    card_id,
    game_id,
    user_id,
    top_discard,
    players,
    currentPlayerName,
    draw2CardsUserId,
  });
  res.send({
    message: "Played card: " + card_id,
    playerInfo: playerInfo,
    status: 200,
  });

  if (playedNumber === 10 || playedNumber === 11 || playedNumber === 12) {
    //do nothing, since we already skipped the next player
  } else if (isInReverse) {
    await reverseGameOrder(game_id);
  } else {
    await updatePosition(game_id);
  }

};

// uno rules condition
const checkUNORules = (card_id, playerHand) => {
  // Get the color and number of the played card
  const playedColor = parseInt(card_id.split("-")[0]);
  const playedNumber = parseInt(card_id.split("-")[1]);

  // Get the top discard's color and number
  const topDiscardColor = parseInt(top_discard.split("-")[0]);
  const topDiscardNumber = parseInt(top_discard.split("-")[1]);

  console.log("Player Hand before matching: " + playerHand);

  // Check if the played color OR number matched the discard
  if (playedColor === topDiscardColor || playedNumber === topDiscardNumber) {
    console.log("When Card matches 1: " + playerHand);
    return true;
  }
  if (playedColor === 4) {
    console.log("Special card");
    return true;
  }

  // for (let card of playerHand) {
  //   const cardColor = parseInt(card.split("-")[0]);
  //   const cardNumber = parseInt(card.split("-")[1]);

  //   if (cardColor === topDiscardColor || cardNumber === topDiscardNumber) {
  //     console.log("When Card matches 2: " + playerHand);
  //     return true;
  //   }
  // }
  return false;
};

const checkTurn = async (game_id, user_id) => {
  let playerTurn = await Games.getPlayerTurn(game_id, user_id);
  let gamePosition = await Games.getCurrentGamePosition(game_id);
  console.log("playerTurn: " + playerTurn);
  console.log("gamePosition: " + gamePosition);
  console.log("isInReverse: " + isInReverse);
  console.log("playerTurn === gamePosition: " + (playerTurn === gamePosition));
  return playerTurn === gamePosition;
};

const updatePosition = async (game_id) => {
  let maxPlayers = players.length;
  if (position === maxPlayers - 1) {
    position = 0;
  } else {
    position++;
  }
  isInReverse = false;
  await Games.updateGamePosition(game_id, position);
};

const reverseGameOrder = async (game_id) => {
  let maxPlayers = players.length;
  if (position === 0) {
    position = maxPlayers - 1;
  } else {
    position--;
  }
  isInReverse = true;
  await Games.updateGamePosition(game_id, position);
};

const skipNextPlayer = async (game_id) => {
  let maxPlayers = players.length;
  if (position === maxPlayers - 1) {
    position = 1;
  } else if (position === maxPlayers - 2) {
    position = 0;
  } else {
    position += 2;
  }
  console.log("position: " + position);
  await Games.updateGamePosition(game_id, position);
};

const skipNextPlayerReverse = async (game_id) => {
  let maxPlayers = players.length;
  if (position === 0) {
    position = maxPlayers - 2;
  } else if (position === 1) {
    position = maxPlayers - 1;
  } else {
    position -= 2;
  }
  await Games.updateGamePosition(game_id, position);
};

const drawTwoCards = async (game_id) => {
  let randomCard1 = getRandomCard();
  let randomCard2 = getRandomCard();
  //you might need these for the front end?? idk
  let card1 = `${randomCard1[0]}-${randomCard1[1]}.png`;
  let card2 = `${randomCard2[0]}-${randomCard2[1]}.png`;

  //get position of player that is drawing the cards
  let maxPlayers = players.length;
  if (position === maxPlayers - 1) {
    position = 0;
  } else {
    position++;
  }

  console.log("player drawing cards position: " + position);
  const user_id = await Games.getUserID(game_id, position);
  await drawACard(card1, game_id, user_id);
  await drawACard(card2, game_id, user_id);
  //now skip that player's turn
  if (position === maxPlayers - 1) {
    position = 0;
  } else {
    position++;
  }

  console.log("position after drawing cards: " + position);
  await Games.updateGamePosition(game_id, position);
  return user_id;
};

const drawACard = async (card, game_id, user_id) => {
  const cardID_arr = getCardID(card);
  let card_id = await user_cards.findCardID(cardID_arr[0], cardID_arr[1]);
  await user_cards.drawCard(game_id, user_id, card_id);
};
//leave space here for now

Game.drawCard = async (req, res) => {
  const { game_id, user_id } = req.body;
  const io = req.app.get("io");

  let playerInfo = {};
  let playerInfoNewCards = {};

  for (let i = 0; i < players.length; i++) {
    if (user_id === players[i].user_id) {
      playerInfo = players[i];
      playerInfoNewCards = {
        name: players[i].name,
        hand: [],
        user_id: players[i].user_id,
      };
      break;
    }
  }

  // penalty did not call uno
  if (playerInfo.hand?.length === 1) {
    for (let i = 0; i < 2; i++) {
      playerInfo.hand?.push(top_deck);
      playerInfoNewCards.hand?.push(top_deck);
      let top_deck_arr = getRandomCard();
      top_deck = `${top_deck_arr[0]}-${top_deck_arr[1]}.png`;

      const maxAttempts = 20;
      let attempts = 0;

      while (cardsSet.has(top_deck) && attempts < maxAttempts) {
        top_deck_arr = getRandomCard();
        top_deck = `${top_deck_arr[0]}-${top_deck_arr[1]}.png`;
        attempts++;
      }

      cardsSet.add(top_deck);
    }

    await Games.saveGameState(
      game_id,
      top_deck.split(".")[0],
      top_discard.split(".")[0],
      position
    );

    const currentPlayerName = await getCurrentPlayerName(game_id);

    io.in(game_id).emit(DRAW_CARD, {
      game_id,
      user_id,
      top_discard,
      top_deck,
      players,
      currentPlayerName,
    });

    res.send({
      message: "Drawn two cards",
      playerInfo: playerInfo,
      playerInfoNewCards: playerInfoNewCards,
      numPlayerCards: playerInfo.hand.length,
      status: 200,
    });
    return;
  }
  const isValidTurn = await checkTurn(game_id, user_id);
  if (isValidTurn === false) {
    res.send({
      message: "Not your turn",
      status: 400,
    });
    return;
  }

  const card = top_deck;
  playerInfo.hand?.push(card);
  playerInfoNewCards.hand?.push(card);
  cardsSet.add(top_deck);
  //find card ID before sending to db
  await drawACard(card, game_id, user_id);

  const top_deck_arr = getRandomCard();
  let randomCard = `${top_deck_arr[0]}-${top_deck_arr[1]}.png`;

  const maxAttempts = 20;
  let attempts = 0;

  while (cardsSet.has(randomCard) && attempts < maxAttempts) {
    const top_deck_arr = getRandomCard();
    randomCard = `${top_deck_arr[0]}-${top_deck_arr[1]}.png`;
    attempts++;
  }

  top_deck = randomCard;
  cardsSet.add(top_deck);

  await Games.saveGameState(
    game_id,
    top_deck.split(".")[0],
    top_discard.split(".")[0],
    position
  );

  const currentPlayerName = await getCurrentPlayerName(game_id);

  io.in(game_id).emit(DRAW_CARD, {
    game_id,
    user_id,
    top_discard,
    top_deck,
    players,
    currentPlayerName,
  });

  res.send({
    message: "Drawn card: " + card,
    playerInfo: playerInfo,
    playerInfoNewCards: playerInfoNewCards,
    numPlayerCards: playerInfo.hand?.length,
    status: 200,
  });
};

//Call Uno Function
Game.callUno = async (req, res) => {
  const { game_id } = req.params;
  const userSession = req.session.user;

  const username = userSession.username;
  const user_id = userSession.id;

  const io = req.app.get("io");

  if (!user_id || !game_id) {
    res.send({ message: "Bad Request", status: 400 });
    return;
  }
  const isValidTurn = await checkTurn(game_id, user_id);
  if (isValidTurn === false) {
    res.send({
      message: "Not your turn",
      status: 400,
    });
    return;
  }

  const userCards = await Games.getPlayerCards(+game_id, user_id);

  if (userCards.length === 1) {
    const message = `${username} called UNO!`;

    io.in(+game_id).emit(CALL_UNO, { message });
    res.send({ message: message, status: 200 });
    return;
  }

  res.send({ message: "Cannot call uno", status: 400 });
};

//Send Message
Game.sendMessage = async (req, res) => {
  const { message, user_id, username, game_id } = req.body;
  const io = req.app.get("io");

  if (!user_id || !username) {
    res.send({ message: "Bad Request", status: 400 });
    return;
  }

  if (!message || message.trim().length === 0) {
    res.send({ message: "Please type a message", status: 400 });
    return;
  }

  try {
    const room_id = game_id;
    await GAMECHAT.create(username, message, room_id);
    io.in(game_id).emit(CHAT, { message, username });
    res.send({ message: message, username: username, status: 200 });
  } catch (err) {
    res.send({ message: "Error sending message", status: 500 });
  }
};

// Get all Messages
Game.getAllMessages = async (req, res) => {
  const { game_id } = req.params;

  try {
    const messageArray = await GAMECHAT.get(game_id);
    res.send({ messageArray: messageArray, status: 200 });
  } catch (err) {
    res.send({ message: "Error getting all messages", status: 500 });
  }
};

// SAve Game state
Game.saveGameState = async (req, res) => {
  const { game_id } = req.params;

  try {
    await Games.saveGameState(
      game_id,
      top_deck.split(".")[0],
      top_discard.split(".")[0],
      position
    );
    res.send({ message: "Game session saved", status: 200 });
  } catch (err) {
    console.log(err);
    res.send({ message: "Error, cannot save game session", status: 500 });
  }
};

module.exports = Game;
