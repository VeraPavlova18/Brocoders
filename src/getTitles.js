const fs = require('fs');

function getTitles() {
  return new Promise((res, rej) => {
    const stream = fs.createReadStream('./athlete_events.csv', {
      highWaterMark: 16,
    });
    let buffer = '';

    stream.on('data', (chunk) => {
      stream.pause();
      buffer += chunk;
      if (buffer.indexOf('\n') !== -1) {
        res(buffer.substring(0, buffer.indexOf('\n')));
      } else {
        stream.resume();
      }
    });
    stream.on('error', err => rej(err));
  });
}

module.exports = { getTitles };
