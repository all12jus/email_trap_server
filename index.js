const net = require('net');
const server = net.createServer();
const port = process.env.PORT || 9000;

let username = "test1";
let password = "password1";

// When a client requests a connection with the server, the server creates a new
// socket dedicated to that client.
server.on('connection', function(socket) {
    console.log('A new connection has been established.');
    socket.setEncoding("utf8");
    socket.setNoDelay(true);

    // Now that a TCP connection has been established, the server can send data to
    // the client by writing to its socket.
    let res = socket.write(`220 localhost ESMTP\r\n`);
    console.log(res);
    let dataReceive = false;
    // The server can also receive data from the client by reading from its socket.
    socket.on('data', function(chunk) {
        let data_string = chunk.toString().split("=\r\n").join('');
        console.log(`Data received from client: ${data_string}\n${data_string.length}`);
        if (dataReceive) {
            if (data_string.substring(0, 1) === '.') {
                socket.write('250 message queued\r\n');
                socket.write('354 Terminate with line containing only \'.\'\r\n');
                dataReceive = false;
            }
        }
        else {
            if (data_string.substring(0, 4) === 'EHLO') {
                socket.write('250-hello ' + data_string.substring(5, data_string.length - 1) + '\r\n');
                socket.write("250 AUTH LOGIN\r\n");
            } else if (data_string.substring(0, 4) === 'HELO') {
                socket.write('250 ok\r\n');
                // socket.write('hello ' + data_string.substring(5, data_string.length - 1) + '\r\n');
            } else if (data_string.substring(0, 10) === 'AUTH PLAIN') {
                const b = Buffer.from(data_string.substring(10, data_string.length - 1), 'base64')
                const s = b.toString();
                console.log(s);
                socket.write('250 ok\r\n');
            } else if (data_string.substring(0, 10) === 'AUTH LOGIN') {
                // socket.write('250 ok\r\n');
                socket.write('334 VXNlcm5hbWU6\r\n'); // comes back with username.. base64
                socket.write('334 UGFzc3dvcmQ6\r\n'); // comes back with password...
                socket.write('235 2.7.0 Authentication successful\r\n'); // then sends a message.
            } else if (data_string.substring(0, 10) === 'MAIL FROM:') {
                socket.write('250 ok\r\n');
            } else if (data_string.substring(0, 8) === 'RCPT TO:') {
                var to = data_string.substring(8, data_string.length - 1);
                socket.write('250 ok its for ' + to + '\r\n');
            } else if (data_string.substring(0, 4) === 'NOOP') {
                socket.write('250 ok\r\n');
                // mode = 'data';
                // dataReceive = true;
            } else if (data_string.substring(0, 4) === 'DATA') {
                socket.write('354 ok send it\r\n');
                // mode = 'data';
                dataReceive = true;
            } else if (data_string.substring(0, 4) === 'QUIT') {
                socket.write('221 Goodbye\r\n');
                socket.end();
                return;
            }
        }

    });

    // When the client requests to end the TCP connection with the server, the server
    // ends the connection.
    socket.on('end', function() {
        console.log('Closing connection with the client');
    });

    // Don't forget to catch error, for your own sake.
    socket.on('error', function(err) {
        console.log(`Error: ${err}`);
    });
});

// The server listens to a socket for a client to make a connection request.
// Think of a socket as an end point.
server.listen(port, function() {
    console.log(`Server listening for connection requests on socket localhost:${port}.`);
});
