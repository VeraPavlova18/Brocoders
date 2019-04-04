const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./olympic_history.db');

function GetUnicId() {
  db.run('CREATE UNIQUE INDEX IF NOT EXISTS id_athletes_full_name ON athletes (full_name);');
  db.run('CREATE UNIQUE INDEX IF NOT EXISTS id_sports_name ON sports (name);');
  db.run('CREATE UNIQUE INDEX IF NOT EXISTS id_events_name ON events (name);');
}

module.exports = { GetUnicId };
