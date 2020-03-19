const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const path = require('path');
const board = require('./board_config');
const powerSerialPort = require('./powerSerialPort');
const codec = require('./codec');
const octicons = require('octicons');
const async = require('async');

app.use('/', express.static(path.resolve(__dirname, 'public')));
app.use('/static', express.static(path.resolve(__dirname, '../node_modules/bootstrap/dist')));
app.use('/static/js', express.static(path.resolve(__dirname, '../node_modules/jquery/dist')));
app.use('/static/js', express.static(path.resolve(__dirname, '../node_modules/popper.js/dist/umd')));
app.use('/static/js', express.static(path.resolve(__dirname, '../node_modules/socket.io-client/dist')));
app.use('/static/js', express.static(path.resolve(__dirname, '../node_modules/jquery.terminal/js')))
app.use('/static/css', express.static(path.resolve(__dirname, '../node_modules/jquery.terminal/css')));
app.use('/static/js', express.static(path.resolve(__dirname, '../node_modules/bootstrap4-toggle/js')))
app.use('/static/css', express.static(path.resolve(__dirname, '../node_modules/bootstrap4-toggle/css')));
app.use('/static', express.static(path.resolve(__dirname, 'public')));
app.use('/static/img/octicons', express.static(path.resolve(__dirname, '../node_modules/octicons/build/svg')));

app.get('favicon.ico', function(req, res) {
  res.sendFile(path.resolve(__dirname, 'public/img/favicon.ico'));
});

app.get('/static/css/octicons.css', function(req, res) {
  res.sendFile(path.resolve(__dirname, '../node_modules/octicons/build/build.css'));
});

io.of('ihm').on('connection', function(socket) {
  console.log('an ihm user connected');
  let current_board = [];
  for(let r = 0; r < board.rows; r++) {
    current_board.push([]);
    for(let c = 0; c < board.columns; c++) {
      current_board[r].push([]);
      for (let l = 0; l < board.leds_per_ring; l++) {
        current_board[r][c].push([0,0,0]);
      }
    }
  }

  let received="";
  let serial = new powerSerialPort(socket, (data) => {
    console.log('Received from core: ' + JSON.stringify(data));
    received = codec.accumulateIhmCommand(received, data);

    while (!codec.isIhmCommandComplete(received, board.leds_per_ring) && received.indexOf('\n') != -1) {
      received = received.substring(received.indexOf('\n')+1);
    }

    async.whilst(
      (cb) => cb(null,codec.isIhmCommandComplete(received, board.leds_per_ring)),
      (next) => {
        let decoded = codec.decodeIhmCommand(received, board.leds_per_ring);

        let promise = new Promise((resolve, reject) => {
          socket.emit(decoded.name ,new Date().getTime(), decoded.raw, decoded.decoded);
          resolve();
        });
        promise.then(() => {
          received = codec.clearIhmCommand(received, board.leds_per_ring);
          next(null, received);
        });
      },
      (err, n) => {}
    );
  });

  socket.on('get_board_status', (fn) => {
    console.log('Ask for board status');
    fn(current_board);
  });

  socket.on('player_action', (player, action, status) => {
    console.log('Player ' + player + ' => ' + action + ' : ' + status);
    serial.write(codec.encodePlayerCommand(player, action, status));
  });
});

io.of('core').on('connection', function(socket) {
  console.log('a core user connected');

  let received = "";
  serial = new powerSerialPort(socket, (data) => {
    console.log('Received from IHM: ' + JSON.stringify(data));
    received = codec.accumulatePlayerCommand(received, data);

    while(!codec.isPlayerCommandComplete(received) && received.indexOf('\n') != -1) {
      received = received.substring(received.indexOf('\n')+1);
    }

    while(codec.isPlayerCommandComplete(received)) {
      let decoded = codec.decodePlayerCommand(received);
      socket.emit('player_event', new Date().getTime(), received, decoded);
      received = codec.clearPlayerCommand(received);
    }
  });

  socket.on('ring_update', function(data) {
    serial.write(codec.encodeRingCommand(data.row, data.column, data.leds, board.leds_per_ring));
  });

  socket.on('ring_short_update', function(data) {
    serial.write(codec.encodeShortRingCommand(data.row, data.column, data.color));
  });

  socket.on('zone_color', function(data) {
    serial.write(codec.encodeZoneColorCommand(data.zone, data.color));
  });

  socket.on('zone_on', function(data) {
    serial.write(codec.encodeZoneOnCommand(data.zone));
  });

  socket.on('zone_off', function(data) {
    serial.write(codec.encodeZoneOffCommand(data.zone));
  });

  socket.on('zone_intensity', function(data) {
    serial.write(codec.encodeZoneIntensityCommand(data.zone, data.intensity));
  });

  socket.on('zone_blink', function(data) {
    serial.write(codec.encodeZoneBlinkCommand(data.zone, data.blink));
  });
});

console.log(JSON.stringify(process.argv));

const argv = require('yargs')
  .usage('Usage $0 [options]')
  .alias('p', 'port')
  .nargs('p', 1)
  .number('p')
  .describe('p', 'Port to start simu')
  .help('h')
  .alias('h', 'help')
  .alias('v', 'version')
  .default('port', 3000)
  .argv;

http.listen(argv.hasOwnProperty('port') ? argv.port : 3000, function() { 
  let port = this.address().port;
  console.log('listening on *:' + port);
  console.log('You can access to serveur using : http://localhost:' + port);
  let fs = require('fs');
  fs.writeFileSync('.simu_env', 'SIMU_PORT='+port+'\nSIMU_PID='+process.pid+'\n');
});

function exitHandler(options, exitCode) {
  if (options.cleanup) {
    let fs = require('fs');
    fs.unlinkSync('.simu_env');
  }
  if (exitCode || exitCode === 0) console.log(exitCode);
  if (options.exit) process.exit();
}

//do something when app is closing
process.on('exit', exitHandler.bind(null,{cleanup:true}));

//catches ctrl+c event
process.on('SIGINT', exitHandler.bind(null, {exit:true}));

// catches "kill pid" (for example: nodemon restart)
process.on('SIGUSR1', exitHandler.bind(null, {exit:true}));
process.on('SIGUSR2', exitHandler.bind(null, {exit:true}));

//catches uncaught exceptions
process.on('uncaughtException', exitHandler.bind(null, {exit:true}));
