const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./olympic_history.db');
const inseartTeamsnocName = () => new Promise((res) => {
    db.all(`SELECT noc_name FROM teams;`, (err, row) =>  res(row));
});
const inseartResultsYearCountOfMedals = (season, medal, noc_name) => new Promise((res) => {
    let condition = 'games.season = ? AND lower(teams.noc_name) = ?'
    let params = [season, noc_name.toLowerCase()]
    if (medal) {
        condition = condition + ` AND medal = ?`;
        params.push(medal)
    }
    db.all(`SELECT games.year, SUM(results.medal) AS sumMedals
            FROM games
            JOIN results ON results.game_id = games.id
            JOIN athletes ON athletes.id = results.athlete_id
            JOIN teams ON teams.id = athletes.team_id
            WHERE ${condition}
            GROUP BY year
            ORDER BY year
            ;`, params, (err, row) =>  res(row));
});

module.exports = {inseartTeamsnocName, inseartResultsYearCountOfMedals};


