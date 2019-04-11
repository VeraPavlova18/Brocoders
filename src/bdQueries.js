const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./olympic_history.db');

const insTeamsnocName = () => new Promise(resolve => db.all('SELECT noc_name FROM teams;', (err, row) => resolve(row)));

const insGamesYear = () => new Promise(resolve => db.all('SELECT year FROM games;', (err, row) => resolve(row)));

const insResultsYearCountOfMedals = (season, medal, nocName) => new Promise((resolve) => {
  db.all(`
    SELECT games.year AS column, COUNT(results.medal) AS countMedals
    FROM games
    JOIN results ON results.game_id = games.id
    JOIN athletes ON athletes.id = results.athlete_id
    JOIN teams ON teams.id = athletes.team_id
    WHERE results.medal != 0 
    AND games.season = ${season} AND lower(teams.noc_name) = '${nocName.toLowerCase()}'
    ${medal ? ` AND results.medal = ${medal}` : ''}
    GROUP BY year
    ORDER BY column;
    `, (err, row) => resolve(row));
});

const insResultsTeamsCountOfMedals = (season, year, medal) => new Promise((resolve) => {
  db.get(`
    SELECT AVG(IFNULL(countMedals, 0)) as avg
    FROM (
    SELECT COUNT(results.medal) AS countMedals
    FROM results            
    JOIN athletes ON athletes.id = results.athlete_id
    JOIN teams ON teams.id = athletes.team_id 
    JOIN games ON games.id = results.game_id 
    WHERE games.season = ${season} AND results.medal != ${medal}     
    GROUP BY teams.noc_name
    ORDER BY countMedals DESC);
    `, (err, { avg }) => {
    db.all(`
      SELECT teams.noc_name AS column, COUNT(results.medal) AS countMedals
      FROM results            
      JOIN athletes ON athletes.id = results.athlete_id
      JOIN teams ON teams.id = athletes.team_id 
      JOIN games ON games.id = results.game_id 
      WHERE results.medal != 0 AND games.season = ${season}
      ${medal ? ` AND results.medal = ${medal}` : ''}
      ${year ? ` AND games.year = ${year}` : ''}  
      GROUP BY teams.noc_name
      ORDER BY countMedals DESC;
      ${(avg > 200) ? 'HAVING COUNT(results.medal) > 200' : ''};
      `, (err, row) => resolve(row));
  });
});

module.exports = {
  insTeamsnocName,
  insResultsYearCountOfMedals,
  insGamesYear,
  insResultsTeamsCountOfMedals,
};
