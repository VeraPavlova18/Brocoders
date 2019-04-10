const fs = require('fs');
const { parse } = require('./parseLiner');

const titles = {};

function getTitles() {
  return new Promise((res, rej) => {
    if (!titles.arr) {
      const stream = fs.createReadStream('./athlete_events.csv', {
        highWaterMark: 16,
      });
      let buffer = '';

      stream.on('data', (chunk) => {
        stream.pause();
        buffer += chunk;
        if (buffer.indexOf('\n') !== -1) {
          const str = buffer.substring(0, buffer.indexOf('\n'));
          titles.size = Buffer.byteLength(str, 'utf8') + 1;
          titles.arr = parse(str).map(title => title.toLowerCase());
          res(titles);
        } else {
          stream.resume();
        }
      });
      stream.on('error', err => rej(err));
    } else {
      res(titles);
    }
  });
}

module.exports = { getTitles };
