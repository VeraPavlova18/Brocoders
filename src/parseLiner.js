function parse(line) {
  line = line.replace('\r', '');
  let opened = false;
  let openedByQuote = false;
  const arr = [];
  for (let i = 0; i < line.length; i += 1) {
    switch (line[i]) {
      case '"':
        if (opened !== false && openedByQuote === true) {
          if ([',', '\n', '\0'].indexOf(line[i + 1]) === -1) {
            continue;
          }
          arr.push(line.substring(opened, i + 1));
          opened = openedByQuote = false;
        } else {
          opened = i;
          openedByQuote = true;
        }
        break;

      case ',':
        if (opened === false) {
          opened = i + 1;
        } else if (openedByQuote === false) {
          arr.push(line.substring(opened, i));
          if (['"', '\n', '\0'].indexOf(line[i + 1]) === -1) {
            opened = i + 1;
          }
        }
        break;
      default:
    }
  }

  if (opened) {
    arr.push(line.substr(opened));
  }

  return arr.map(column => column.replace(/^"(.+?)"$/g, '$1').replace(/["(]+.+?[")]+/g, ''))
    .map(column => (column === 'NA' ? null : column));
}

module.exports = { parse };
