const crypto = require('crypto');

var Games;
var SimpleGames;
var Players;
var Matches;
var sequelize;

const generateGuid = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
  });
};

const validateMatchToken = (req, res) => {
  const token = req.body.token || req.params.token;
  const hash = crypto.createHash('sha256');
  hash.update(token + req.headers['user-agent']);
  const hashedToken = hash.digest('hex');
  return sequelize.query(`select match_id from match_key where key = '${hashedToken}'`).then(result => {
    return result.length > 0 && result[0].length > 0;
  });
};

exports.init = (models, db) => {
  Games = models['Games'];
  SimpleGames = models['SimpleGames'];
  Players = models['Players'];
  Matches = models['Matches'];
  sequelize = db;
};

exports.create = (req, res) => {
  const playersInfo = req.body;
  let token, hashedToken, match, game;
  return Matches.findOne({
    where: {
      finished: 0
    }
  }).then(matchInProgress => {
    if (matchInProgress) {
      return res.send(400);
    }

    return Matches.create({ player1Id: playersInfo.player1.id, player2Id: playersInfo.player2.id });
  }).then(m => {
    match = {
      games: [{
        gameId: null
      }],
      id: m.id,
      player1Id: m.player1Id,
      player2Id: m.player2Id,
      finished: m.finished,
      startTime: m.startTime,
      finishTime: m.finishTime
    };
    token = generateGuid();
    const hash = crypto.createHash('sha256');
    hash.update(token + req.headers['user-agent']);
    hashedToken = hash.digest('hex');
    return Promise.all([
      sequelize.query(`insert into match_key (key, match_id) values ('${hashedToken}', '${m.id}')`, { type: sequelize.QueryTypes.INSERT }),
      sequelize.query(`insert into games (match_id) values ('${m.id}')`, { type: sequelize.QueryTypes.INSERT })
    ]);
  }).then(result => {

    game = {
      gameId: result[1][0],
      score1: 0,
      score2: 0,
      matchFinished: 0,
      gameFinished: 0,
      player1Id: match.player1Id,
      player2Id: match.player2Id,
      player1Fname: playersInfo.player1.fname,
      player1Lname: playersInfo.player2.fname,
      player1MiddleInitial: playersInfo.player2.middleInitial,
      player2Fname: playersInfo.player1.lname,
      player2Lname: playersInfo.player2.lname,
      player2MiddleInitial: playersInfo.player2.middleInitial
    };
    match.games[0] = game;
    return res.json({
      match: match,
      token: token
    });
  });
};

exports.canUpdate = (req, res) => {
  return validateMatchToken(req, res).then(result => {
    res.send(result);
  });
};

exports.update = (req, res) => {
  const match = req.body.match;
  return validateMatchToken(req, res).then(result => {
    if (!result) {
      return res.sendStatus(400);
    }

    return Matches.findOne({ where: { id: match.id }});
  }).then(m => {
    m.player1Id = match.player1Id;
    m.player2Id = match.player2Id;
    m.finished = match.finished;
    return m.save();
  }).then(() => {
    return res.json(match);
  }).catch(e => {
    return res.send(500, e);
  });
};

exports.finish = (req, res) => {
  const match = req.body.match;
  let finishedMatch;
  return validateMatchToken(req, res).then(result => {
    if (!result) {
      return res.sendStatus(400);
    }

    return Matches.findOne({ where: { id: match.id }});
  })
  .then(m => {
    m.player1Id = match.player1Id;
    m.player2Id = match.player2Id;
    m.finished = 1;
    m.finishTime = new Date();
    return m.save();
  })
  .then(() => Matches.findOne({ where: { id: match.id }}))
  .then(updatedMatch => {
    finishedMatch = updatedMatch;
    return sequelize.query(`delete from match_key where match_id='${match.id}'`, { type: sequelize.QueryTypes.DELETE });
  })
  .then(() => res.json(finishedMatch))
  .catch(e => {
    return res.send(500, e);
  });
};

exports.addGame = (req, res) => {
  try {
    const match = req.body.match;
    const oldGame = match.games[match.games.length - 1];
    return validateMatchToken(req, res).then(result => {
      if (!result) {
        return res.sendStatus(400);
      }

      return sequelize.query(`insert into games (match_id) values ('${match.id}')`, { type: sequelize.QueryTypes.INSERT })
    }).then(result => {
      const game = {
        gameId: result[0],
        score1: 21,
        score2: 21,
        matchFinished: 0,
        gameFinished: 0,
        player1Id: match.player1Id,
        player2Id: match.player2Id,
        player1Fname: oldGame.player1Fname,
        player1Lname: oldGame.player1Lname,
        player1MiddleInitial: oldGame.player1MiddleInitial,
        player2Fname: oldGame.player2Fname,
        player2Lname: oldGame.player2Lname,
        player2MiddleInitial: oldGame.player2MiddleInitial
      };
      res.json(game);
    });
  } catch (e) {
    res.sendStatus(500);
  }
};

exports.updateGame = (req, res) => {
  const game = req.body.game;
  return validateMatchToken(req, res).then(result => {
    if (!result) {
      return res.sendStatus(400);
    }

    return SimpleGames.findOne({ where: { gameId: game.gameId }});
  }).then(g => {
    g.score1 = game.score1;
    g.score2 = game.score2;
    g.gameFinished = game.gameFinished;
    return g.save();
  }).then(() => {
    return res.json(game);
  }).catch(e => {
    return res.send(500, e);
  });
};

exports.current = (req, res) => {
  return Promise.all([
    Matches.findOne({
      where: {
        finished: 0
      }
    }),
    sequelize.query(`
      select
        p1.fname as player1Fname,
        p1.lname as player1Lname,
        p1.mi as player1MiddleInitial,
        p1.id as player1Id,
        p2.fname as player2Fname,
        p2.lname as player2Lname,
        p2.mi as player2MiddleInitial,
        p2.id as player2Id,
        g.score1,
        g.score2,
        m.id as matchId,
        g.id as gameId,
        m.finished as matchFinished,
        g.finished as gameFinished,
        m.start_time as startTime,
        m.finish_time as finishTime
      from
        (select * from matches m where finished = 0 order by start_time limit 1) as m
        join games g on g.match_id = m.id
        join players p1 on m.player1_id = p1.id
        join players p2 on m.player2_id = p2.id
      order by m.start_time desc`, { type: sequelize.QueryTypes.SELECT}
    )
  ]).then(result => {
    return res.json({
      games: result[1],
      id: result[0].id,
      player1Id: result[0].player1Id,
      player2Id: result[0].player2Id,
      finished: result[0].finished,
      startTime: result[0].startTime,
      finishTime: result[0].finishTime
    });
  });
};

exports.mostRecent = (req, res) => {
  const player1Id = req.params.player1Id;
  const player2Id = req.params.player2Id;
  return Promise.all([
    Matches.findAll({
      order: sequelize.literal('start_time DESC'),
      limit: req.params.count
    }),
    sequelize.query(`
      select
        p1.fname as player1Fname,
        p1.lname as player1Lname,
        p1.mi as player1MiddleInitial,
        p1.id as player1Id,
        p2.fname as player2Fname,
        p2.lname as player2Lname,
        p2.mi as player2MiddleInitial,
        p2.id as player2Id,
        g.score1,
        g.score2,
        m.id as matchId,
        g.id as gameId,
        m.finished as matchFinished,
        g.finished as gameFinished,
        m.start_time as startTime,
        m.finish_time as finishTime
      from
        (select * from matches m order by start_time limit ${req.params.count}) as m
        join games g on g.match_id = m.id
        join players p1 on m.player1_id = p1.id
        join players p2 on m.player2_id = p2.id
      order by m.start_time desc`, { type: sequelize.QueryTypes.SELECT}
    )
  ]).then(result => {
    let augmentedMatches = result[0].map(m => {
      m['games'] = [];
      return {
        games: [],
        id: m.id,
        player1Id: m.player1Id,
        player2Id: m.player2Id,
        finished: m.finished,
        startTime: m.startTime,
        finishTime: m.finishTime
      };
    });
    let games = result[1];
    games.forEach(g => {
      let match = augmentedMatches.find(m => m.id === g.matchId);
      if (match) {
        match.games.push(g);
      }
    });
    return res.json(augmentedMatches);
  });
};

exports.matchesByPlayers = (req, res) => {
  const player1Id = parseInt(req.params.player1Id);
  const player2Id = parseInt(req.params.player2Id);
  return Promise.all([
    Matches.findAll({
      order: sequelize.literal('start_time DESC'),
      limit: req.params.count
    }),
    sequelize.query(`
      select
        p1.fname as player1Fname,
        p1.lname as player1Lname,
        p1.mi as player1MiddleInitial,
        p1.id as player1Id,
        p2.fname as player2Fname,
        p2.lname as player2Lname,
        p2.mi as player2MiddleInitial,
        p2.id as player2Id,
        g.score1,
        g.score2,
        m.id as matchId,
        g.id as gameId,
        m.finished as matchFinished,
        g.finished as gameFinished,
        m.start_time as startTime,
        m.finish_time as finishTime
      from matches m
        left outer join games g on g.match_id = m.id
        left outer join players p1 on p1.id = m.player1_id
        left outer join players p2 on p2.id = m.player2_id
      where (p1.id = ${player1Id} and p2.id = ${player2Id}) or (p2.id = ${player1Id} and p1.id = ${player2Id})
      order by m.start_time desc`, { type: sequelize.QueryTypes.SELECT}
    )
  ]).then(result => {
    let matchResults = {};
    let statPack = {
      player1Id: player1Id,
      player2Id: player2Id,
      meetings: result[0].length,
      p1MatchesWon: 0,
      p2MatchesWon: 0,
      matchesDrawn: 0,
      p1GamesWon: 0,
      p2GamesWon: 0,
      p1TotalPoints: 0,
      p2TotalPonts: 0
    };
    let augmentedMatches = result[0].map(m => {
      matchResults[m.id] = {
        p1wins: 0,
        p2wins: 0
      };
      return {
        games: [],
        id: m.id,
        player1Id: m.player1Id,
        player2Id: m.player2Id,
        finished: m.finished,
        startTime: m.startTime,
        finishTime: m.finishTime
      };
    });

    result[1].forEach(g => {
      let match = augmentedMatches.find(m => m.id === g.matchId);
      if (match) {
        match.games.push(g);
        if (g.player1Id === player1Id) {
          statPack.p1TotalPoints += g.score1;
          statPack.p2TotalPonts += g.score2;
          if (g.score1 > g.score2) {
            statPack.p1GamesWon++;
            matchResults[match.id].p1wins++;
          } else if (g.score2 > g.score1) {
            statPack.p2GamesWon++;
            matchResults[match.id].p2wins++;
          }
        } else {
          statPack.p1TotalPoints += g.score2;
          statPack.p2TotalPonts += g.score1;
          if (g.score1 > g.score2) {
            statPack.p2GamesWon++;
            matchResults[match.id].p2wins++;
          } else if (g.score2 > g.score1) {
            statPack.p1GamesWon++;
            matchResults[match.id].p1wins++;
          }
        }
      }
    });
    Object.keys(matchResults).forEach(matchId => {
      let id = parseInt(matchId);
      if (matchResults[id].p1wins > matchResults[id].p2wins) {
        statPack.p1MatchesWon++;
      }
      else if (matchResults[id].p2wins > matchResults[id].p1wins) {
        statPack.p2MatchesWon++;
      }
      else {
        statPack.matchesDrawn++;
      }
    });
    return res.json({
      matches: augmentedMatches,
      stats: statPack
    });
  });
};