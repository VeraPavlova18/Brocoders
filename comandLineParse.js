const {medalsBarChart} = require('./createGrafs.js');
const {inseartTeamsnocName, inseartResultsYearCountOfMedals} = require('./bdQueries.js');
const consoleArr = process.argv;
const barChart = process.argv[2];

printToConsole();

async function printToConsole() { 
    const {medals, season, noc} = await lineParse(consoleArr);    
    if (barChart !== "medals" && barChart !== "top-teams") {        
        process.stdout.write('Please chooze correct Bar chart: medals or top-teams');
    } else if (barChart === 'medals') {
        if (season !== false && noc !== false) { 
            const arrResultTest = await inseartResultsYearCountOfMedals(season, medals, noc); 
            return medalsBarChart(arrResultTest);
        } else if (season === false) {
            process.stdout.write('You have to specify season');
        } else if (noc === false) {
            process.stdout.write('You have to specify NOC');
        }
    } else {
        console.log('1')
    }   
}

async function lineParse(arr) {   
    const arrNocTest = await inseartTeamsnocName();
    const arrSeason = ['winter', 'summer'];
    const arrMedal = ['gold', 'silver', 'bronze'];
    const params = {
        medals: false,
        season: false,
        noc: false
    }
    for (let i = 3; i < arr.length; i++) {
        if (isMedal(arr[i], arrMedal)) {
            if (arr[i] === 'gold') {
                params.medals = 1;
            } else if (arr[i] === 'silver') {
                params.medals = 2;
            } else {
                params.medals = 3;
            }    
        } else if (isSeason(arr[i], arrSeason)) {
            params.season = (arr[i] === 'winter') ?1 :0;
        } else if (isNoc(arr[i], arrNocTest)) {
            params.noc = arr[i];
        }
    }
    return params;
}

function isNoc(parametr, arr) {
    return arr.some(obj => parametr.toLowerCase() === obj.noc_name.toLowerCase())
}    
function isSeason(parametr, arr) {
    return arr.some(element => parametr.toLowerCase() === element.toLowerCase())
}    
function isMedal(parametr, arr) {
    return arr.some(element => parametr.toLowerCase() === element.toLowerCase())
}




