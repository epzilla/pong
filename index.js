const Sequelize = require('sequelize');
const http = require('http');
const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const WebSocket = require('ws');

// Define your models
const database = new Sequelize(null, null, null, {
  dialect: 'sqlite',
  storage: './data/sport.db'
});

// Initialize server
const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(function (req, res, next) {
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept, Authorization, Access-Control-Allow-Origin, Access-Control-Allow-Methods, Cache-Control')
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
  res.header('Access-Control-Allow-Origin', '*');
  next();
});
app.set('views', path.join(__dirname, 'public/views'));
app.set('view engine', 'pug');
const server = http.createServer(app);

const models = {};
fs.readdirSync(__dirname + '/models').forEach(m => {
  let name = m.slice(0, -3);
  models[name] = database.import(__dirname + `/models/${m}`);
});

const wss = new WebSocket.Server({ server });
wss.on('connection', function connection(ws, req) {
  ws.on('message', function incoming(message) {
    console.log('received: %s', message);
  });

  ws.send('something');
});

const sendSocketMsg = (type, data) => {
  console.log(`Sending socket message of typepe: ${type}`);
  console.log(data);
  let obj = { type };
  obj.data = typeof data === 'string' ? data : JSON.stringify(data);
  wss.clients.forEach(function each(client) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(obj));
    }
  });
};

require('./routes')(models, app, database, sendSocketMsg);

// Create database and listen
server.listen(3000, () => {
  const addr = server.address();
  console.log(`listening at ${addr.address}:${addr.port}`);
});