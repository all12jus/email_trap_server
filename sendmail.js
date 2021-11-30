// create transporter object with smtp server details
let nodemailer = require("nodemailer");
const transporter = nodemailer.createTransport({
    host: 'localhost',
    port: 9000,
    secure: false,
    auth: {
        user: 'test1',
        pass: 'password1'
    },
    tls: {
        rejectUnauthorized: false
    }
});

async function f() {
    const result = await transporter.sendMail({
        from: 'from_address@example.com',
        to: ['all12jus@gmail.com', 'to_address2@example.com'],
        // bcc: ['all12jus@gmail.com', 'to_address2@example.com'],
        subject: 'Test Email Subject',
        text: 'Example Plain Text Message Body. Example Plain Text Message Body. Example Plain Text Message Body. Example Plain Text Message Body. Example Plain Text Message Body.',
        html: '<p>Example Plain Text Message Body.</p>'
    }).catch((e) => {
        console.error(e);
        // transporter.close();
    });
    console.log(result);
    // transporter.close();
}

f().then();