const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./olympic_history.db');
const fs = require('fs');
let i = 0;
let titles = [];

db.run(`DELETE FROM athletes;`);
db.run(`DELETE FROM events;`);
db.run(`DELETE FROM games;`);
db.run(`DELETE FROM results;`);
db.run(`DELETE FROM sports;`);
db.run(`DELETE FROM teams;`);
 
const stream = fs.createReadStream('./athlete_events.csv', {
    highWaterMark: 16
})

let buffer = '';

stream.on('data', function(chunk) {
    stream.pause();
    buffer = buffer + chunk;
    if (buffer.indexOf('\n') !== -1 && buffer !== undefined) {
        const arr = buffer.split('\n');
        buffer = arr.pop();        
        Promise.all(arr.map(row => parseLine(row))).then(() => stream.resume());
    } else {
        stream.resume()
    }
});

//--> events       
const events = (name) => new Promise((res) => {
    db.get(`SELECT id FROM events where name = ?;`, [name], (err, row) => {
        if (row === undefined) {
            db.run(`INSERT INTO events (name) VALUES (?);`, [name], function() {
                db.get(`SELECT id FROM events WHERE name = ?;`, [name], (err, row) => res(row.id));   
            });
        } else {
            res(row.id)
        }
    });
});
//<-- events

//--> sports 
const sports = (name) => new Promise((res) => {
    db.get(`SELECT id FROM sports where name = ?;`, [name], (err, row) => {
        if (row === undefined) {
            db.run(`INSERT INTO sports (name) VALUES (?);`, [name], function() {
                db.get(`SELECT id FROM sports where name = ?;`, [name], (err, row) => res(row.id));   
            });
        } else {
            res(row.id)
        }
    });
});
//<-- sports 

//--> games 
const games = (year, season, city) => new Promise((res) => {
    db.get(`SELECT id, city FROM games WHERE year = ? AND season = ?;`, [year, season], (err, row) => {
        if (row === undefined) {
            db.run(`INSERT INTO games (year, season, city) VALUES (?, ?, ?);`, [year, season, JSON.stringify([city])], function() {
                db.get(`SELECT id FROM games where year = ? AND season = ?;`, [year, season], (err, row) => res(row.id));   
            });
        } else {
            const cityObject = new Set(JSON.parse(row.city));
            cityObject.add(city);
            db.run(`UPDATE games SET city = ? WHERE id = ?`, [JSON.stringify(Array.from(cityObject)), row.id], () => res(row.id))
        }
    });
});
//<-- games 

//--> teams 
const teams = (name, noc_name) => new Promise((res) => {
    db.get(`SELECT id FROM teams where noc_name = ?;`, [noc_name], (err, row) => {
        if (row === undefined) {
            db.run(`INSERT INTO teams (name, noc_name) VALUES (?, ?);`, [name, noc_name], function() {
                db.get(`SELECT id FROM teams where noc_name = ?;`, [noc_name], (err, row) => res(row.id));   
            });
        } else {
            res(row.id)
        }
    });
});             
//<-- teams

//--> athletes  
const athletes = (full_name, sex, year_of_birth, params, team_id) => new Promise((res) => {
    db.get(`SELECT id FROM athletes where full_name = ?;`, [full_name], (err, row) => {
        if (row === undefined) {
            db.run(`INSERT INTO athletes (full_name, sex, year_of_birth, params, team_id) 
                    VALUES (?, ?, ?, ?, ?);`, [full_name, sex, year_of_birth, JSON.stringify(params), team_id], function() {
                db.get(`SELECT id FROM athletes where full_name = ?;`, [full_name], (err, row) => res(row.id));   
            });
        } else {
            res(row.id)
        }
    });
}); 
//<-- athletes  

//--> results
const results = (athlete_id, game_id, sport_id, event_id, medal) => new Promise((res) => {
    db.get(`SELECT id FROM results where athlete_id = ? AND game_id = ? AND sport_id = ? AND event_id = ?;`, [athlete_id, game_id, sport_id, event_id,], (err, row) => {
        if (row === undefined) {
            db.run(`INSERT INTO results (athlete_id, game_id, sport_id, event_id, medal) 
                    VALUES (?, ?, ?, ?, ?);`, [athlete_id, game_id, sport_id, event_id, medal], function() {
                db.get(`SELECT id FROM results where athlete_id = ? AND game_id = ? AND sport_id = ? AND event_id = ?;`, [athlete_id, game_id, sport_id, event_id,], (err, row) => res(row.id));   
            });
        } else {
            res(row.id)
        }
    });
});   
//<-- results

function parse(line) {
    line = line.replace('\r', '');
    let opened = false;
    let openedByQuote = false;
    const arr = [];
    for (let i = 0; i < line.length; i++) {
        switch (line[i]) {
            case '"':
                if (opened !== false && openedByQuote === true) {
                    if ([',', '\n', '\0'].indexOf(line[i + 1]) === -1) {
                        continue;
                    }
                    arr.push(line.substring(opened, i + 1));
                    opened = openedByQuote = false;
                } else {
                    opened = i;
                    openedByQuote = true;
                }
            break;
            
            case ',':
                if (opened === false) {
                    opened = i + 1;
                } else if (openedByQuote === false) {
                    arr.push(line.substring(opened, i));
                    if (['"', '\n', '\0'].indexOf(line[i + 1]) === -1) {
                        opened = i + 1;
                    }
                }
            break;
        }
    }

    if (opened) {
        arr.push(line.substr(opened));
    }

    return arr.map(column => column.replace(/^"(.+?)"$/g, '$1').replace(/["(]+.+?[")]+/g, ''))
        .map(column => column === 'NA' ? null : column);
}

async function parseLine(line) {  
    if (i === 0) {
        titles = parse(line).map(title => title.toLowerCase());  
    } else {     
        // --> full bdObject   
        const obj = {};
        const row = parse(line);        
        for (let j = 0; j < titles.length; j++) {
            obj[titles[j]] = row[j];
        } 
        //<-- full bdObject

        if (+obj.year === 1906 && obj.season.toLowerCase() === 'summer') {
            return;
        }

        // console.log(obj);
        
        //--> events 
        const eventsName = obj.event;
        const eventId = await events(eventsName);
        //<-- events

        //--> sports        
        const sportsName = obj.sport;            
        const sportsId = await sports(sportsName);                        
        //<-- sports

        //--> games         
        const year = obj.year;
        const season = obj.season.toLowerCase() === 'summer' ? 0 : 1;
        const city = obj.city;
        const gamesId = await games(year, season, city);              
        //<-- games      
        
        //--> teams
        const teamsName = (obj.team.indexOf('-') !== -1) ?obj.team.substr(0, obj.team.indexOf('-')) :obj.team;
        const noc_name = obj.noc;        
        const teamsId = await teams(teamsName, noc_name); 
        //<-- teams

        //--> athletes
        obj.params = {};        
        if (obj.height !== null) obj.params.height = obj.height;        
        if (obj.weight !== null) obj.params.weight = obj.weight;               
        const full_name = obj.name.trim().replace(/""/g, '"').replace(/["(].+?[")]\s*/g, '');
        const sex = ([undefined, 'NA', ''].indexOf(obj.sex) > -1) ? null : obj.sex;
        const year_of_birth = ([undefined, 'NA', ''].indexOf(obj.year) > - 1 || [undefined, 'NA', ''].indexOf(obj.age) > -1) ?null :`${obj.year} - ${obj.age}`;
        const athletesId = await athletes(full_name, sex, year_of_birth, obj.params, teamsId); 
        //<-- athletes

        //--> results  
        let medal = (obj.medal === null) ?0 :obj.medal.toLowerCase();
        switch (medal) {
            case "gold": 
                medal = 1;
              break;
            case "silver":
                medal = 2;
              break;
            case "bronze":
                medal = 3;
              break;
            default:
                medal = 0;
        } 
        const resultsId = await results(athletesId, gamesId, sportsId, eventId, medal); 
        //<-- results   
       
    }       
    i++;
    if (i%1000 === 0) {
        console.log(i);
    }
}

