const sqlite3 = require('sqlite3').verbose()
const db = new sqlite3.Database('./olympic_history.db')
const inseartTeamsnocName = () => new Promise((resolve, reject) => {
  db.all(`SELECT noc_name FROM teams;`, (_err, row) => resolve(row))
})
const inseartGamesYear = () => new Promise((resolve, reject) => {
  db.all(`SELECT year FROM games;`, (_err, row) => resolve(row))
})
const inseartResultsYearCountOfMedals = (season, medal, nocName) => new Promise((resolve, reject) => {
  let condition = 'results.medal != 0 AND games.season = ? AND lower(teams.noc_name) = ?'
  let params = [season, nocName.toLowerCase()]
  if (medal) {
    condition = condition + ` AND results.medal = ?`
    params.push(medal)
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
    `, params, (_err, row) => resolve(row))
})
const inseartResultsTeamsCountOfMedals = (season, year, medal) => new Promise((resolve, reject) => {
  let condition = 'results.medal != 0 AND games.season = ?'
  let params = [season]
  if (medal) {
    condition = condition + ` AND results.medal = ?`
    params.push(medal)
  }
  if (year) {
    condition = condition + ` AND games.year = ?`
    params.push(year)
  }
  db.get(`
    SELECT AVG(countMedals) as avg
    FROM (
        SELECT COUNT(results.medal) AS countMedals
        FROM results            
        JOIN athletes ON athletes.id = results.athlete_id
        JOIN teams ON teams.id = athletes.team_id 
        JOIN games ON games.id = results.game_id 
        WHERE results.medal != ? AND games.season = ?      
        GROUP BY teams.noc_name
        ORDER BY countMedals DESC
    )
  `, params, (_err, { avg }) => {
    let having = ''
    if (avg > 200) {
      having = `HAVING COUNT(results.medal) > 200`
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
    `, params, (_err, row) => resolve(row))
  })
})
module.exports = { inseartTeamsnocName, inseartResultsYearCountOfMedals, inseartGamesYear, inseartResultsTeamsCountOfMedals }
