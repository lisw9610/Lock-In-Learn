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

// const multer = require('multer');
// const upload = multer({ dest: 'uploads/' }); // Directory where files will be saved


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

module.exports = app.listen(3000);
console.log('Server is listening on port 3000');