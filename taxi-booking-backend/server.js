// taxi-booking-backend/server.js

require('dotenv').config(); // Load environment variables
const express = require('express');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const path = require('path');
const axios = require('axios');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Rate Limiting
// const limiter = rateLimit({
//     windowMs: 15 * 60 * 1000, // 15 minutes
//     max: 5, // Limit each IP to 5 requests per windowMs
//     message: 'Too many submissions from this IP. Please try again later.'
// });

// app.use('/send-email', limiter);

// Serve static files (optional, if you want to serve the frontend from the same server)
app.use(express.static(path.join(__dirname, '../')));

// POST route to handle form submissions
app.post('/send-email', async (req, res) => {
    const { name, email, subject, message, 'g-recaptcha-response': recaptchaResponse } = req.body;

    // Verify reCAPTCHA response
    try {
        const googleResponse = await axios.post(
            `https://www.google.com/recaptcha/api/siteverify?secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${recaptchaResponse}`
        );

        const { success } = googleResponse.data;

        if (!success) {
            return res.status(400).json({ success: false, message: 'reCAPTCHA verification failed' });
        }

        // Proceed with sending the email
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: 'coedd22@gmail.com',
            cc: 'coeddcompany@gmail.com',
            subject: subject,
            text: `Name: ${name}\nEmail: ${email}\nMessage: ${message}`
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.log(error);
                return res.status(500).json({ success: false, message: 'Error sending email' });
            } else {
                console.log('Email sent: ' + info.response);
                return res.status(200).json({ success: true, message: 'Email sent successfully' });
            }
        });
    } catch (error) {
        console.error('Error verifying reCAPTCHA:', error);
        return res.status(500).json({ success: false, message: 'Error verifying reCAPTCHA' });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});