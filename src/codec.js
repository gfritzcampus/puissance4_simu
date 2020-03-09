const encodeByteToHex = function(col) {
  return (col < 16 ? '0' : '') + col.toString(16).toUpperCase();
}

const encodeShortToHex= function(col) {
  let val = col.toString(16).toUpperCase();

  while(val.length < 4) {
    val = '0' + val;
  }

  return val;
}

const encodeRingCommand = function(row, col, leds, expectedNbLeds) {
  let cmd = 'r';

  cmd += row;
  cmd += col;

  if (expectedNbLeds == 1) {
    cmd += encodeByteToHex(leds[0][0]);
    cmd += encodeByteToHex(leds[0][1]);
    cmd += encodeByteToHex(leds[0][2]);
  }
  else {
    leds.forEach((led) => {
      cmd+=String.fromCharCode(led[0]);
      cmd+=String.fromCharCode(led[1]);
      cmd+=String.fromCharCode(led[2]);
    });
  }
  cmd += '\n';

  return cmd;
};

const decodeRingCommand = function(rawdata, expectedNbLeds) {
  console.log('Try to decode ring command :' + JSON.stringify(rawdata));
  if (isRingCommandComplete(rawdata, expectedNbLeds)) {
    let result = { 
      'row': parseInt(rawdata[1]),
      'column': parseInt(rawdata[2]),
      'leds': []
    };

    if (expectedNbLeds == 1) {
      result.leds.push([
        parseInt(rawdata[3]+rawdata[4], 16),
        parseInt(rawdata[5]+rawdata[6], 16),
        parseInt(rawdata[7]+rawdata[8], 16),
      ])
    }
    else {
      for(let i = 0; i < expectedNbLeds; i++) {
        result.leds.push([
          rawdata.charCodeAt(3 + (i*3)),
          rawdata.charCodeAt(4 + (i*3)),
          rawdata.charCodeAt(5 + (i*3)),
        ]);
      }
    }
    return result;
  }
  return {};
};

const accumulateRingCommand = function(received, rawdata) {
  rawdata = rawdata.toString();
  for (let i = 0; i < rawdata.length; i++) {
    if (received[0] != 'r') {
      received = rawdata[i];
    } else {
      received += rawdata[i];
    }
  }
  return received;
};

const isRingCommandComplete = function(rawdata, expectedNbLeds) {
  if (expectedNbLeds == 1) {
    return rawdata.length >= 10 && rawdata[0] == 'r' && rawdata[9] == '\n';
  }
  else {
    return rawdata.length >= (4 + expectedNbLeds * 3) && rawdata[0] == 'r' && rawdata[3 + expectedNbLeds * 3] == '\n';
  }
};

const clearRingCommand = function(received, expectedNbLeds) {
  if (expectedNbLeds == 1) {
    do {
      received = received.substring(received.indexOf('\n')+1);
    } while(received.length > 0 && received[0] != 'p');
    return received;
  }
  else {
    do {
      received = received.substring(4 + expectedNbLeds * 3);
    } while(received.length > 0 && received[0] != 'r');
    return received;
  }
}

const encodePlayerCommand = function(player, command, status) {
  let cmd = 'p';

  cmd += player == 1 ? '1' : '2';
  cmd += command.toLowerCase()[0];
  cmd += status.toLowerCase()[0];
  cmd += '\n';

  return cmd;
};

const decodePlayerCommand = function(rawdata) {
  console.log('Try to decode player command :' + JSON.stringify(rawdata));
  if (isPlayerCommandComplete(rawdata)) {
    let player = rawdata[1] == '1' ? 1 : 
                 rawdata[1] == '2' ? 2 :
                                     0 ;
    let command = rawdata[2] == 'u' ? 'up' :
                  rawdata[2] == 'd' ? 'down' :
                  rawdata[2] == 'l' ? 'left' : 
                  rawdata[2] == 'r' ? 'right' :
                                      'unknown';

    let status = rawdata[3] == 'u' ? 'up' :
                 rawdata[3] == 'd' ? 'down' :
                                     'unknown'

    return { 'player': player, 'command': command, 'status': status };
  }

  return {};
};

const accumulatePlayerCommand = function(received, rawdata) {
  rawdata = rawdata.toString();
  for (let i = 0; i < rawdata.length; i++) {
    if (rawdata[i] == 'p' && received[0] != 'p') {
      received = rawdata[i];
    } else {
      received += rawdata[i];
    }
  }
  return received;
};

const isPlayerCommandComplete = function(rawdata) {
  return rawdata.length >= 5 && rawdata[0] == 'p' && rawdata[4] == '\n';
};

const clearPlayerCommand = function(received) {
  do {
    received = received.substring(received.indexOf('\n')+1);
  } while(received.length > 0 && received[0] != 'p');
  return received;
};

const encodeZoneColorCommand = function(zone, color) {
  let cmd='c';
  
  cmd += zone.top_left.row;
  cmd += zone.top_left.column;
  cmd += zone.bottom_right.row;
  cmd += zone.bottom_right.column;
  cmd += encodeByteToHex(color[0]);
  cmd += encodeByteToHex(color[1]);
  cmd += encodeByteToHex(color[2]);
  cmd += '\n';

  return cmd;
};

const encodeZoneOnCommand = function(zone) {
  let cmd='O';

  cmd += zone.top_left.row;
  cmd += zone.top_left.column;
  cmd += zone.bottom_right.row;
  cmd += zone.bottom_right.column;
  cmd += '\n';

  return cmd;
};

const encodeZoneOffCommand = function(zone) {
  let cmd='o';

  cmd += zone.top_left.row;
  cmd += zone.top_left.column;
  cmd += zone.bottom_right.row;
  cmd += zone.bottom_right.column;
  cmd += '\n';

  return cmd;
};

const encodeZoneIntensityCommand = function(zone, intensity) {
  let cmd='i';

  cmd += zone.top_left.row;
  cmd += zone.top_left.column;
  cmd += zone.bottom_right.row;
  cmd += zone.bottom_right.column;
  cmd += encodeByteToHex(intensity);
  cmd += '\n';

  return cmd;
};

const encodeZoneBlinkCommand = function(zone, blink) {
  let cmd='b';

  cmd += zone.top_left.row;
  cmd += zone.top_left.column;
  cmd += zone.bottom_right.row;
  cmd += zone.bottom_right.column;
  cmd += encodeShortToHex(blink.on);
  cmd += encodeShortToHex(blink.off);
  cmd += '\n';

  return cmd;
};

module.exports = {
  'encodePlayerCommand': encodePlayerCommand,
  'decodePlayerCommand': decodePlayerCommand,
  'isPlayerCommandComplete': isPlayerCommandComplete,
  'accumulatePlayerCommand': accumulatePlayerCommand,
  'clearPlayerCommand': clearPlayerCommand,

  'encodeRingCommand': encodeRingCommand,
  'decodeRingCommand': decodeRingCommand,
  'isRingCommandComplete': isRingCommandComplete,
  'accumulateRingCommand': accumulateRingCommand,
  'clearRingCommand': clearRingCommand,

  'encodeZoneColorCommand': encodeZoneColorCommand,

  'encodeZoneOnCommand': encodeZoneOnCommand,

  'encodeZoneOffCommand': encodeZoneOffCommand,

  'encodeZoneIntensityCommand': encodeZoneIntensityCommand,

  'encodeZoneBlinkCommand': encodeZoneBlinkCommand,
};
