const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./olympic_history.db');
const insTeamsnocName = () => new Promise((resolve) => {
  db.all('SELECT noc_name FROM teams;', (err, row) => resolve(row));
});
const insGamesYear = () => new Promise((resolve) => {
  db.all('SELECT year FROM games;', (err, row) => resolve(row));
});
const insResultsYearCountOfMedals = (season, medal, nocName) => new Promise((resolve) => {
  let condition = 'results.medal != 0 AND games.season = ? AND lower(teams.noc_name) = ?';
  const params = [season, nocName.toLowerCase()];
  if (medal) {
    condition += ' AND results.medal = ?';
    params.push(medal);
  }
  db.all(`
    SELECT games.year AS column, COUNT(results.medal) AS countMedals
    FROM games
    JOIN results ON results.game_id = games.id
    JOIN athletes ON athletes.id = results.athlete_id
    JOIN teams ON teams.id = athletes.team_id
    WHERE ${condition}
    GROUP BY year
    ORDER BY column;
    `, params, (err, row) => resolve(row));
});
const insResultsTeamsCountOfMedals = (season, year, medal) => new Promise((resolve) => {
  let condition = 'results.medal != 0 AND games.season = ?';
  const params = [season];
  if (medal) {
    condition += ' AND results.medal = ?';
    params.push(medal);
  }
  if (year) {
    condition += ' AND games.year = ?';
    params.push(year);
  }
  db.get(`SELECT AVG(IFNULL(countMedals, 0)) as avg
          FROM (
          SELECT COUNT(results.medal) AS countMedals
          FROM results            
          JOIN athletes ON athletes.id = results.athlete_id
          JOIN teams ON teams.id = athletes.team_id 
          JOIN games ON games.id = results.game_id 
          WHERE games.season = ? AND results.medal != ?     
          GROUP BY teams.noc_name
          ORDER BY countMedals DESC)`, [season, medal], (err, { avg }) => {
    let having = '';
    if (avg > 200) {
      having = 'HAVING COUNT(results.medal) > 200';
    }

    db.all(`
    SELECT teams.noc_name AS column, COUNT(results.medal) AS countMedals
    FROM results            
    JOIN athletes ON athletes.id = results.athlete_id
    JOIN teams ON teams.id = athletes.team_id 
    JOIN games ON games.id = results.game_id 
    WHERE ${condition}       
    GROUP BY teams.noc_name
    ORDER BY countMedals DESC
    ${having};
    `, params, (err, row) => resolve(row));
  });
});
module.exports = {
  insTeamsnocName,
  insResultsYearCountOfMedals,
  insGamesYear,
  insResultsTeamsCountOfMedals,
};
