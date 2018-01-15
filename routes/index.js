const players = require('./players');
const matches = require('./matches');

module.exports = function (models, app, sequelize, ws) {
  matches.init(models, sequelize, ws);
  players.init(models);

  // Players
  app.get('/api/players', players.get);
  app.post('/api/players', players.create);

  // Matches/Games
  app.get('/api/matches/by-players/:player1Id/:player2Id', matches.matchesByPlayers);
  app.get('/api/matches/most-recent/:count', matches.mostRecent);
  app.get('/api/matches/current', matches.current);
  app.get('/api/matches/can-update-score/:token', matches.canUpdate);
  app.post('/api/matches/create', matches.create);
  app.post('/api/matches/update', matches.update);
  app.post('/api/matches/finish', matches.finish);
  app.post('/api/games/add', matches.addGame);
  app.post('/api/games/update', matches.updateGame);
  app.get('/*', (req, res) => res.render('index'));
};