const { medalsBarChart } = require('./src/createGrafs.js');
const {
  inseartTeamsnocName,
  inseartResultsYearCountOfMedals,
  inseartGamesYear,
  inseartResultsTeamsCountOfMedals,
} = require('./src/bdQueries.js');

const barChart = process.argv[2];

printToConsole();

async function printToConsole () {
  const { medals, season, noc, year } = await lineParse(process.argv)
  if (barChart !== 'medals' && barChart !== 'top-teams') {
    process.stdout.write('Please chooze correct Bar chart: medals or top-teams')
  } else if (barChart === 'medals') {
    if (season !== false && noc !== false) {
      const arrResultYearCountOfMedals = await inseartResultsYearCountOfMedals(season, medals, noc)
      return medalsBarChart(arrResultYearCountOfMedals)
    } if (season === false) {
      process.stdout.write('You have to specify season')
    } else if (noc === false) {
      process.stdout.write('You have to specify NOC')
    }
  } else if (barChart === 'top-teams') {
    if (season !== false) {
      const arrResultTeamsCountOfMedals = await inseartResultsTeamsCountOfMedals(season, year, medals)
      return medalsBarChart(arrResultTeamsCountOfMedals)
    } else if (noc === false) {
      process.stdout.write('You have to specify season')
    }
  }
}

async function lineParse(consoleArr) {
  let arrOfNocs;
  let arrOfYears;
  if (barChart === 'medals') {
    arrOfNocs = await inseartTeamsnocName();
  } else if (barChart === 'top-teams') {
    arrOfYears = await inseartGamesYear();
  }
  const arrTypeOfSeason = ['winter', 'summer'];
  const arrTypeOfMedal = ['gold', 'silver', 'bronze'];
  const params = {
    medals: false,
    season: false,
    noc: false,
    year: false,
  };
  for (let i = 3; i < consoleArr.length; i++) {
    if (isMedal(consoleArr[i], arrTypeOfMedal)) {
      if (consoleArr[i] === 'gold') {
        params.medals = 1;
      } else if (consoleArr[i] === 'silver') {
        params.medals = 2;
      } else if (consoleArr[i] === 'bronze') {
        params.medals = 3;
      }
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

function isNoc(parametrInConsole, arrOfRealparametrs = []) {
  return arrOfRealparametrs.some(obj => parametrInConsole.toLowerCase() === obj.noc_name.toLowerCase());
}
function isYear(parametrInConsole, arrOfRealparametrs = []) {
  return arrOfRealparametrs.some(obj => +parametrInConsole === obj.year);
}
function isSeason(parametrInConsole, arrOfRealparametrs = []) {
  return arrOfRealparametrs.some(element => parametrInConsole.toLowerCase() === element.toLowerCase());
}
function isMedal(parametrInConsole, arrOfRealparametrs = []) {
  return arrOfRealparametrs.some(element => parametrInConsole.toLowerCase() === element.toLowerCase());
}
