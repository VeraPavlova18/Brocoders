const { GetdbDeleted } = require('./src/dbDeletedAll');
const { streamOn } = require('./src/stream');
const { GetUnicId } = require('./src/dbUnicQueries');

GetdbDeleted();
GetUnicId();
streamOn();
