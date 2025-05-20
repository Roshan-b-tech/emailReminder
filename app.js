require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');

const path = require('path');

const cron = require('node-cron');

const nodemailer = require('nodemailer');

const expressLayouts = require('express-ejs-layouts');

const Reminder = require('./models/reminder');
const { title } = require('process');

const app = express();

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
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Verify transporter configuration
transport.verify(function (error, success) {
    if (error) {
        console.error('Email transporter configuration error:', error);
    } else {
        console.log('Email transporter is ready to send messages');
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
        console.log('Received schedule request:', { email, message, datetime });

        // Convert local datetime to UTC
        const localDate = new Date(datetime);
        const utcDate = new Date(localDate.getTime() - localDate.getTimezoneOffset() * 60000);
        console.log('Local time:', localDate.toISOString());
        console.log('UTC time:', utcDate.toISOString());

        const newReminder = new Reminder({
            email,
            message,
            scheduledTime: utcDate
        });

        await newReminder.save();
        console.log('Saved reminder:', newReminder);
        res.redirect('/schedule?success=true');
    } catch (error) {
        console.error('Error saving reminder:', error);
        res.redirect('/schedule?error=true');
    }
});

//getting all reminders

app.get('/reminders', async (req, res) => {
    try {
        const reminders = await Reminder.find().sort({ scheduledTime: 1 });
        // Convert UTC times to local time for display
        const localReminders = reminders.map(reminder => ({
            ...reminder.toObject(),
            scheduledTime: new Date(reminder.scheduledTime).toLocaleString()
        }));

        res.render('reminders', {
            reminders: localReminders,
            title: "Reminders - Email Reminder",
            currentPage: "reminders"
        });
    } catch (error) {
        console.error('Error fetching reminders:', error);
        res.status(500).send('Error fetching reminders');
    }
})

//cron job to send emails

cron.schedule('*/5 * * * *', async () => {
    try {
        console.log('Checking for reminders to send...');
        const now = new Date();
        console.log('Current UTC time:', now.toISOString());

        // Find reminders that are due in the last 5 minutes
        const fiveMinutesAgo = new Date(now.getTime() - 5 * 60000);
        const reminders = await Reminder.find({
            scheduledTime: {
                $gte: fiveMinutesAgo,
                $lte: now
            },
            sent: false
        }).limit(5); // Process only 5 reminders at a time

        console.log(`Found ${reminders.length} reminders to send`);
        if (reminders.length > 0) {
            reminders.forEach(reminder => {
                console.log(`Reminder scheduled for: ${reminder.scheduledTime.toISOString()}`);
            });
        }

        for (const reminder of reminders) {
            try {
                console.log(`Sending email to ${reminder.email}...`);
                await transport.sendMail({
                    from: process.env.EMAIL_USER,
                    to: reminder.email,
                    subject: 'Reminder',
                    text: reminder.message,
                });
                console.log(`Email sent successfully to ${reminder.email}`);

                reminder.sent = true;
                await reminder.save();
                console.log(`Updated reminder status for ${reminder.email}`);
            } catch (emailError) {
                console.error(`Error sending email to ${reminder.email}:`, emailError);
                // Don't throw error, continue with next reminder
            }
        }
    } catch (error) {
        console.error('Error in email cron job:', error);
        // Don't throw error, let the cron job continue running
    }
});

// start the server
const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
    console.log(`server is running in port ${PORT}`);
});

// Handle server errors
server.on('error', (error) => {
    console.error('Server error:', error);
});

// Handle process termination
process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');
    server.close(() => {
        console.log('HTTP server closed');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('SIGINT signal received: closing HTTP server');
    server.close(() => {
        console.log('HTTP server closed');
        process.exit(0);
    });
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    // Don't exit the process, let it continue running
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    // Don't exit the process, let it continue running
});


