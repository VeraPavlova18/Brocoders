const fs = require('fs');
const { ProcessLineToDB } = require('./processLinetoDB');

function streamOn() {
  const stream = fs.createReadStream('./athlete_events.csv', {
    highWaterMark: 16,
  });
  const toOlympicHistory = new ProcessLineToDB();
  let buffer = '';
  stream.on('data', (chunk) => {
    stream.pause();
    buffer += chunk;
    if (buffer.indexOf('\n') !== -1 && buffer !== undefined) {
      const arr = buffer.split('\n');
      buffer = arr.pop();
      Promise.all(arr.map(row => toOlympicHistory.processLine(row))).then(() => stream.resume());
    } else {
      stream.resume();
    }
  });
}

module.exports = { streamOn };
