const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./olympic_history.db');
const inseartTeamsnocName = () => new Promise((res) => {
    db.all(`SELECT noc_name FROM teams;`, (err, row) =>  res(row));
});
const inseartGamesYear = () => new Promise((res) => {
    db.all(`SELECT year FROM games;`, (err, row) =>  res(row));
});
const inseartResultsYearCountOfMedals = (season, medal, noc_name) => new Promise((res) => {
    let condition = 'results.medal != 0 AND games.season = ? AND lower(teams.noc_name) = ?'
    let params = [season, noc_name.toLowerCase()]
    if (medal) {
        condition = condition + ` AND results.medal = ?`;
        params.push(medal)
    }
    db.all(`SELECT games.year AS column, COUNT(results.medal) AS countMedals
            FROM games
            JOIN results ON results.game_id = games.id
            JOIN athletes ON athletes.id = results.athlete_id
            JOIN teams ON teams.id = athletes.team_id
            WHERE ${condition}
            GROUP BY year
            ORDER BY column
            ;`, params, (err, row) =>  res(row));
});
const inseartResultsTeamsCountOfMedals = (season, year, medal) => new Promise((res) => {
    let condition = 'results.medal != 0 AND games.season = ?'
    let params = [season]
    if (medal) {
        condition = condition + ` AND results.medal = ?`;
        params.push(medal)
    }
    if (year) {
        condition = condition + ` games.year = ?`;
        params.push(year)
    }
    // if (AVG(medal) > ) Показывать итоговый график только для тех команд, 
    //у которых результат выше среднего: если средняя сумма для всех команд равна 200 
    //- показывать только команды с более чем 200 медалями.
    db.all(`SELECT teams.noc_name AS column, COUNT(results.medal) AS countMedals
            FROM results            
            JOIN athletes ON athletes.id = results.athlete_id
            JOIN teams ON teams.id = athletes.team_id 
            JOIN games ON games.id = results.game_id 
            WHERE ${condition}       
            GROUP BY teams.noc_name
            ORDER BY countMedals DESC
            ;`, params, (err, row) =>  res(row));
});
module.exports = {inseartTeamsnocName, inseartResultsYearCountOfMedals, inseartGamesYear, inseartResultsTeamsCountOfMedals};


