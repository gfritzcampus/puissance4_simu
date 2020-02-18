const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const path = require('path');
const board = require('./board_config');
const powerSerialPort = require('./powerSerialPort');
const codec = require('./codec');
const octicons = require('octicons');

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

  let serial = new powerSerialPort(socket, (data) => {
    let decoded = codec.decodeRingCommand(data, board.leds_per_ring);
    current_board[decoded.row][decoded.column] = decoded.leds;
    socket.emit('update_ring_status',new Date().getTime(), data.toString(), decoded);
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

  serial = new powerSerialPort(socket, (data) => {
    let decoded = codec.decodePlayerCommand(data);
    socket.emit('player_event', new Date().getTime(), data.toString(), decoded);
  });

  socket.on('ring_update', function(data) {
    serial.write(codec.encodeRingCommand(data.row, data.column, data.leds));
  });
});

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



http.listen(argv.port ? argv.port : 3000, function() { 
  let port = this.address().port;
  console.log('listening on *:' + port);
  console.log('You can access to serveur using : http://localhost:' + port);
});
