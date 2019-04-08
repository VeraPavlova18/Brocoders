/* eslint-disable max-len */
const { insTeamsnocName, insGamesYear } = require('./bdQueries.js');

const params = {
  medals: false,
  season: false,
  noc: false,
  year: false,
};
const arrTypeOfSeason = ['winter', 'summer'];
const medalType = {
  gold: 1,
  silver: 2,
  bronze: 3,
};
const isNoc = (fromCons, arr = []) => arr.some(obj => fromCons.toLowerCase() === obj.noc_name.toLowerCase());
const isYear = (fromCons, arr = []) => arr.some(obj => +fromCons === obj.year);
const isSeason = (fromCons, arr = []) => arr.some(element => fromCons.toLowerCase() === element.toLowerCase());
const isMedal = (fromCons, arr = []) => arr.some(element => fromCons.toLowerCase() === element.toLowerCase());

async function lineParse(consoleArr) {
  let arrOfNocs;
  let arrOfYears;
  if (process.argv[2] === 'medals') {
    arrOfNocs = await insTeamsnocName();
  } else if (process.argv[2] === 'top-teams') {
    arrOfYears = await insGamesYear();
  }
  for (let i = 3; i < consoleArr.length; i += 1) {
    if (isMedal(consoleArr[i])) {
      params.medals = medalType['consoleArr[i]'.toLowerCase()];
    } else if (isSeason(consoleArr[i], arrTypeOfSeason)) {
      params.season = (consoleArr[i] === 'winter') ? 1 : 0;
    } else if (isNoc(consoleArr[i], arrOfNocs)) {
      params.noc = consoleArr[i];
    } else if (isYear(consoleArr[i], arrOfYears)) {
      params.year = +consoleArr[i];
    }
  }
  return params;
}

module.exports = { lineParse };
