require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const cron = require('node-cron');
const nodemailer = require('nodemailer');
const expressLayouts = require('express-ejs-layouts');
const cors = require('cors');

const Reminder = require('./models/reminder');
const { title } = require('process');

const app = express();

// Enable CORS
app.use(cors());

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(expressLayouts);

app.set("layout", "layout");


// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        console.log("Connected to MongoDB...");
    })
    .catch((error) => {
        console.error("Error connecting to MongoDB:", error);
        process.exit(1); // Exit if cannot connect to database
    });

//email transporter setup 
const transport = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    },
    tls: {
        rejectUnauthorized: false
    }
});

// Verify transporter configuration
transport.verify(function (error, success) {
    if (error) {
        console.error('Email transporter configuration error:', error);
        console.error('Email config:', {
            user: process.env.EMAIL_USER,
            hasPassword: !!process.env.EMAIL_PASS,
            host: 'smtp.gmail.com',
            port: 587
        });
    } else {
        console.log('Email transporter is ready to send messages');
        console.log('Using email:', process.env.EMAIL_USER);
    }
});

//routes

//! Home page
app.get('/', (req, res) => {
    res.render('index', {
        title: 'Email Reminder',
        currentPage: 'home',
    });
})

//About page

app.get('/about', (req, res) => {
    res.render('about', {
        title: 'About - Email Reminder ',
        currentPage: 'about',
    })
})

app.get('/schedule', (req, res) => {
    res.render('schedule', {
        title: 'Schedule - Email Reminder',
        currentPage: 'schedule',
    })
})


//Actual logic for scheduling email

app.post('/schedule', async (req, res) => {
    try {
        const { email, message, datetime } = req.body;
        const newReminder = new Reminder({
            email,
            message,
            scheduledTime: new Date(datetime)
        });

        await newReminder.save();
        console.log(newReminder);
        res.redirect('/schedule?success=true');
    } catch (error) {
        console.error('Error saving reminder:', error);
        res.redirect('/schedule?error=true');
    }
})

//getting all reminders

app.get('/reminders', async (req, res) => {
    try {
        const reminders = await Reminder.find().sort({ scheduledTime: 1 });
        res.render('reminders', {
            reminders,
            title: "Reminders - Email Reminder",
            currentPage: "reminders"
        });
    } catch (error) {
        console.error('Error fetching reminders:', error);
        res.status(500).send('Error fetching reminders');
    }
})

//cron job to send emails

cron.schedule('* * * * *', async () => {
    try {
        console.log('Checking for reminders to send...');
        const now = new Date();
        const reminders = await Reminder.find({
            scheduledTime: { $lte: now },
            sent: false
        });

        console.log(`Found ${reminders.length} reminders to send`);

        for (const reminder of reminders) {
            console.log(`Attempting to send email to ${reminder.email}...`);
            try {
                const mailOptions = {
                    from: `"Email Reminder" <${process.env.EMAIL_USER}>`,
                    to: reminder.email,
                    subject: 'Reminder',
                    text: reminder.message,
                    html: `<p>${reminder.message}</p>`
                };

                const info = await transport.sendMail(mailOptions);
                console.log('Message sent:', info.messageId);
                console.log('Preview URL:', nodemailer.getTestMessageUrl(info));

                reminder.sent = true;
                await reminder.save();
                console.log(`Updated reminder status for ${reminder.email}`);
            } catch (emailError) {
                console.error('Email sending failed:', {
                    error: emailError.message,
                    code: emailError.code,
                    command: emailError.command,
                    responseCode: emailError.responseCode,
                    response: emailError.response
                });
            }
        }
    } catch (error) {
        console.error('Error in email cron job:', error);
    }
});

// start th server

const PORT = process.env.PORT || 5000;

app.listen(PORT, console.log(`server is running in port ${PORT}`));


