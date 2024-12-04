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
const nodemailer = require('nodemailer');
const cron = require('node-cron');
const { pool } = require('./db');


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

Handlebars.registerHelper('ifeq', function (a, b) {
    return a == b;
});

Handlebars.registerHelper('json', function(arr) {
  return JSON.stringify(arr);
});

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

app.use('/resources', express.static(path.join(__dirname, "resources")));

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


// *****************************************************
// <!-- Section 4 : API Routes -->
// *****************************************************
const user = {
  username: undefined,
  user_id: undefined,
  email: undefined,
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
  const query = 'SELECT password, email, profile_picture, user_id FROM users WHERE username = $1 LIMIT 1';
 
 
  // get the student_id based on the emailid
  db.one(query, [username])
    .then(async data => {
    user.password = data.password;
	user.user_id = data.user_id;
    // check if password from request matches with password in DB
    const match = await bcrypt.compare(req.body.password, user.password);
   
    if(user && match) {
      user.username = username;
      user.email = data.email;
      user.profile_picture = data.profile_picture;
 
 
      req.session.user = user;
      req.session.save();
     
      res.status(200).render('./pages/profile', {
        status: 'success',
        message: 'Logged in successfully.',
        username: user.username,
        email: user.email,
        profile_picture: data.profile_picture
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
  const profile_picture = req.body.profile_picture || "https://pbs.twimg.com/profile_images/1455169155733377027/Eczv5-Jb_400x400.jpg";

  //defining the query statement
  var query = `INSERT INTO users (username, email, password, profile_picture) VALUES ($1, $2, $3, $4)`;
  
	await db.none(query, [username, email, hash, profile_picture])
		.then(() => {
			console.log('User registered successfully');
			res.status(200).render('./pages/login', {
				message: 'User successfully registered',
		    });
		})
		.catch(err => {
			console.error('Error');

      // res.render('/register');

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

app.post('/update-profile-picture', (req, res) => {
  const userId = req.session.user.username;  // Retrieve user ID or username from session
  const profilePictureUrl = req.body.profilePictureUrl;

  const query = 'UPDATE users SET profile_picture = $1 WHERE username = $2';
  db.none(query, [profilePictureUrl, userId])
      .then(() => {
          // Update session data with the new profile picture
          req.session.user.profile_picture = profilePictureUrl;
          res.json({ success: true });
      })
      .catch(error => {
          console.error("Failed to update profile picture:", error);
          res.json({ success: false });
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

app.get('/profile', (req, res) => {
	var post_query = "SELECT * FROM posts WHERE username = $1;";
	
	db.any(post_query, [req.session.user.username])
		.then(async data => {
			res.status(200).render('./pages/profile', {
				username: req.session.user.username,
				email: req.session.user.email,
				profile_picture: req.session.user.profile_picture,
				posts: data
		    });
		})
		.catch(err => {
			console.error('Error:', err);
            res.status(400).render('./pages/profile');
		});	
});

app.post('/delete-account', (req, res) => {
  const userId = req.session.user.username;

  const query = 'DELETE FROM users WHERE username = $1';
  db.none(query, [userId])
      .then(() => {
          req.session.destroy(err => {
              if (err) {
                  console.error("Error destroying session:", err);
                  return res.json({ success: false });
              }
              res.json({ success: true });
          });
      })
      .catch(error => {
          console.error("Failed to delete account:", error);
          res.json({ success: false });
      });
});

app.put('/changePassword', (req, res) => {
  const { currentPass, newPass } = req.body;
  const username = req.session?.user?.username || req.body.username;
  // const currentPass = req.body.currentPass;
  // const newPass = req.body.newPass;

  if (!username) {
    return res.status(400).render('./pages/profile', {
      success: false,
      message: "Username is missing. Please log in again.",
    });
  }

  // Fetch user from the database
  db.one("SELECT * FROM users WHERE username = $1;", [username]) 
    .then(async data => {

      // Check if the current password matches
      const isMatch = await bcrypt.compare(currentPass, data.password);

      if (isMatch) {

        // Hash the new password
        const newHashedPass = await bcrypt.hash(newPass, 10);
        
        // Update the password in the database
        await db.none("UPDATE users SET password = $1 WHERE username = $2;", [newHashedPass, username]);

        res.status(200).render('./pages/profile', {
          success: true,
          message: "Successfully changed password.",
        });
      } else {
        res.status(401).render('./pages/profile', {
          success: false,
          message: "Incorrect password.",
        });
      }
    })
    .catch (error => {
      res.status(500).render('./pages/profile', {
        success: false,
        message: "An error occurred while updating the password.",
      });
    });
});


app.get('/logout', (req, res) => {
	console.log(`logged user out`);
	req.session.destroy();
    res.status(200).render('./pages/login', {
        message: "User successfully logged out.",
    });
});

//Message Board methods

app.post('/message-post', async (req, res) => {
	const title = req.body.title;
	const message = req.body.message;
	const username = req.session.user.username;
	
	var query = "INSERT INTO posts (title, message, username) VALUES ($1, $2, $3);";
	
	await db.none(query, [title, message, username])
		.then(() => {
			console.log('Successful post');
			res.status(200).redirect('/message-board');
		})
		.catch(err => {
			console.error('Error', err);
            res.status(400).redirect('/message-board');
		});	
})

app.post('/message-reply', async (req, res) => {
	const postId = req.body.postId;
	const reply = req.body.reply;
	const username = req.session.user.username;
	
	var query = "INSERT INTO reply (post_id, reply_user, reply_text) VALUES ($1, $2, $3);";
	
	await db.none(query, [postId, username, reply])
		.then(() => {
			console.log('Successful reply');
			res.status(200).redirect('/message-board');
		})
		.catch(err => {
			console.error('Error', err);
            res.status(400).redirect('/message-board');
		});	
})

app.post('/message-delete', async (req, res) => {
	var del_post = "DELETE FROM posts WHERE post_id = $1";
	var del_reply = "DELETE FROM reply WHERE post_id = $1";
	
	db.task(async del => {
		await del.none(del_post, [req.body.postId]);
		await del.none(del_reply, [req.body.postId]);
	})
	.then(async data => {
			console.log("deleted message $1", [req.body.postId]);
			res.status(200).redirect('/message-board');
		})
		.catch(err => {
			console.error('Error:', err);
            res.status(200).redirect('/message-board');
	});		
})

app.get('/message-board', (req, res) => {
	var post_query = "SELECT * FROM posts;";
	var reply_query = "SELECT reply_user, reply_text FROM reply WHERE post_id = $1;"
	
	db.task(async mes => {
        // Fetch all posts
        const posts = await mes.any(post_query);
        		
        // Loop through each post and fetch the matching replies
        for (let post of posts) {
            // Fetch replies for each post using the post's id
            const replies = await mes.any(reply_query, [post.post_id]);
            // Add the replies to the current post object
            post.replies = replies;
        }
        return posts;
    })
		.then(async data => {
			res.status(200).render('./pages/message-board', {
				post_data: data.reverse(),
				user: req.session.user
		    });
		})
		.catch(err => {
			console.error('Error:', err);
            res.status(400).render('./pages/message-board');
		});	
})

//calendar methods

app.get('/calendar', (req,res) => {
	var calendar_query = "SELECT * FROM calendar_events WHERE user_id = $1";
	
	db.task(async cal => {
        
            return await cal.any(calendar_query, [req.session.user.user_id]);

    })
		.then(async data => {
			res.status(200).render('./pages/calendar', {
				calendar_data: data
		    });
		})
		.catch(err => {
			console.error('Error:', err);
            res.status(400).render('./pages/calendar');
		});	
})

app.post('/calendar-add', async (req, res) => {
	var post_calendar_query = "INSERT INTO calendar_events (event_name, event_desc, start_time, event_date, notes, user_id) VALUES ($1, $2, $3, $4, $5, $6);";
		
	await db.none(post_calendar_query, [req.body.event_name, req.body.event_desc, req.body.start_time, req.body.event_date, req.body.notes, req.session.user.user_id])
		.then(() => {
			console.log('Event added to calendar successfully');
			res.status(200).redirect('/calendar');
		})
		.catch(err => {
			console.error('Error', err);
            res.status(400).redirect('/calendar');
		});	
	
})

app.post('/calendar-edit', async (req, res) => {
	var edit_calendar_query = "UPDATE calendar_events SET event_name = $1, event_desc = $2, start_time = $3, event_date = $4, notes = $5 WHERE event_id = $6";
	await db.none(edit_calendar_query, [req.body.event_name, req.body.event_desc, req.body.start_time, req.body.event_date, req.body.notes, req.body.eventId])
		.then(() => {
			console.log('Event edited');
			res.status(200).redirect('/calendar');
		})
		.catch(err => {
			console.error('Error', err);
            res.status(400).redirect('/calendar');
		});	
	
})

app.post('/calendar-delete', async (req, res) => {
	var edit_calendar_query = "DELETE FROM calendar_events WHERE event_id = $1";
	await db.none(edit_calendar_query, [req.body.eventId])
		.then(() => {
			console.log('Event deleted');
			res.status(200).redirect('/calendar');
		})
		.catch(err => {
			console.error('Error', err);
            res.status(400).redirect('/calendar');
		});	
	
})

//Reminder methods

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




module.exports = app.listen(3000);
console.log('Server is listening on port 3000');