const setStatus = function(elem, status) {
  let alt="";
  let src="";

  if (status == "connected") {
    alt = "connected";
    src = "green.png";
  } else if (status == "disconnected") {
    alt = "disconnected";
    src = "red.png";
  } else {
    alt = "inconnu";
    src = "orange.png";
  }

  $('#status_' + elem).attr({
    src: '/static/img/' + src,
    alt: alt
  });
};

const appendSerialOption = function(value, text) {
  $('#serial_available').append($('<option></option').attr('value', value).text(text));
};

const displaySerialPanel = function(socket, isConnected) {
  setStatus('serial', isConnected ? 'connected' : 'disconnected');
  if (isConnected) {
    $('#panel_serial_waiting').hide();
    $('#panel_serial_connect').hide();
    $('#panel_serial_disconnect').show();
  } else {
    $('#panel_serial_waiting').hide();
    $('#serial_available').empty();
    appendSerialOption('custom', 'Autre');
    $('#serial_custom').show();

    socket.emit('get_serial_port', (error, ports) => {
      if (error) {
        console.log(error);
      } else {
        ports.forEach((p) => {
          appendSerialOption(p.path, p.path);
        });
      }
    });

    $('#panel_serial_connect').show();
    $('#panel_serial_disconnect').hide();
  }
};

const waitingSerialPanel = function() {
  $('#panel_serial_connect').hide();
  $('#panel_serial_disconnect').hide();
  $('#panel_serial_waiting').show();
};

const hideSerialPanel = function() {
  $('#panel_serial_connect').hide();
  $('#panel_serial_disconnect').hide();
  $('#panel_serial_waiting').hide();
};

const askToConnect = function(socket) {
  waitingSerialPanel();
  let port = $('#serial_available option:selected').val();
  port = port == 'custom' ? $('#serial_custom').val() : port;
  baudrate = parseInt($('#serial_baudrate option:selected').val());
  socket.emit('connect_to_board', port, baudrate);
};

$(function() {
  console.log('Connect to simu');
  let socket = io(appSocketNamespace);

  console.log('Set events');
  
  $('#serial_available').change(() => {
    if ($('#serial_available option:selected').val() == 'custom') {
      $('#serial_custom').show();
    } else {
      $('#serial_custom').hide();
    }
  });

  $('#panel_serial_connect button').on('click', () => {
    askToConnect(socket);
  });
  $('#panel_serial_connect input').keypress((e) => {
    if (e.which == 13) {
      askToConnect(socket);
    }
  });

  $('#panel_serial_disconnect button').on('click', () => {
    waitingSerialPanel();
    socket.emit('disconnect_from_board');
  });

  socket.on('serial_connect', (path) => {
    displaySerialPanel(socket, true);
    $('#panel_serial_path').text(path);
  });

  socket.on('serial_disconnect', (err) => {
    if (err) {
      alert('Lien série déconnecté : ' + JSON.stringify(err));
    }
    displaySerialPanel(socket, false);
  });

  socket.on('serial_error_connection', (err) => {
    alert('Erreur lors de la connection : ' + JSON.stringify(err));
    console.log(err);
    displaySerialPanel(socket, false);
  });

  socket.on('disconnect', () => {
    console.log('Disconnected from simulator');
    setStatus('simu', 'disconnected');
    setStatus('serial', 'unkonwn');
  });

  appInitSocket(socket);

  socket.on('connect', () => {
    console.log('Connected to simulator');
    setStatus('simu', 'connected');

    console.log('Check serial connection');
    socket.emit('is_connected_to_board', (isConnected) => {
      setStatus('serial', isConnected ? 'connected' : 'disconnected');
      displaySerialPanel(socket, isConnected);

      console.log('Get simu config');
      socket.emit('get_config', (config) => {
        console.log(config);
        appManageConnectedSocket(socket, config);
      });
    });
  });
});


