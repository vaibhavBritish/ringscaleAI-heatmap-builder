const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: 'mediaringscale@gmail.com',
    pass: 'yvottvrkkkscuymx', // without spaces
  },
  tls: {
    rejectUnauthorized: false
  }
});

transporter.verify(function (error, success) {
  if (error) {
    console.log("Error without spaces:", error.message);
  } else {
    console.log("Server is ready to take our messages (without spaces)");
  }
});

const transporter2 = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: 'mediaringscale@gmail.com',
    pass: 'yvot tvrk kksc uymx', // with spaces
  },
  tls: {
    rejectUnauthorized: false
  }
});

transporter2.verify(function (error, success) {
  if (error) {
    console.log("Error with spaces:", error.message);
  } else {
    console.log("Server is ready to take our messages (with spaces)");
  }
});
