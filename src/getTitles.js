const fs = require('fs');
const { parse } = require('./parseLiner');

function getTitles() {
  return new Promise((res, rej) => {
    const stream = fs.createReadStream('./athlete_events.csv', {
      highWaterMark: 16,
    });
    let buffer = '';
    const titles = {};

    stream.on('data', (chunk) => {
      stream.pause();
      buffer += chunk;
      if (buffer.indexOf('\n') !== -1) {
        const str = buffer.substring(0, buffer.indexOf('\n'));
        titles.arr = parse(str).map(title => title.toLowerCase());
        titles.size = Buffer.byteLength(str, 'utf8') + 1;
        res(titles);
      } else {
        stream.resume();
      }
    });
    stream.on('error', err => rej(err));
  });
}

module.exports = { getTitles };
