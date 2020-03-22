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
    let rgba = 'rgba(' + status[0] + ',' + status[1] + ',' + status[2] + ',' +
                    (typeof status[3] === 'undefined' ? '1' : ''+(status[3]/100).toFixed(2)) + ')';
    ctx.fillStyle = rgba;
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

  ctx.fillStyle = "#282828";// $('#board').css("background-color");
  ctx.arc(center.x, center.y, config.radius_of_ring_in_px, Math.PI*2, false);
  ctx.fill();
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

const logInTerm = function(timestamp, raw, decoded) {
  if (term) {
    term.echo(JSON.stringify({
      'timestamp': timestamp, 
      'raw': {
        'length': raw.length,
        'data': displayRaw(raw)
      }, 
      'decoded': decoded
    }));
  }
};

const appManageConnectedSocket = function(socket, config) {
  const canvas = $('#board')[0];
  const ctx = canvas.getContext('2d');
  let zone = [];
  for(let r = 0; r < config.rows; r++) {
    zone.push([]);
    for(let c = 0; c < config.columns; c++) {
      zone[r].push({
        color:[ 0,0,0 ],
        intensity: 100,
        status: 'off',
        blink: {
          on: 500,
          off: 500
        }
      });
    }
  }
  console.log('Get status');
  socket.emit('get_board_status', (status) => {
    console.log('status -> '+ JSON.stringify(status));
    initBoard(ctx, config, status);
  });
  
  const changeRingColor = function(r, c, color) {
    let status = [];
    for (let l = 0; l < config.leds_per_ring; l++) {
      status.push(color);
    }
    displayRing(ctx, r, c, config, status);
  };

  const turnOnRing = function(r, c) {
    let color = zone[r][c].color.concat([zone[r][c].intensity]);
    changeRingColor(r,c,color);
  };

  const turnOffRing = function(r, c) {
    changeRingColor(r,c,[0, 0, 0]);
  };

  socket.on('update_short_ring_status', (timestamp, raw, color) => {
    logInTerm(timestamp, raw, color);
    try {
      zone[color.row][color.column].color = color.color;
      if (color.color[0] == 0 && color.color[1] == 0 && color.color[2] == 0) {
        turnOffRing(color.row, color.column);
        zone[color.row][color.column].status = 'off';
      } else {
        turnOnRing(color.row, color.column);
        zone[color.row][color.column].status = 'on';
      }
    } catch(error) {
      console.log(error);
    }
  });

  socket.on('update_ring_status', (timestamp, raw, status) => {
    logInTerm(timestamp, raw, status);
    try {
      displayRing(ctx, status.row, status.column, config, status.leds);
    } catch(error) {
      console.log(error);
    }
  });

  socket.on('change_zone_color', (timestamp, raw, zone_color) => {
    logInTerm(timestamp, raw, zone_color);
    try {
      for(let r = zone_color.zone.top_left.row; r <= zone_color.zone.bottom_right.row; ++r) {
        for(let c = zone_color.zone.top_left.column; c <= zone_color.zone.bottom_right.column; ++c) {
          zone[r][c].color = zone_color.color;
        }
      }
    } catch(error) {
      console.log(error);
    }
  });

  socket.on('turn_zone_on', (timestamp, raw, zone_on) => {
    logInTerm(timestamp, raw, zone_on);
    try {
      for(let r = zone_on.zone.top_left.row; r <= zone_on.zone.bottom_right.row; ++r) {
        for(let c = zone_on.zone.top_left.column; c <= zone_on.zone.bottom_right.column; ++c) {
          zone[r][c].status='on';
          turnOnRing(r, c);
        }
      }
    } catch(error) {
      console.log(error);
    }
  });

  socket.on('turn_zone_off', (timestamp, raw, zone_off) => {
    logInTerm(timestamp, raw, zone_off);
    try {
      for(let r = zone_off.zone.top_left.row; r <= zone_off.zone.bottom_right.row; ++r) {
        for(let c = zone_off.zone.top_left.column; c <= zone_off.zone.bottom_right.column; ++c) {
          zone[r][c].status='off';
          turnOffRing(r, c);
        }
      }
    } catch(error) {
      console.log(error);
    }
  });

  socket.on('change_zone_intensity', (timestamp, raw, zone_intensity) => {
    logInTerm(timestamp, raw, zone_intensity);
    try {
      for(let r = zone_intensity.zone.top_left.row; r <= zone_intensity.zone.bottom_right.row; ++r) {
        for(let c = zone_intensity.zone.top_left.column; c <= zone_intensity.zone.bottom_right.column; ++c) {
          zone[r][c].intensity = zone_intensity.intensity;
          if (zone[r][c].status=='on') {
            turnOnRing(r, c);
          }
        }
      }
    } catch(error) {
      console.log(error);
    }
  });

  socket.on('change_zone_blink', (timestamp, raw, zone_blink) => {
    logInTerm(timestamp, raw, zone_blink);
    try {
      for(let r = zone_blink.zone.top_left.row; r <= zone_blink.zone.bottom_right.row; ++r) {
        for(let c = zone_blink.zone.top_left.column; c <= zone_blink.zone.bottom_right.column; ++c) {
          zone[r][c].status='blink';
          zone[r][c].blink.on=zone_blink.on;
          zone[r][c].blink.off=zone_blink.off;

          let turnOn = () => {
            if (zone[r][c].status == 'blink') {
              turnOnRing(r,c);
              setTimeout(turnOff, zone[r][c].blink.on);
            }
          };

          let turnOff = () => {
            if (zone[r][c].status == 'blink') {
              turnOffRing(r,c);
              setTimeout(turnOn, zone[r][c].blink.off);
            }
          };

          turnOn();
        }
      }
    } catch(error) {
      console.log(error);
    }
  });
  
  socket.on('debug', (timestamp, raw, debug) => {
    logInTerm(timestamp, raw, debug);
    date = new Date();
    date.setTime(timestamp);
    $('#last_debug').text(date.toISOString() + ' : ' +debug.msg);
  });

  const sendSensorLight = function() {
    try {
      let value = parseInt($('#light_sensor_value').val());
      if (value >= 0 && value <= 255) {
        socket.emit('light_sensor_value', value);
      }
    } catch(error) {
      console.log(error);
    }
  };

  let light_sensor_timer = undefined;
  $('#light_sensor_status').change(() => {
    if ($('#light_sensor_status')[0].checked) {
      light_sensor_timer = setInterval(sendSensorLight, $('#light_sensor_period').val());
      $('#light_sensor_period').prop('disabled', true);
    } else {
      clearInterval(light_sensor_timer);
      $('#light_sensor_period').prop('disabled', false);
    }
  });

  socket.on('disconnect', () => {
    clearInterval(light_sensor_timer);
    $('#light_sensor_period').prop('disabled', false);
    $('#light_sensor_status').prop('checked', false);
  });

  $('#light_sensor_send').off();
  $('#light_sensor_send').on('click', () => {
    sendSensorLight();
  });
};

$(() => {
  term = $('#console').terminal(() => {}, {
    grettings: 'Serial incoming',
    name: 'serial_incoming',
    height: 400,
    prompt: '',
    enabled: false
  });

});
