const serialPort = require('serialport');
const board = require('./board_config');

const powerSerialPort = function(socket, data_decoder) {
  this.serial = null;

  socket.on('disconnect', () => { 
    console.log('disconnected'); 
    if (this.serial && this.serial.isOpen) {
      this.serial.close();
    }
  });

  socket.on('get_config', (fn) => {
    fn(board);
  });

  socket.on('get_serial_port', (fn) => {
    serialPort.list().then((ports) => {
      let fs = require('fs');
      fs.readdir('/tmp/puissance4/serial', function(err, items) {
        if (!err) {
          items.forEach((e) => {
            ports.push({path:'/tmp/puissance4/serial/'+e});
          });
        }
        fn(null, ports);
      });
    })
    .catch((error) => {
      fn(error, null);
    });
  });

  socket.on('is_connected_to_board', (fn) => {
    console.log('Ask for status of connection on board');
    fn(this.serial ? this.serial.isOpen : false);
  });

  socket.on('connect_to_board', (path, baudrate) => {
    console.log('Ask to connect to "' + path + '" at ' + baudrate);
    if (this.serial && this.serial.isOpen) {
      this.serial.close();
    }

    try {
      this.serial = new serialPort(path, { baudRate: baudrate}, (err) => {
        if (err) {
          console.log('Error trying to connect: ' + err);
          socket.emit('serial_error_connection', err);
        } else {
          console.log('Connected to: ' + path);
          this.serial.on('close', (err) => {
            console.log('Disconnected from: ' + path);
            socket.emit('serial_disconnect', err);
          });
          this.serial.on('data', (data) => {
            console.log('Received raw data: ' + JSON.stringify(data));
            data_decoder(data);
          });
          socket.emit('serial_connect', path);
        }
      });
    } catch(err) {
      console.log('Error trying to connect: ' + err);
      socket.emit('serial_error_connection', err);
    }
  });

  socket.on('disconnect_from_board', () => {
    if (this.serial && this.serial.isOpen) {
      this.serial.close();
    }
  });
};

powerSerialPort.prototype.write = function(msg) {
  if (this.serial && this.serial.isOpen) {
    this.serial.write(msg);
  }
};


module.exports = powerSerialPort
