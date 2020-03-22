const encodeByteToHex = function(col) {
  return (col < 16 ? '0' : '') + col.toString(16).toUpperCase();
};

const encodeShortToHex= function(col) {
  let val = col.toString(16).toUpperCase();

  while(val.length < 4) {
    val = '0' + val;
  }

  return val;
};

const encodeRingCommand = function(row, col, leds, expectedNbLeds) {
  let cmd = 'r';

  cmd += row;
  cmd += col;

  leds.forEach((led) => {
    cmd += encodeByteToHex(led[0]);
    cmd += encodeByteToHex(led[1]);
    cmd += encodeByteToHex(led[2]);
  });
  cmd += '\n';

  return cmd;
};

const encodeShortRingCommand = function(row, col, color) {
  let cmd = 'R';

  cmd += row;
  cmd += col;
  cmd += encodeByteToHex(color[0]);
  cmd += encodeByteToHex(color[1]);
  cmd += encodeByteToHex(color[2]);
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

    for(let i = 0; i < expectedNbLeds; i++) {
      result.leds.push([
        parseInt(rawdata[3+(i*3*2)]+rawdata[4+(i*3*2)], 16),
        parseInt(rawdata[5+(i*3*2)]+rawdata[6+(i*3*2)], 16),
        parseInt(rawdata[7+(i*3*2)]+rawdata[8+(i*3*2)], 16),
      ]);
    }
    return result;
  }
  return {};
};

const decodeShortRingCommand = function(rawdata, expectedNbLeds) {
  console.log('Try to decode short ring command :' + JSON.stringify(rawdata));
  if (isShortRingCommandComplete(rawdata, expectedNbLeds)) {
    return {
      'row': parseInt(rawdata[1]),
      'column': parseInt(rawdata[2]),
      'color': [
        parseInt(rawdata[3]+rawdata[4], 16),
        parseInt(rawdata[5]+rawdata[6], 16),
        parseInt(rawdata[7]+rawdata[8], 16),
      ]
    };
  }
  return {};
};

const isShortRingCommandComplete = function(rawdata, expectedNbLeds) {
  return rawdata.length >= 10 && rawdata[0] == 'R' && rawdata[9] == '\n';
};

const isZoneColorCommandComplete = function(rawdata, expectedNbLeds) {
  return rawdata.length >= 12 && rawdata[0] == 'c' && rawdata[11] == '\n';
};

const decodeZoneColorCommand = function(rawdata, expectedNbLeds) {
  console.log('Try to decode zone color command : ' + JSON.stringify(rawdata));
  if(isZoneColorCommandComplete(rawdata, expectedNbLeds)) {
    return {
      zone: {
        top_left: {
          row: parseInt(rawdata[1]),
          column: parseInt(rawdata[2])
        },
        bottom_right: {
          row: parseInt(rawdata[3]),
          column: parseInt(rawdata[4])
        }
      },
      color: [
        parseInt(rawdata[5]+rawdata[6], 16),
        parseInt(rawdata[7]+rawdata[8], 16),
        parseInt(rawdata[9]+rawdata[10], 16),
      ]
    };
  }
  return {};
};

const isZoneOnCommandComplete = function(rawdata, expectedNbLeds) {
  return rawdata.length >= 6 && rawdata[0] == 'O' && rawdata[5] == '\n';
};

const decodeZoneOnCommand = function(rawdata, expectedNbLeds) {
  console.log('Try to decode zone on command : ' + JSON.stringify(rawdata));
  if(isZoneOnCommandComplete(rawdata, expectedNbLeds)) {
    return {
      zone: {
        top_left: {
          row: parseInt(rawdata[1]),
          column: parseInt(rawdata[2])
        },
        bottom_right: {
          row: parseInt(rawdata[3]),
          column: parseInt(rawdata[4])
        }
      }
    };
  }
  return {};
};

const isZoneIntensityCommandComplete = function(rawdata, expectedNbLeds) {
  return rawdata.length >= 8 && rawdata[0] == 'i' && rawdata[7] == '\n';
};

const decodeZoneIntensityCommand = function(rawdata, expectedNbLeds) {
  console.log('Try to decode zone intensity command : ' + JSON.stringify(rawdata));
  if(isZoneIntensityCommandComplete(rawdata, expectedNbLeds)) {
    return {
      zone: {
        top_left: {
          row: parseInt(rawdata[1]),
          column: parseInt(rawdata[2])
        },
        bottom_right: {
          row: parseInt(rawdata[3]),
          column: parseInt(rawdata[4])
        }
      },
      intensity: parseInt(rawdata[5] + rawdata[6], 16)
    };
  }
  return {};
};

const isZoneBlinkCommandComplete = function(rawdata, expectedNbLeds) {
  return rawdata.length >= 14 && rawdata[0] == 'b' && rawdata[13] == '\n';
};

const decodeZoneBlinkCommand = function(rawdata, expectedNbLeds) {
  console.log('Try to decode zone blink command : ' + JSON.stringify(rawdata));
  if(isZoneBlinkCommandComplete(rawdata, expectedNbLeds)) {
    return {
      zone: {
        top_left: {
          row: parseInt(rawdata[1]),
          column: parseInt(rawdata[2])
        },
        bottom_right: {
          row: parseInt(rawdata[3]),
          column: parseInt(rawdata[4])
        }
      },
      on: parseInt(rawdata[5]+rawdata[6]+rawdata[7]+rawdata[8], 16),
      off: parseInt(rawdata[9]+rawdata[10]+rawdata[11]+rawdata[12], 16)
    };
  }
  return {};
};

const isZoneOffCommandComplete = function(rawdata, expectedNbLeds) {
  return rawdata.length >= 6 && rawdata[0] == 'o' && rawdata[5] == '\n';
};

const decodeZoneOffCommand = function(rawdata, expectedNbLeds) {
  console.log('Try to decode zone off command : ' + JSON.stringify(rawdata));
  if(isZoneOffCommandComplete(rawdata, expectedNbLeds)) {
    return {
      zone: {
        top_left: {
          row: parseInt(rawdata[1]),
          column: parseInt(rawdata[2])
        },
        bottom_right: {
          row: parseInt(rawdata[3]),
          column: parseInt(rawdata[4])
        }
      }
    };
  }
  return {};
};

const decodeIhmCommand = function(rawdata, expectedNbLeds) {
  if (!isIhmCommand(rawdata[0]))
    return undefined;
  return {
    name: ihmCommands[rawdata[0]].name,
    decoded: ihmCommands[rawdata[0]].decode(rawdata, expectedNbLeds),
    raw: ihmCommands[rawdata[0]].raw(rawdata, expectedNbLeds),
    timestamp: new Date().getTime()
  };
}

const isIhmCommand = function(command) {
  for(let key in ihmCommands) {
    if (key == command) {
      return true;
    }
  }
  return false;
}

const accumulateIhmCommand = function(received, rawdata) {
  rawdata = rawdata.toString();
  for (let i = 0; i < rawdata.length; i++) {
    if (!isIhmCommand(received[0])) {
      received = rawdata[i];
    } else {
      received += rawdata[i];
    }
  }
  return received;
};

const isRingCommandComplete = function(rawdata, expectedNbLeds) {
  return rawdata.length >= (4 + expectedNbLeds * 3 * 2) && rawdata[0] == 'r' && rawdata[3 + expectedNbLeds * 3 * 2] == '\n';
};

const isIhmCommandComplete = function(rawdata, expectedNbLeds) {
  return isIhmCommand(rawdata[0]) && ihmCommands[rawdata[0]].isComplete(rawdata, expectedNbLeds);
};

const clearStandardIhmCommand = function(received, expectedNbLeds) {
  do {
    received = received.substring(received.indexOf('\n')+1);
  } while(received.length > 0 && !isIhmCommand(received[0]));
  return received;
};

const clearRingCommand = function(received, expectedNbLeds) {
  return clearStandardIhmCommand(received, expectedNbLeds);
};

const rawStandardIhmCommand = function(received, expectedNbLeds) {
  return received.substring(0, received.indexOf('\n'));
};

const rawRingCommand = function(received, expectedNbLeds) {
  return rawStandardIhmCommand(received, expectedNbLeds);
};

const clearIhmCommand = function(received, expectedNbLeds) {
  return isIhmCommand(received[0]) && ihmCommands[received[0]].clear(received, expectedNbLeds);
};

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

    return { player: player, command: command, status: status };
  }

  return {};
};

const rawCoreCommand = function(received) {
  return received.substring(0, received.indexOf('\n'));
};

const isCoreCommand = function(command) {
  for(let key in coreCommands) {
    if (key == command) {
      return true;
    }
  }
  return false;
}

const isCoreCommandComplete = function(rawdata) {
  return isCoreCommand(rawdata[0]) && coreCommands[rawdata[0]].isComplete(rawdata);
};

const accumulateCoreCommand = function(received, rawdata) {
  rawdata = rawdata.toString();
  for (let i = 0; i < rawdata.length; i++) {
    if (!isCoreCommand(received[0])) {
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

const clearCoreCommand = function(received) {
  do {
    received = received.substring(received.indexOf('\n')+1);
  } while(received.length > 0 && !isCoreCommand(received[0]));
  return received;
};

const decodeCoreCommand = function(rawdata) {
  if (!isCoreCommand(rawdata[0]))
    return undefined;
  return {
    name: coreCommands[rawdata[0]].name,
    decoded: coreCommands[rawdata[0]].decode(rawdata),
    raw: coreCommands[rawdata[0]].raw(rawdata),
    timestamp: new Date().getTime()
  };
}

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

const encodeLightSensorCommand = function(value) {
  let cmd = 'l';

  cmd += encodeByteToHex(value);
  cmd += '\n';

  return cmd;
}; 

const isLightSensorCommandComplete = function(rawdata) {
  return rawdata.length >= 4 && rawdata[0] == 'l' && rawdata[3] == '\n';
};

const decodeLightSensorCommand = function(rawdata) {
  console.log('Try to decode light sensor value on command : ' + JSON.stringify(rawdata));
  if(isLightSensorCommandComplete(rawdata)) {
    return {
      light_sensor: parseInt(rawdata[1] + rawdata[2], 16)
    };
  }
  return {};
};

const encodeDebugCommand = function(msg) {
  let cmd = 'd';

  cmd += msg;
  cmd += '\n';

  return cmd;
};

const isDebugCommandComplete = function(rawdata) {
  return rawdata.length >= 2 && rawdata[0] == 'd' && rawdata.indexOf('\n') != -1;
};

const decodeDebugCommand = function(received) {
  console.log('Try to decode debug on command : ' + JSON.stringify(received));
  if(isDebugCommandComplete(received)) {
    return  {
      msg : received.substring(1, received.indexOf('\n'))
    };
  }
  return {};
};

const rawDebugCommand = function(rawdata) {
  return "";
};

const coreCommands = {
  p : {
    name: 'player_event',
    decode: decodePlayerCommand,
    isComplete: isPlayerCommandComplete,
    clear: clearCoreCommand,
    raw: rawCoreCommand
  },
  l : {
    name: 'light_sensor',
    decode: decodeLightSensorCommand,
    isComplete: isLightSensorCommandComplete,
    clear: clearCoreCommand,
    raw: rawCoreCommand
  }
};

const ihmCommands = {
  c : {
    name: 'change_zone_color',
    decode: decodeZoneColorCommand,
    isComplete: isZoneColorCommandComplete,
    clear: clearStandardIhmCommand,
    raw: rawStandardIhmCommand
  },
  O : {
    name: 'turn_zone_on',
    decode: decodeZoneOnCommand,
    isComplete: isZoneOnCommandComplete,
    clear: clearStandardIhmCommand,
    raw: rawStandardIhmCommand
  },
  o : {
    name: 'turn_zone_off',
    decode: decodeZoneOffCommand,
    isComplete: isZoneOffCommandComplete,
    clear: clearStandardIhmCommand,
    raw: rawStandardIhmCommand
  },
  i : {
    name: 'change_zone_intensity',
    decode: decodeZoneIntensityCommand,
    isComplete: isZoneIntensityCommandComplete,
    clear: clearStandardIhmCommand,
    raw: rawStandardIhmCommand
  },
  b : {
    name: 'change_zone_blink',
    decode: decodeZoneBlinkCommand,
    isComplete: isZoneBlinkCommandComplete,
    clear: clearStandardIhmCommand,
    raw: rawStandardIhmCommand
  },
  r : {
    name: 'update_ring_status',
    decode: decodeRingCommand,
    isComplete: isRingCommandComplete,
    clear: clearRingCommand,
    raw: rawRingCommand
  },
  R : {
    name: 'update_short_ring_status',
    decode: decodeShortRingCommand,
    isComplete: isShortRingCommandComplete,
    clear: clearStandardIhmCommand,
    raw: rawStandardIhmCommand
  },
  d : {
    name: 'debug',
    decode: decodeDebugCommand,
    isComplete: isDebugCommandComplete,
    clear: clearCoreCommand,
    raw: rawDebugCommand
  }
};


module.exports = {
  'encodePlayerCommand': encodePlayerCommand,
  'encodeLightSensorCommand': encodeLightSensorCommand,

  'decodeCoreCommand': decodeCoreCommand,
  'isCoreCommandComplete': isCoreCommandComplete,
  'accumulateCoreCommand': accumulateCoreCommand,
  'clearCoreCommand': clearCoreCommand,
  
  'encodeDebugCommand': encodeDebugCommand,
  'encodeRingCommand': encodeRingCommand,
  'encodeShortRingCommand': encodeShortRingCommand,
  'encodeZoneColorCommand': encodeZoneColorCommand,
  'encodeZoneOnCommand': encodeZoneOnCommand,
  'encodeZoneOffCommand': encodeZoneOffCommand,
  'encodeZoneIntensityCommand': encodeZoneIntensityCommand,
  'encodeZoneBlinkCommand': encodeZoneBlinkCommand,

  'accumulateIhmCommand': accumulateIhmCommand,
  'isIhmCommandComplete': isIhmCommandComplete,
  'decodeIhmCommand': decodeIhmCommand,
  'clearIhmCommand': clearIhmCommand,
};
