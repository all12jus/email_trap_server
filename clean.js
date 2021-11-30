(async () => {
    const net = require('net');
    const server = net.createServer();
    const port = process.env.PORT || 9000;

    /*
    let a = Buffer.from('JavaScript').toString('base64');
let b = Buffer.from(a, 'base64').toString();
     */

    server.on('connection', function (socket) {
        function sendResponse(resp) {
            console.log(`--> ${resp}`);
            socket.write(`${resp}\r\n`);
        }

        console.log('A new connection has been established.');
        socket.setEncoding("utf8");
        socket.setNoDelay(true);

        let messageStatus = 'none'; // ['none', 'auth', 'auth-username', 'auth-password', 'header', 'data']
        let messageContent = '';
        let authUsername = undefined;
        let authPassword = undefined;
        let sender = undefined;
        let recipients = [];
        sendResponse('220 localhost ESMTP');

        socket.on('data', function (chunk) {
            let data_string = chunk.toString().split("=\r\n").join('');
            console.log(data_string);

            if (data_string.substring(0, 4) === 'NOOP'){
                sendResponse('250 ok');
                return;
            }

            if (data_string.substring(0, 4) === 'QUIT'){
                sendResponse('250 ok');
                socket.end();
                return;
            }

            switch (messageStatus) {
                case "none":
                    // EHLO
                    if (data_string.substring(0, 4) === 'EHLO'){
                        sendResponse('250-hello ' + data_string.substring(5, data_string.length - 1));
                        sendResponse("250 AUTH LOGIN");
                        messageStatus = 'auth';
                    }
                    // HELO
                    if (data_string.substring(0, 4) === 'HELO') {
                        sendResponse('250 ok');
                    }
                    break;
                case "auth":
                    if (data_string.substring(0, 10) === 'AUTH LOGIN') {
                        sendResponse('334 VXNlcm5hbWU6'); // comes back with username.. base64
                        messageStatus = 'auth-username';
                    }
                    break;
                case "auth-username":
                    authUsername = Buffer.from(data_string, 'base64').toString();
                    sendResponse('334 UGFzc3dvcmQ6'); // comes back with password.. base64
                    messageStatus = 'auth-password';
                    break;
                case "auth-password":
                    authPassword = Buffer.from(data_string, 'base64').toString();

                    // TODO: check something here for acctually valid user login
                    if (authUsername === "test1" && authPassword === "password1"){
                        sendResponse('235 2.7.0 Authentication successful'); // comes back with username.. base64
                        messageStatus = 'header';
                    }
                    else {
                        sendResponse('535 2.7.0 Authentication failed'); // comes back with username.. base64
                        messageStatus = 'none';
                    }
                    break;
                case "header":
                    // MAIL FROM:
                    if (data_string.substring(0, 10) === 'MAIL FROM:') {
                        sender = data_string.substring(10, data_string.length - 1);
                        sendResponse('250 ok');
                    }
                    // RCPT TO:
                    if (data_string.substring(0, 8) === 'RCPT TO:') {
                        let to = data_string.substring(8, data_string.length - 2);
                        sendResponse(`250 ok its for ${to}`);
                        recipients.push(to);
                    }
                    // DATA
                    if (data_string.substring(0, 4) === 'DATA') {
                        sendResponse('354 ok send it');
                        messageStatus = 'data';
                    }
                    break;
                case "data":
                    messageContent += data_string;
                    if (data_string.substring(0, 1) === '.') {
                        sendResponse('250 message queued');
                        sendResponse(`354 Terminate with line containing only '.'`);
                        console.log(recipients);
                        console.log(sender)
                        console.log(`${authUsername}:${authPassword}`);
                        console.log(messageContent);
                        // TODO: store this in the database here.
                        messageStatus = 'none';
                    }
                    break;
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

    server.listen(port, function() {
        console.log(`Server listening for connection requests on socket localhost:${port}.`);
    });
})()