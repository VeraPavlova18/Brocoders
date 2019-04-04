const medalsBarChart = function (arr) {
  const arrDiagram = [];
  const square = String.fromCharCode(9632);
  const maxSquare = 200;

  const maxMedal = Math.max(...arr.map(obj => obj.countMedals));
  for (let i = 0; i < arr.length; i += 1) {
    let strSquare = '';
    const count = Math.floor(maxSquare * arr[i].countMedals / maxMedal);
    if (count !== 0) {
      for (let j = 0; j < count; j += 1) {
        strSquare += square;
      }
    }
    arrDiagram.push(`${arr[i].column}    ${strSquare}`);
  }
  process.stdout.write(arrDiagram.join('\r\n'));

  return arrDiagram;
};

module.exports = { medalsBarChart };
