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

app.use('/resources', express.static(path.join(__dirname, "resources")));

// *****************************************************
// <!-- Section 4 : API Routes -->
// *****************************************************
const user = {
  username: undefined,
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
  const query = 'SELECT password, email, profile_picture FROM users WHERE username = $1 LIMIT 1';
 
 
  // get the student_id based on the emailid
  db.one(query, [username])
    .then(async data => {
    user.password = data.password;
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
  res.render('./pages/profile', {
    username: req.session.user.username,
    email: req.session.user.email,
    profile_picture: req.session.user.profile_picture
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

app.get('/calendar', (req,res) => {
  res.render('./pages/calendar');
})

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
				post_data: data.reverse()
		    });
		})
		.catch(err => {
			console.error('Error:', err);
            res.status(400).render('./pages/message-board');
		});	
})

module.exports = app.listen(3000);
console.log('Server is listening on port 3000');