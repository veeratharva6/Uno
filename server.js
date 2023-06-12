const path = require("path");
const createError = require("http-errors");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");
const initSockets = require("./backend/sockets/initialize.js");

const express = require("express");
const session = require("express-session");
const pgSession = require("connect-pg-simple")(session);
const addSessionLocals = require("./backend/middleware/add-session-locals.js");
const db = require("./backend/db/connection.js");
const app = express();
require("dotenv").config();

const homeRoutes = require("./backend/routes/static/home.js");
const gamesRoutes = require("./backend/routes/static/games.js");
const lobbyRoutes = require("./backend/routes/static/lobby.js");
const waitingroomRoutes = require("./backend/routes/static/waitingroom.js");
const authenticationRoutes = require("./backend/routes/static/authentication.js");
const users = require("./backend/routes/users.js");
const games = require("./backend/routes/games.js");
const waitingroom = require("./backend/routes/waitingroom.js");

const sessionMiddleware = session({
  store: new pgSession({ pgPromise: db, createTableIfMissing: true }),
  secret: "sessionsecret123",
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 * 24 * 7 },
});

app.use(sessionMiddleware);
const server = initSockets(app, sessionMiddleware);

app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.set("views", path.join(__dirname, "backend", "views"));
app.set("view engine", "pug");
app.use(express.static(path.join(__dirname, "backend", "static")));
app.use(addSessionLocals);

app.use("/", homeRoutes);
app.use("/waitingroom", waitingroomRoutes);
app.use("/games", gamesRoutes);
app.use("/lobby", lobbyRoutes);
app.use("/authentication", authenticationRoutes);
app.use("/api/users", users);
app.use("/api/games", games);
app.use("/api/waitingroom", waitingroom);
const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});

app.use((request, response, next) => {
  next(createError(404));
});

// const path = require("path");
// const createError = require("http-errors");
// const requestTime = require("./backend/middleware/request-time");

// const express = require("express");
// const app = express();

// app.use(morgan("dev"));

// if (process.env.NODE_ENV === "development") {
//     const livereload = require("livereload");
//     const connectLiveReload = require("connect-livereload");

//     const liveReloadServer = livereload.createServer();
//     liveReloadServer.watch(path.join(__dirname, "backend", "static"));
//     liveReloadServer.server.once("connection", () => {
//       setTimeout(() => {
//         liveReloadServer.refresh("/");
//       }, 100);
//     });

//     app.use(connectLiveReload());
//   }

// app.set("views", path.join(__dirname, "backend", "views"));
// app.set("view engine", "pug");
// app.use(express.static(path.join(__dirname, "backend", "static")));

// const PORT = process.env.PORT || 3000;

// app.use(express.static(path.join(__dirname, "backend", "static")));

// const rootRoutes = require("./backend/routes/root");

// app.use("/", rootRoutes);
// app.use(requestTime);

// app.listen(PORT, () => {
//   console.log(`Server started on port ${PORT}`);
// });

// app.use((request, response, next) => {
//   next(createError(404));
// });
