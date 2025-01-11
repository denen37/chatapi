const express = require("express");
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const { createServer } = require('http');
const { Server } = require("socket.io");
const path = require("path");
// const dotenv = require('dotenv');
// dotenv.config();
const app = express();
const server = createServer(app);
const initializeChatSocket = require('./chat');
const PORT = 3000;
const URL = `http://localhost:${PORT}`

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cookieParser());
// Set view engine
app.set('view engine', 'pug');
app.set("views", path.join(__dirname, "views"));

// Serve static files
app.use(express.static(path.join(__dirname, "public")));

const routes = require("./routes/routes");
app.use(routes);


// Error handling for undefined routes
app.use((req, res, next) => {
  res.status(404).send('Route not found');
});


initializeChatSocket(server, URL);

server.listen(PORT, () => {
  console.log(`Server running on ${URL}`);
});
