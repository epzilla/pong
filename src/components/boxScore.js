import { getFormattedMatchDate, getStatsForMatch, getMatchTimeAgo } from '../lib/helpers';

const calculateExpectedPointsPerMatch = (match) => {
  let expectedPerGame;

  let finishedGames = match.games.filter(g => g.gameFinished);
  if (finishedGames.length > 0) {
    expectedPerGame = finishedGames.reduce((sum, current) => sum + (current.score1 + current.score2), 0) / finishedGames.length;
  } else {
    expectedPerGame = (match.playTo * 1.75);
  }

  if (match.playAllGames) {
    return expectedPerGame * match.bestOf;
  }

  return expectedPerGame * Math.ceil((match.bestOf + Math.ceil(match.bestOf / 2)) / 2);
};

const getHourGlassIcon = (match, currentGame) => {
  let game = match.games[currentGame];
  let previousPoints = match.games.filter(g => g.gameFinished).reduce((sum, current) => sum + (current.score1 + current.score2), 0) || 0;
  let totalPoints = previousPoints + (game ? (game.score1 + game.score2) : 0);
  let expectedTotalPoints = calculateExpectedPointsPerMatch(match);
  let pct = totalPoints / expectedTotalPoints;
  if (pct < 0.25) {
    return 'start';
  } else if (pct < 0.8) {
    return 'half';
  }

  return 'end';
};

const BoxScore = ({ match, jumbotron, flashFinal }) => {
  const stats = getStatsForMatch(match);
  let headerRowNums = [];
  let footer;
  let numCols = match.finished ? match.games.length : match.bestOf;
  let currentGame;
  let classes = 'scoreboard ';
  if (!jumbotron) {
    classes += ' box-score';
  } else if (flashFinal) {
    classes += ' flash-final';
  }

  for (let i = 0; i < numCols; i++) {
    headerRowNums.push(i);
    let game = match.games[i];
    if (game && !game.gameFinished) {
      currentGame = i;
    }
  }

  if (jumbotron && match.finished) {
    footer = (
      <div class="flex-col flex-center">
        <p class="final flex-center">Final</p>
        <p class="font-small center">{ stats.resultString }</p>
        <p class="font-small center">{ stats.pointsWonString }</p>
      </div>
    );
  } else if (jumbotron) {
    footer = (
      <p class="flex-col">
        <p class="match-info-block">
          <i class="fa fa-clock-o"></i>
          <span class="match-info">Started { getMatchTimeAgo(match) }</span>
        </p>
        <p class="match-info-block">
          <i class="fa fa-bullseye"></i>
          <span class="match-info">Games played to { match.playTo } points.</span>
        </p>
        <p class="match-info-block">
          <i class={`fa fa-hourglass-${ getHourGlassIcon(match, currentGame) }`}></i>
          <span class="match-info">{ match.playAllGames ? 'Playing all' : 'Best of' } { match.bestOf } games.</span>
        </p>
      </p>
    );
  } else {
    footer = (
      <div class="flex-col flex-center">
        <p class="center">{ stats.resultString }</p>
        <p class="font-small center">{ stats.pointsWonString }</p>
      </div>
    );
  }

  return (
    <div class={classes}>
      { match.finished ? <h4 class="date-time-header">{ getFormattedMatchDate(match) }</h4> : null }
      <div class="header-row flex">
        <span class="player-name"></span>
        {
          headerRowNums.map(i => {
            if (match.games.length >= i + 1) {
              return <span class={`score-number-box ${match.games[i].gameFinished ? 'finished' : 'current'}`}>{i + 1}</span>
            }

            return (
              <span class={`score-number-box future`}>{i + 1}</span>
            )
          })
        }
      </div>
      <div class="score-row flex">
        <span class="player-name">{ match.games[0].player1Fname } { match.games[0].player1Lname }</span>
        {
          headerRowNums.map(i => {
            if (match.games.length >= i + 1) {
              let g = match.games[i]
              return <span class={`score-number-box ${g.gameFinished && g.score1 > g.score2 ? 'win' : (g.gameFinished ? 'loss' : '')}`}>{ g.score1 }</span>
            }

            return (
              <span class={`score-number-box future`}>0</span>
            )
          })
        }
      </div>
      <div class="score-row flex">
        <span class="player-name">{ match.games[0].player2Fname } { match.games[0].player2Lname }</span>
        {
          headerRowNums.map(i => {
            if (match.games.length >= i + 1) {
              let g = match.games[i]
              return <span class={`score-number-box ${g.gameFinished && g.score2 > g.score1 ? 'win' : (g.gameFinished ? 'loss' : '')}`}>{ g.score2 }</span>
            }

            return (
              <span class={`score-number-box future`}>0</span>
            )
          })
        }
      </div>
      <div class="score-row stats-row flex-center">
        { footer }
      </div>
    </div>
  );
};

export default BoxScore;