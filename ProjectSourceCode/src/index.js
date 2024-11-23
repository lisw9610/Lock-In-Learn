// *****************************************************
// <!-- Section 1 : Import Dependencies -->
// *****************************************************

const express = require('express'); // To build an application server or API
const app = express();
const handlebars = require('express-handlebars');
const Handlebars = require('handlebars');
const path = require('path');
const pgp = require('pg-promise')(); // To connect to the Postgres DB from the node server
const bodyParser = require('body-parser');
const session = require('express-session'); // To set the session object. To store or access session data, use the `req.session`, which is (generally) serialized as JSON by the store.
const bcrypt = require('bcryptjs'); //  To hash passwords
const axios = require('axios'); // To make HTTP requests from our server. We'll learn more about it in Part C.



// *****************************************************
// <!-- Section 2 : Connect to DB -->
// *****************************************************

// create `ExpressHandlebars` instance and configure the layouts and partials dir.
const hbs = handlebars.create({
  extname: 'hbs',
  layoutsDir: __dirname + '/views/layouts',
  partialsDir: __dirname + '/views/partials',
});

// database configuration
const dbConfig = {
  host: 'db', // the database server
  port: 5432, // the database port
  database: process.env.POSTGRES_DB, // the database name
  user: process.env.POSTGRES_USER, // the user account to connect with
  password: process.env.POSTGRES_PASSWORD, // the password of the user account
};

const db = pgp(dbConfig);

// test your database
db.connect()
  .then(obj => {
    console.log('Database connection successful'); // you can view this message in the docker compose logs
    obj.done(); // success, release the connection;
  })
  .catch(error => {
    console.log('ERROR:', error.message || error);
  });
  
// *****************************************************
// <!-- Section 3 : App Settings -->
// *****************************************************

// Register `hbs` as our view engine using its bound `engine()` function.
app.engine('hbs', hbs.engine);
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));
app.use(bodyParser.json()); // specify the usage of JSON for parsing request body.

// initialize session variables
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    saveUninitialized: false,
    resave: false,
  })
);

app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);

// *****************************************************
// <!-- Section 4 : API Routes -->
// *****************************************************
const user = {
  username: undefined,
  password: undefined
};


app.get('/welcome', (req, res) => {
  res.json({status: 'success', message: 'Welcome!'});
});

app.get('/', (req,res) => {
  res.redirect('/login');
})

app.get('/login', (req,res) => {
  res.render('./pages/login');
})

app.post('/login', (req, res) => {
	const username = req.body.username;
	console.log(`Querying for username: ${username}`);
	const query = 'SELECT password FROM users WHERE users.username = $1 LIMIT 1';

  // get the student_id based on the emailid
  db.one(query, [username])
    .then(async data => {
		user.password = data.password;
		// check if password from request matches with password in DB
		const match = await bcrypt.compare(req.body.password, user.password);
		
		if(user && match) {
			user.username = username;

			req.session.user = user;
			req.session.save();
			
			res.status(200).render('./pages/login', {
				status: 'success',
				message: 'Logged in successfully.'
			});
			
		} else {
			res.status(400).render('./pages/login', {
				message: 'Incorrect password.'
			});
			
		}
    })
    .catch(err => {
		console.error(`Error:`, err);
		
		res.status(500).render('./pages/login', {
				message: 'Username does not exist.',
	    });
			
    });
});

app.get('/register', (req,res) => {
  res.render('./pages/register');
})

app.post('/register', async (req, res) => {
  //get the information posted by the register form
  const username = req.body.username;
  const email = req.body.email;
  const hash = await bcrypt.hash(req.body.password, 10);

  //defining the query statement
  var query = `INSERT INTO users (username, email, password) VALUES ($1, $2, $3)`;
  
	await db.none(query, [username, email, hash])
		.then(data => {
			console.log('User registered successfully');
			res.status(200).render('./pages/login', {
				message: 'User successfully registered',
		    });
		})
		.catch(err => {
			console.error('Error');

      if(err.code === '23505') {
		res.status(409).render('./pages/register', {
				message: 'That username already exists',
		});
      } else {
		res.status(500).render('./pages/register', {
				message: 'An error occured during registration. Please try again.',
		});
      }
		});	
});

// --------------------------------------------------------------
// Anything that requires a user to be logged in goes below here
// --------------------------------------------------------------

// Authentication Middleware.
const auth = (req, res, next) => {
  if (!req.session.user) {
    // Default to login page.
    return res.redirect('/login');
  }
  next();
};

// Authentication Required
app.use(auth);

app.get('/profile', (req,res) => {
  res.render('./pages/profile');
})

// Endpoint to handle form submission (only for email preferences)
app.post('/save-preferences', async (req, res) => {
  const { user_id, time, assignmentReminder } = req.body;

  try {
    const query = `
      INSERT INTO notification_preferences (user_id, time, assignment_reminder)
      VALUES ($1, $2, $3)
      ON CONFLICT (user_id) DO UPDATE
      SET time = EXCLUDED.time,
          assignment_reminder = EXCLUDED.assignment_reminder
      RETURNING *;
    `;
    const values = [user_id, time, assignmentReminder];
    const result = await pool.query(query, values);

    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error('Error saving preferences:', err);
    res.status(500).send('Error saving preferences');
  }
});

const nodemailer = require('nodemailer');

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

const cron = require('node-cron');
const { pool } = require('./db');

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

// Schedule the task to run every hour (adjust as needed)
cron.schedule('0 * * * *', sendReminders); // Every hour

// Weekly cron job
cron.schedule('0 9 * * 1', sendWeeklyReminder); // Every Monday at 9 AM

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

module.exports = app.listen(3000);
console.log('Server is listening on port 3000');