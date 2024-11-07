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

app.get('/', (req,res) => {
  res.redirect('/login');
})

app.get('/login', (req,res) => {
  res.render('./pages/login');
})

app.post('/login', async (req,res) => {
  const username = req.body.username;

  try{
    const query = 'select * from users where username = $1 limit 1;'
    const data = await db.oneOrNone(query, [username]);

    if (!data) {
      return res.render('pages/login', {
        message: 'Invalid username or password',
        error: true
      });
    }

    const match = await bcrypt.compare(req.body.password, data.password);
    
    if (match) {
        const user = {
            username: data.username,
            password: data.password
        }
        req.session.user = user; 
        req.session.save(); 
        res.redirect('/profile');
      } 
    
    else {
      return res.render('pages/login', {
        message: 'Invalid username or password',
        error: true
      });
    }
  } catch (error) {
      console.error('Error during login:', err);
      res.redirect('login', { error: 'Login failed. Please try again.' });
  }
})

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
			res.redirect('/login');
		})
		.catch(err => {
			console.error('Error:', err);
			res.render('./pages/register', {
				message: 'Username is already in use. Please try another.',
			});
		});	
});

app.get('/profile', (req,res) => {
  res.render('./pages/profile');
})

app.get('/')

// app.post('/login', await (req,res) => {

// })

app.listen(3000);
console.log('Server is listening on port 3000');