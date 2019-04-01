const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./olympic_history.db');
const { parse } = require('./parseLiner');

function ProcessLineToDB() {
  let titles = [];
  let i = 0;

  const events = name => new Promise((resolve, reject) => {
    db.get('SELECT id FROM events where name = ?;', [name], (_err, row) => {
      if (row === undefined) {
        db.run('INSERT INTO events (name) VALUES (?);', [name], () => {
          db.get('SELECT id FROM events WHERE name = ?;', [name], (_err, row) => resolve(row.id));
        });
      } else {
        resolve(row.id);
      }
    });
  });

  const sports = name => new Promise((resolve, reject) => {
    db.get('SELECT id FROM sports where name = ?;', [name], (_err, row) => {
      if (row === undefined) {
        db.run('INSERT INTO sports (name) VALUES (?);', [name], () => {
          db.get('SELECT id FROM sports where name = ?;', [name], (_err, row) => resolve(row.id));
        });
      } else {
        resolve(row.id);
      }
    });
  });

  const games = (year, season, city) => new Promise((resolve, reject) => {
    db.get('SELECT id, city FROM games WHERE year = ? AND season = ?;', [year, season], (_err, row) => {
      if (row === undefined) {
        db.run('INSERT INTO games (year, season, city) VALUES (?, ?, ?);', [year, season, JSON.stringify([city])], () => {
          db.get('SELECT id FROM games where year = ? AND season = ?;', [year, season], (_err, row) => resolve(row.id));
        });
      } else {
        const cityObject = new Set(JSON.parse(row.city));
        cityObject.add(city);
        db.run('UPDATE games SET city = ? WHERE id = ?', [JSON.stringify(Array.from(cityObject)), row.id], () => resolve(row.id));
      }
    });
  });

  const teams = (name, nocName) => new Promise((resolve, reject) => {
    db.get('SELECT id FROM teams where noc_name = ?;', [nocName], (_err, row) => {
      if (row === undefined) {
        db.run('INSERT INTO teams (name, noc_name) VALUES (?, ?);', [name, nocName], () => {
          db.get('SELECT id FROM teams where noc_name = ?;', [nocName], (_err, row) => resolve(row.id));
        });
      } else {
        resolve(row.id);
      }
    });
  });

  const athletes = (fullName, sex, yearOfBirth, params, teamId) => new Promise((resolve, reject) => {
    db.get('SELECT id FROM athletes where full_name = ?;', [fullName], (_err, row) => {
      if (row === undefined) {
        db.run(`INSERT INTO athletes (full_name, sex, year_of_birth, params, team_id) 
                        VALUES (?, ?, ?, ?, ?);`, [fullName, sex, yearOfBirth, JSON.stringify(params), teamId], () => {
          db.get('SELECT id FROM athletes where full_name = ?;', [fullName], (_err, row) => resolve(row.id));
        });
      } else {
        resolve(row.id);
      }
    });
  });

  const results = (athleteId, gameId, sportId, eventId, medal) => new Promise((resolve, reject) => {
    db.get('SELECT id FROM results where athlete_id = ? AND game_id = ? AND sport_id = ? AND event_id = ?;', [athleteId, gameId, sportId, eventId], (_err, row) => {
      if (row === undefined) {
        db.run('INSERT INTO results (athlete_id, game_id, sport_id, event_id, medal) VALUES (?, ?, ?, ?, ?);', [athleteId, gameId, sportId, eventId, medal], () => {
          resolve();
        });
      } else {
        resolve();
      }
    });
  });

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
      // console.log(obj);

      // --> events
      const eventsName = obj.event;
      const eventId = await events(eventsName);
      // <-- events

      // --> sports
      const sportsName = obj.sport;
      const sportsId = await sports(sportsName);
      // <-- sports

      // --> games
      const year = obj.year;
      const season = obj.season.toLowerCase() === 'summer' ? 0 : 1;
      const city = obj.city;
      const gamesId = await games(year, season, city);
      // <-- games

      // --> teams
      const teamsName = (obj.team.indexOf('-') !== -1) ? obj.team.substr(0, obj.team.indexOf('-')) : obj.team;
      const nocName = obj.noc;
      const teamsId = await teams(teamsName, nocName);
      // <-- teams

      // --> athletes
      obj.params = {};
      if (obj.height) obj.params.height = obj.height;
      if (obj.weight) obj.params.weight = obj.weight;
      const fullName = obj.name.trim().replace(/""/g, '"').replace(/["(].+?[")]\s*/g, '');
      const sex = obj.sex ? obj.sex : null;
      const yearOfBirth = (obj.year && obj.age) ? `${obj.year} - ${obj.age}` : null;
      const athletesId = await athletes(fullName, sex, yearOfBirth, obj.params, teamsId);
      // <-- athletes

      // --> results
      const medalType = { gold: 1, silver: 2, bronze: 3 };
      let medal = (!obj.medal) ? 0 : obj.medal.toLowerCase();
      medal = medalType[medal] ? medalType[medal] : medal;
      await results(athletesId, gamesId, sportsId, eventId, medal);
      // <-- results
    }
    i += 1;
    if (i % 100 === 0) {
      console.log(`-> ${i}`);
    }
  };
}

module.exports = { ProcessLineToDB };
