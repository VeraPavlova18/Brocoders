/* eslint-disable no-console */
const { medalsBarChart } = require('./createGrafs.js');
const { insResultsYearCountOfMedals, insResultsTeamsCountOfMedals } = require('./bdQueries.js');
const { lineParse } = require('./statLineParse');

const printToConsole = async function () {
  const {
    medals,
    season,
    noc,
    year,
  } = await lineParse(process.argv);
  if (process.argv[2] !== 'medals' && process.argv[2] !== 'top-teams') {
    console.log('Please chooze correct Bar chart: medals or top-teams');
  } else if (process.argv[2] === 'medals') {
    if (season !== false && noc !== false) {
      const arrResultYearCountOfMedals = await insResultsYearCountOfMedals(season, medals, noc);
      return medalsBarChart(arrResultYearCountOfMedals);
    } if (season === false) {
      console.log('You have to specify season');
    } else if (noc === false) {
      console.log('You have to specify NOC');
    }
  } else if (process.argv[2] === 'top-teams') {
    if (season !== false) {
      const arrResultTeamsCountOfMedals = await insResultsTeamsCountOfMedals(season, year, medals);
      return medalsBarChart(arrResultTeamsCountOfMedals);
    } if (noc === false) {
      console.log('You have to specify season');
    }
  }
};

module.exports = { printToConsole };
