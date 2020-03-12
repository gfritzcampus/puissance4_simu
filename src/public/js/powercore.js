const appSocketNamespace = '/core';
var term = null;
const radius = 75;

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
  ctx.arc(center.x, center.y, radius, start_angle , end_angle, false);
  ctx.lineTo(center.x, center.y);
  ctx.lineTo(center.x + Math.cos(start_angle), center.y + Math.sin(start_angle));
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.fillStyle = "#282828";// $('#board').css("background-color");
  ctx.arc(center.x, center.y, radius/Math.sqrt(2), Math.PI*2, false);
  ctx.fill();
}

const displayRing = function(ctx, config, status) {
  let center ={
    x: 75,
    y: 75
  };

  for(let led = 0; led < config.leds_per_ring; led++) {
    displayLed(ctx, led, center, config, status && status[led] ? status[led] : null);
  }
}

const appInitSocket = function(socket) {
  socket.on('player_event', (timestamp, raw, decoded) => {
    console.log(raw);
    if (term) {
      term.echo(JSON.stringify({'timestamp': timestamp, 'raw':raw, 'decoded': decoded}));
    }
    try {
      let elem = $('#controls_player'+decoded.player+'_'+decoded.command);
      if (decoded.status == 'down') {
        elem.css('filter', 'invert(1)');
      } else {
        elem.css('filter', 'invert(0)');
      }
    }catch(error) {
      console.error(error);
    }
  });
}

const appManageConnectedSocket = function(socket, config) {
  ctx = $('#ring')[0].getContext('2d');
  displayRing(ctx, config, null);
  let status = [];

  if (config.leds_per_ring > 1) {
    $('.many-leds').show();
  }
  else {
    $('.many-leds').hide();
    $(document).on('select-color', (event, color) => {
      status[0] = color;
    });
  }

  {
    let color = [ 
      parseInt($('#color-input-red').val()),
      parseInt($('#color-input-green').val()),
      parseInt($('#color-input-blue').val())
    ];
    for(let i = 0; i < config.leds_per_ring; i++) {
      status.push(color);
    }
  }

  $('.coordonate-col').attr("max", config.columns - 1);
  $('.coordonate-row').attr("max", config.rows - 1);

  $('#ring').off();
  $('#ring').on('click', (e) => {
    let x = e.offsetX - 75;
    let y = -(e.offsetY - 75);
    
    let r = Math.sqrt(x*x + y*y);
    let theta = Math.atan2(y, x);
    if (theta < 0) {
      theta = 2*Math.PI + theta;
    }

    theta = (2*Math.PI - theta + Math.PI/2) % (2*Math.PI);

    if (radius/Math.sqrt(2) <= r && r <= radius) {
      let led = Math.floor(theta / (2*Math.PI / config.leds_per_ring));
      let color = [ 
        parseInt($('#color-input-red').val()),
        parseInt($('#color-input-green').val()),
        parseInt($('#color-input-blue').val())
      ];
      displayLed(ctx, led, {x:75,y:75}, config, color);
      status[led] = color;
    }
  });

  $('#all_leds').off();
  $('#all_leds').on('click', () => {
    let color = [ 
      parseInt($('#color-input-red').val()),
      parseInt($('#color-input-green').val()),
      parseInt($('#color-input-blue').val())
    ];
    for(let led = 0; led < config.leds_per_ring; led++) {
      displayLed(ctx, led, {x:75, y:75}, config, color);
      status[led]=color;
    }
  });

  $('#send_ring').off();
  $('#send_ring').on('click', () => {
    socket.emit('ring_update', { 
      'row': parseInt($('#ring_row').val()), 
      'column': parseInt($('#ring_col').val()),
      'leds': status
    });
  });

  $('#send_zone_color').off();
  $('#send_zone_color').on('click', () => {
    let color = [ 
      parseInt($('#color-input-red').val()),
      parseInt($('#color-input-green').val()),
      parseInt($('#color-input-blue').val())
    ];
    socket.emit('zone_color', {
      'zone':{
        'top_left':{
          'row': parseInt($("#zone-top-left-row").val()),
          'column': parseInt($("#zone-top-left-col").val())
        },
        'bottom_right':{
          'row': parseInt($("#zone-bottom-right-row").val()),
          'column': parseInt($("#zone-bottom-right-col").val())
        }
      },
      'color': color
    });
  });

  $('#send_zone_on').off();
  $('#send_zone_on').on('click', () => {
    socket.emit('zone_on', {
      'zone':{
        'top_left':{
          'row': parseInt($("#zone-top-left-row").val()),
          'column': parseInt($("#zone-top-left-col").val())
        },
        'bottom_right':{
          'row': parseInt($("#zone-bottom-right-row").val()),
          'column': parseInt($("#zone-bottom-right-col").val())
        },
      }
    });
  });

  $('#send_zone_off').off();
  $('#send_zone_off').on('click', () => {
    socket.emit('zone_off', {
      'zone':{
        'top_left':{
          'row': parseInt($("#zone-top-left-row").val()),
          'column': parseInt($("#zone-top-left-col").val())
        },
        'bottom_right':{
          'row': parseInt($("#zone-bottom-right-row").val()),
          'column': parseInt($("#zone-bottom-right-col").val())
        },
      }
    });
  });

  $('#send_zone_intensity').off();
  $('#send_zone_intensity').on('click', () => {
    socket.emit('zone_intensity', {
      'zone':{
        'top_left':{
          'row': parseInt($("#zone-top-left-row").val()),
          'column': parseInt($("#zone-top-left-col").val())
        },
        'bottom_right':{
          'row': parseInt($("#zone-bottom-right-row").val()),
          'column': parseInt($("#zone-bottom-right-col").val())
        },
      },
      'intensity': parseInt($('#zone-intensity').val())
    });
  });

  $('#send_zone_blink').off();
  $('#send_zone_blink').on('click', () => {
    socket.emit('zone_blink', {
      'zone':{
        'top_left':{
          'row': parseInt($("#zone-top-left-row").val()),
          'column': parseInt($("#zone-top-left-col").val())
        },
        'bottom_right':{
          'row': parseInt($("#zone-bottom-right-row").val()),
          'column': parseInt($("#zone-bottom-right-col").val())
        },
      },
      'blink': {
        'on': parseInt($('#zone-blink-on').val()),
        'off': parseInt($('#zone-blink-off').val())
      }
    });
  });

};

const fillGradient = function(ctxBlock, ctxStrip, widthBlock, heightBlock, colorBase) {
  ctxBlock.fillStyle = colorBase;
  ctxBlock.fillRect(0, 0, widthBlock, heightBlock);

  var grdWhite = ctxStrip.createLinearGradient(0, 0, widthBlock, 0);
  grdWhite.addColorStop(0, 'rgba(255,255,255,1)');
  grdWhite.addColorStop(1, 'rgba(255,255,255,0)');
  ctxBlock.fillStyle = grdWhite;
  ctxBlock.fillRect(0, 0, widthBlock, heightBlock);

  var grdBlack = ctxStrip.createLinearGradient(0, 0, 0, heightBlock);
  grdBlack.addColorStop(0, 'rgba(0,0,0,0)');
  grdBlack.addColorStop(1, 'rgba(0,0,0,1)');
  ctxBlock.fillStyle = grdBlack;
  ctxBlock.fillRect(0, 0, widthBlock, heightBlock);
};

const setSelectedColor = function(color) {
  rgbaColor = 'rgba(' + color[0] + ',' + color[1] + ',' + color[2] + ',1)';
  $('#color-label').css('background-color', rgbaColor);
  $('#color-input-red').val(color[0]);
  $('#color-input-green').val(color[1]);
  $('#color-input-blue').val(color[2]);
  $(document).trigger('select-color', [color]);
}

const changeSelectedColor = function(e, ctxBlock) {
  if ($('#led_status')[0].checked) {
    let x = e.offsetX;
    let y = e.offsetY;
    let imageData = ctxBlock.getImageData(x, y, 1, 1).data;
    setSelectedColor(imageData);
  }
}

const changeColorBase = function(e, ctxBlock, ctxStrip, widthBlock, heightBlock) {
  let x = e.offsetX;
  let y = e.offsetY;
  let imageData = ctxStrip.getImageData(x, y, 1, 1).data;
  let rgbaColor = 'rgba(' + imageData[0] + ',' + imageData[1] + ',' + imageData[2] + ',1)';
  fillGradient(ctxBlock, ctxStrip, widthBlock, heightBlock, rgbaColor);
};

const displayColorPicker = function() {
  let colorBlock = $('#color-block')[0];
  let ctxBlock = colorBlock.getContext('2d');
  let widthBlock = colorBlock.width; 
  let heightBlock = colorBlock.height;
  
  let colorStrip = $('#color-strip')[0];
  let ctxStrip = colorStrip.getContext('2d');
  let widthStrip = colorStrip.width;
  let heightStrip = colorStrip.height;

  let dragStrip=false;  
  let dragBlock=false;
  
  ctxBlock.rect(0, 0, widthBlock, heightBlock);
  fillGradient(ctxBlock, ctxStrip, widthBlock, heightBlock, 'rgba(255,0,0,1)');
  
  ctxStrip.rect(0, 0, widthStrip, heightStrip);
  var gradientStrip = ctxStrip.createLinearGradient(0, 0, 0, heightStrip);
  gradientStrip.addColorStop(0, 'rgba(255, 0, 0, 1)');
  gradientStrip.addColorStop(0.17, 'rgba(255, 255, 0, 1)');
  gradientStrip.addColorStop(0.34, 'rgba(0, 255, 0, 1)');
  gradientStrip.addColorStop(0.51, 'rgba(0, 255, 255, 1)');
  gradientStrip.addColorStop(0.68, 'rgba(0, 0, 255, 1)');
  gradientStrip.addColorStop(0.85, 'rgba(255, 0, 255, 1)');
  gradientStrip.addColorStop(1, 'rgba(255, 0, 0, 1)');
  ctxStrip.fillStyle = gradientStrip;
  ctxStrip.fill();
  
  $('#color-strip').on('mousedown', (e) => {
    dragStrip = true;
    changeColorBase(e, ctxBlock, ctxStrip, widthBlock, heightBlock);
  });
  $('#color-strip').on('mouseup', (e) => {
    dragStrip = false;
  });
  $('#color-strip').on('mousemove', (e) => {
    if (dragStrip) {
      changeColorBase(e, ctxBlock, ctxStrip, widthBlock, heightBlock);
    }
  });
 
  $('#color-block').on('mousedown', (e) => {
    dragBlock = true;
    changeSelectedColor(e, ctxBlock);
  });
  $('#color-block').on('mouseup', (e) => {
    dragBlock = false;
  });
  $('#color-block').on('mousemove', (e) => {
    if (dragBlock) {
      changeSelectedColor(e, ctxBlock);
    }
  });

  changeSelectedColor({offsetX: 0, offsetY: 0}, ctxBlock);
};

const initOnOffButton = function() {
  let lastColor = null;
  $('#led_status').change(() => {
    if ($('#led_status')[0].checked) {
      setSelectedColor(lastColor);
    } else {
      lastColor = [ 
        $('#color-input-red').val(),
        $('#color-input-green').val(),
        $('#color-input-blue').val()
      ];
      setSelectedColor([0,0,0]);
    }
  });
}

const changeColorFromInput = function() {
  let color = [ 
    $('#color-input-red').val(),
    $('#color-input-green').val(),
    $('#color-input-blue').val()
  ];
  setSelectedColor(color);
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
  
  displayColorPicker();
  initOnOffButton();
  $('#color-input-red').on('change', changeColorFromInput);
  $('#color-input-green').on('change', changeColorFromInput);
  $('#color-input-blue').on('change', changeColorFromInput);
});
