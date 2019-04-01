const { GetdbDeleted } = require('./src/dbDeletedAll');
const { streamOn } = require('./src/stream');

GetdbDeleted();
streamOn();
