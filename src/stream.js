/* eslint-disable no-restricted-syntax */
const fs = require('fs');
const { ProcessLineToDB } = require('./processLinetoDB');

const toOlympicHistory = new ProcessLineToDB();

async function streamOn() {
  const stream = fs.createReadStream('./athlete_events.csv');
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
