const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./olympic_history.db');
const { parse } = require('./parseLiner');

function ProcessLineToDB() {
  let titles = [];
  let i = 0;

  this.processLine = async function (line) {
    if (i === 0) {
      titles = parse(line).map(title => title.toLowerCase());
    } else {
      const obj = {};
      const row = parse(line);
      for (let j = 0; j < titles.length; j += 1) {
        obj[titles[j]] = row[j];
      }
      if (+obj.year === 1906 && obj.season.toLowerCase() === 'summer') {
        return;
      }
      const season = obj.season.toLowerCase() === 'summer' ? 0 : 1;
      const teamsName = (obj.team.indexOf('-') !== -1) ? obj.team.substr(0, obj.team.indexOf('-')) : obj.team;
      obj.params = {};
      if (obj.height) obj.params.height = obj.height;
      if (obj.weight) obj.params.weight = obj.weight;
      const fullName = obj.name.trim().replace(/""/g, '"').replace(/["(].+?[")]\s*/g, '');
      const sex = obj.sex ? obj.sex : null;
      const yearOfBirth = (obj.year && obj.age) ? `${obj.year} - ${obj.age}` : null;
      const medalType = { gold: 1, silver: 2, bronze: 3 };
      let medal = obj.medal ? obj.medal.toLowerCase() : 0;
      medal = (medalType[medal]) ? medalType[medal] : medal;

      const events = new Promise((resolve, reject) => {
        db.run('INSERT OR IGNORE INTO events (name) VALUES (?);', [obj.event], (err) => {
          if (err) reject(err);
          resolve();
        });
      });
      const sports = new Promise((resolve, reject) => {
        db.run('INSERT OR IGNORE INTO sports (name) VALUES (?);', [obj.sport], (err) => {
          if (err) reject(err);
          resolve();
        });
      });
      const games = new Promise((resolve, reject) => {
        db.get('SELECT id, city FROM games WHERE year = ? AND season = ?;', [obj.year, season], (err, row) => {
          if (err) reject(err);
          if (row === undefined) {
            db.run('INSERT OR IGNORE INTO games (year, season, city) VALUES (?, ?, ?);', [obj.year, season, obj.city], (err) => {
              if (err) reject(err);
              resolve();
            });
          } else {
            const cityObject = new Set(row.city.split(', '));
            cityObject.add(obj.city);
            db.run('UPDATE games SET city = ? WHERE id = ?', [Array.from(cityObject).join(', '), row.id], () => resolve());
          }
        });
      });
      const teams = new Promise((resolve, reject) => {
        db.run('INSERT OR IGNORE INTO teams (name, noc_name) VALUES (?, ?);', [teamsName, obj.noc], (err) => {
          if (err) reject(err);
          db.run(`INSERT OR IGNORE INTO athletes (full_name, sex, year_of_birth, params, team_id)
          SELECT $full_name AS full_name, $sex AS sex, $year_of_birth AS year_of_birth, $params AS params, teams.id AS team_id
          FROM teams WHERE teams.name = $team_name;`, {
            $full_name: fullName,
            $sex: sex,
            $year_of_birth: yearOfBirth,
            $params: JSON.stringify(obj.params),
            $team_name: teamsName,
          }, (err) => {
            if (err) reject(err);
            resolve();
          });
        });
      });

      Promise.all([events, sports, games, teams])
        .then(() => {
          db.run(`INSERT OR IGNORE INTO results (athlete_id, game_id, sport_id, event_id, medal)
          SELECT athletes.id AS athlete_id, games.id AS game_id, sports.id AS sport_id, events.id AS event_id, $medal as medal
          FROM athletes, games, sports, events
          WHERE athletes.full_name = $full_name
          AND sports.name = $sport AND events.name = $event
          AND medal = $medal AND games.year= $year AND games.season = $season;`, {
            $sport: obj.sport,
            $event: obj.event,
            $full_name: fullName,
            $medal: medal,
            $year: obj.year,
            $season: season,
          });
        });
    }
    i += 1;
    if (i % 100 === 0) {
      // eslint-disable-next-line no-console
      console.log(`-> ${i}`);
    }
  };
}

module.exports = { ProcessLineToDB };
