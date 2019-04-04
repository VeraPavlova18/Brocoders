const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./olympic_history.db');

function GetdbDeleted() {
  db.run('DELETE FROM athletes;');
  db.run('DELETE FROM events;');
  db.run('DELETE FROM games;');
  db.run('DELETE FROM results;');
  db.run('DELETE FROM sports;');
  db.run('DELETE FROM teams;');
}

module.exports = { GetdbDeleted };
