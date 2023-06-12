/* eslint-disable camelcase */

// exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.createTable("users", {
    // From the docs, "id" is equivalent to: { type: 'serial', primaryKey: true }
    id: "id",
    username: {
      type: "varchar(255)",
      notNull: true,
    },
    email: {
      type: "varchar(255)",
      notNull: true,
    },
    password: {
      type: "varchar(255)",
      notNull: true,
    },
  });

  pgm.createTable("game_users", {
    // From the docs, "id" is equivalent to: { type: 'serial', primaryKey: true }
    game_id: {
      type: "integer",
      notNull: true,
    },
    user_id: {
      type: "integer",
      notNull: true,
    },
    ongoing: {
      type: "boolean",
      notNull: true,
    },
    turn: {
      type: "integer",
      notNull: true,
    },
  });

  pgm.createTable("user_cards", {
    // From the docs, "id" is equivalent to: { type: 'serial', primaryKey: true }
    game_id: {
      type: "int",
      notNull: true,
    },
    user_id: {
      type: "int",
      notNull: true,
    },
    card_id: {
      type: "int",
      notNull: true,
    },
  });

  pgm.createTable("games", {
    // From the docs, "id" is equivalent to: { type: 'serial', primaryKey: true }
    id: "id",
    game_title: {
      type: "varchar(255)",
      notNull: true,
    },
    ongoing: {
      type: "boolean",
      notNull: true,
    },
    top_deck: {
      type: "varchar(5)",
      notNull: true,
    },
    top_discard: {
      type: "varchar(5)",
      notNull: true,
    },
    position: {
      type: "integer",
      notNull: true,
    },
    created_at: {
      type: "timestamp",
      notNull: true,
      default: pgm.func("current_timestamp"),
    },
    users_required: {
      type: "integer",
      notNull: true,
    },
  });

  pgm.createTable("cards", {
    // From the docs, "id" is equivalent to: { type: 'serial', primaryKey: true }
    card_id: "id",

    card_color: {
      type: "integer",
      notNull: true,
    },

    card_number: {
      type: "integer",
      notNull: true,
    },
  });

  pgm.createTable("lobby_messages", {
    id: "id",
    username: {
      type: "text",
      notNull: true,
    },
    message: {
      type: "text",
      notNull: true,
    },
    created_at: {
      type: "timestamp",
      notNull: true,
      default: pgm.func("current_timestamp"),
    },
  });

  pgm.createTable("game_room_messages", {
    id: "id",
    username: {
      type: "text",
      notNull: true,
    },
    message: {
      type: "text",
      notNull: true,
    },
    room_id: {
      type: "int",
      notNull: true,
    },
    created_at: {
      type: "timestamp",
      notNull: true,
      default: pgm.func("current_timestamp"),
    },
  });
};

exports.down = (pgm) => {
  //drop all tables
  pgm.dropTable("users");
  pgm.dropTable("game_users");
  pgm.dropTable("user_cards");
  pgm.dropTable("games");
  pgm.dropTable("cards");
  pgm.dropTable("lobby_messages");
  pgm.dropTable("game_room_messages");
};
