/* eslint-disable no-console */
const square = String.fromCharCode(9632);
const maxSquare = 200;

const medalsBarChart = function (arr) {
  const maxMedal = Math.max(...arr.map(({ countMedals }) => countMedals));
  const arrDiagram = arr.map(({ countMedals, column }) => {
    const count = Math.floor(maxSquare * countMedals / maxMedal);
    return `${column}    ${square.repeat(count)}`;
  });

  console.log(arrDiagram.join('\r\n'));
  return arrDiagram;
};

module.exports = { medalsBarChart };
