var term = null;

const getCanvasSize = function(config) {
  let canvas_width = config.radius_of_ring_in_px * config.columns * 2 + config.distance_between_rings_in_px * (config.columns - 1);
  let canvas_height = canvas_width + config.distance_with_header;

  return [canvas_width, canvas_height];
};

const initBoard = function(ctx, config, status) {
  let [canvas_width, canvas_height] = getCanvasSize(config);

  $('#board').width(canvas_width + 'px');
  $('#board').height(canvas_height + 'px');

  displayBoard(ctx, config, status);
};

const getRandomInt = function(max) {
  return Math.floor(Math.random() * Math.floor(max));
}

const displayLed = function(ctx, led, center, config, status) {
  let start_angle = (Math.PI*2)/config.leds_per_ring*led - (Math.PI/2);
  let end_angle = (Math.PI*2)/config.leds_per_ring*(led+1) - (Math.PI/2);
  if (status) {
    ctx.fillStyle = 'rgba(' + status[0] + ',' + status[1] + ',' + status[2] + ',1)';
  } else {
    ctx.fillStyle = 'black';
  }
  ctx.strokeStyle="white";
  ctx.lineWidth=2;
  ctx.beginPath();
  ctx.arc(center.x, center.y, config.radius_of_ring_in_px, start_angle , end_angle, false);
  ctx.lineTo(center.x, center.y);
  ctx.lineTo(center.x + Math.cos(start_angle), center.y + Math.sin(start_angle));
  ctx.fill();
  ctx.stroke();
}

const displayRing = function(ctx, row, col, config, status) {
  let center ={
    x: col*config.radius_of_ring_in_px*2 + config.radius_of_ring_in_px + col*config.distance_between_rings_in_px,
    y: row*config.radius_of_ring_in_px*2 + config.radius_of_ring_in_px + row*config.distance_between_rings_in_px
  };

  for(let led = 0; led < config.leds_per_ring; led++) {
    displayLed(ctx, led, center, config, status && status[led] ? status[led] : null);
  }
  ctx.beginPath();
  ctx.fillStyle = "#282828";// $('#board').css("background-color");
  ctx.arc(center.x, center.y, config.radius_of_ring_in_px/Math.sqrt(2), Math.PI*2, false);
  ctx.fill();
}

const displayBoard = function(ctx, config, status) {
  for(let row = 0; row < config.rows; row++) {
    for(col = 0; col < config.columns; col++) {
      displayRing(ctx, row, col, config, status && status[row] && status[row][col] ? status[row][col] : null);
    }
  }
};

const appSocketNamespace = '/ihm';

const appInitSocket = function(socket) {
  [1,2].forEach((player) => {
    ['left', 'right', 'up', 'down'].forEach((action) => {
      ['up', 'down'].forEach((status) => {
        $('#controls_player'+player+'_'+action).on('mouse'+status, () => {
          socket.emit('player_action', player, action, status);
        });
      });
    });
  });
};

const displayRaw = function(raw) {
  let result = "";

  for(const c of raw) {
    if ('a'.charCodeAt(0) <= c.charCodeAt(0) && c.charCodeAt(0) <= 'z'.charCodeAt(0)
     || 'A'.charCodeAt(0) <= c.charCodeAt(0) && c.charCodeAt(0) <= 'Z'.charCodeAt(0)
     || '0'.charCodeAt(0) <= c.charCodeAt(0) && c.charCodeAt(0) <= '9'.charCodeAt(0)
     || c == '\n') {
      result += c;
    } else {
      let value = c.charCodeAt(0);
      if (value < 16) {
        result += '\\x0' + value.toString(16);
      } else {
        result += '\\x' + value.toString(16);
      }
    }
  }

  return result;
}

const appManageConnectedSocket = function(socket, config) {
  const canvas = $('#board')[0];
  const ctx = canvas.getContext('2d');

  console.log('Get status');
  socket.emit('get_board_status', (status) => {
    console.log('status -> '+ JSON.stringify(status));
    initBoard(ctx, config, status);
  });

  socket.on('update_ring_status', (timestamp, raw, status, ack) => {
    //ack();
    if (term) {
      term.echo(JSON.stringify({
        'timestamp': timestamp, 
        'raw': {
          'length': raw.length,
          'data': displayRaw(raw)
        }, 
        'decoded': status
      }));
    }
    try {
      displayRing(ctx, status.row, status.column, config, status.leds);
    } catch(error) {
      console.log(error);
    }
  });
};

$(() => {
  term = $('#console').terminal((cmd, term) => {
    term.echo(''); // Simply do nothing!
  }, {
    grettings: 'Serial incoming',
    name: 'serial_incoming',
    height: 400,
    prompt: ''
  });
});
