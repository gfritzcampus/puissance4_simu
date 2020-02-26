console.log('Launch simu with nodemon and agrv: ' + JSON.stringify(process.argv.slice(2)));
var app = require('nodemon')({
  args: process.argv.slice(2)
});
