/* eslint-disable no-console */
const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./olympic_history.db');
const { parse } = require('./parseLiner');
const { getTitles } = require('./getTitles');

const medalType = {
  null: 0,
  gold: 1,
  silver: 2,
  bronze: 3,
};

class ProcessLineToDB {
  constructor() {
    this.i = 0;
  }

  async processLine(line) {
    const { arr } = await getTitles();

    // --> created obj
    const obj = {};
    const row = parse(line);
    // eslint-disable-next-line no-return-assign
    row.reduce((prevValue, currValue, index) => obj[arr[index]] = currValue, 0);
    // <--created obj

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

    const medal = medalType[`${obj.medal}`.toLowerCase()];

    const events = new Promise((resolve, reject) => {
      db.run(`INSERT OR IGNORE INTO events (name) VALUES ("${obj.event}");`, (err) => {
        if (err) reject(err);
        resolve();
      });
    });

    const sports = new Promise((resolve, reject) => {
      db.run(`INSERT OR IGNORE INTO sports (name) VALUES ("${obj.sport}");`, (err) => {
        if (err) reject(err);
        resolve();
      });
    });

    const games = new Promise((resolve, reject) => {
      db.get(`SELECT id, city FROM games WHERE year = ${obj.year} AND season = ${season};`, (err, row) => {
        if (err) reject(err);
        if (row === undefined) {
          db.run(`INSERT OR IGNORE INTO games (year, season, city) VALUES (${obj.year}, ${season}, "${obj.city}");`, (err) => {
            if (err) reject(err);
            resolve();
          });
        } else {
          const cityObject = new Set(row.city.split(', '));
          cityObject.add(obj.city);
          db.run(`UPDATE games SET city = ${"Array.from(cityObject).join(', ')"} WHERE id = ${row.id}`, () => resolve());
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
    this.i += 1;
    if (this.i % 1000 === 0) {
      console.log(`-> ${this.i}  ${new Date()}`);
    }
  }
}

module.exports = { ProcessLineToDB };
