/* eslint-disable no-restricted-syntax */
const fs = require('fs');
const { ProcessLineToDB } = require('./processLinetoDB');
const { getTitles } = require('./getTitles');

const toOlympicHistory = new ProcessLineToDB();

async function streamOn() {
  const start = Buffer.byteLength(await getTitles(), 'utf8') + 1;
  const stream = fs.createReadStream('./athlete_events.csv',
    { start, highWaterMark: 16 });
  let buffer = '';

  for await (const chunk of stream) {
    buffer += chunk;
    if (buffer.indexOf('\n') !== -1 && buffer !== undefined) {
      const arr = buffer.split('\n');
      buffer = arr.pop();
      Promise.all(arr.map(row => toOlympicHistory.processLine(row)));
    }
  }
}

module.exports = { streamOn };
