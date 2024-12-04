const nodemailer = require('nodemailer');
const cron = require('node-cron');
const { Pool } = require('pg');


const pool = new Pool({
  host: 'db', // the database server
  port: 5432, // the database port
  database: process.env.POSTGRES_DB, // the database name
  user: process.env.POSTGRES_USER, // the user account to connect with
  password: process.env.POSTGRES_PASSWORD, // the password of the user account
});



// *****************************************************
// <!-- Email Routes -->
// *****************************************************

// Set up the email transporter (
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'lock.in.learn.mail@gmail.com',
    pass: 'lockinlearn@11'
  }
});

function sendEmail(to, subject, body) {
  const mailOptions = {
    from: 'lock.in.learn.mail@gmail.com',
    to,
    subject,
    text: body,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log('Error sending email:', error);
    } else {
      console.log('Email sent:', info.response);
    }
  });
}


// Function to fetch users with upcoming reminders
async function fetchUsersWithReminders() {
  try {
    const result = await pool.query(`
      SELECT * FROM notification_preferences
      WHERE time = CURRENT_TIME -- or use a comparison for weekly reminders
    `);
    return result.rows;
  } catch (err) {
    console.error('Error fetching users with reminders:', err);
    return [];
  }
}

// Function to send reminders to users
async function sendReminders() {
  const users = await fetchUsersWithReminders();
  
  users.forEach(user => {
    const { user_id, time, assignment_reminder, email } = user;

    // Send email about the assignment/event reminder
    const subject = 'Assignment/Event Reminder';
    const body = `
      Hi ${user_id},\n\n
      This is your reminder for assignments/events:\n
      Reminder: ${assignment_reminder}\n
      Time: ${time}\n\n
      Thanks,
      Your Notification System
    `;

    sendEmail(email, subject, body);
  });
}

async function sendWeeklyReminder() {
  const users = await fetchUsersWithReminders();

  users.forEach(user => {
    const { email, time, assignment_reminder } = user;

    // Send weekly reminder email
    const subject = 'Weekly Reminder';
    const body = `
      Hi ${user.user_id},\n\n
      This is your weekly reminder for assignments/events:\n
      Reminder: ${assignment_reminder}\n
      Time: ${time}\n\n
      Thanks,
      Your Notification System
    `;

    sendEmail(email, subject, body);
  });
}

// Schedule the task to run every hour (adjust as needed)
cron.schedule('0 * * * *', sendReminders); // Every hour

// Weekly cron job
cron.schedule('0 9 * * 1', sendWeeklyReminder); // Every Monday at 9 AM




