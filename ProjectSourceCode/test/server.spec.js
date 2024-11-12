// ********************** Initialize server **********************************

const server = require('../src/index'); //TODO: Make sure the path to your index.js is correctly added

// ********************** Import Libraries ***********************************

const chai = require('chai'); // Chai HTTP provides an interface for live integration testing of the API's.
const chaiHttp = require('chai-http');
chai.should();
chai.use(chaiHttp);
const {assert, expect} = chai;

const pgp = require('pg-promise')();
const bcrypt = require('bcryptjs'); //  To hash passwords


// database configuration
const dbConfig = {
  host: 'db', // the database server
  port: 5432, // the database port
  database: process.env.POSTGRES_DB, // the database name
  user: process.env.POSTGRES_USER, // the user account to connect with
  password: process.env.POSTGRES_PASSWORD, // the password of the user account
};

const db = pgp(dbConfig);

// ********************** DEFAULT WELCOME TESTCASE ****************************

describe('Server!', () => {
  // Sample test case given to test / endpoint.
  it('Returns the default welcome message', done => {
    chai
      .request(server)
      .get('/welcome')
      .end((err, res) => {
        expect(res).to.have.status(200);
        expect(res.body.status).to.equals('success');
        assert.strictEqual(res.body.message, 'Welcome!');
        done();
      });
  });
});

// *********************** TODO: WRITE 2 UNIT TESTCASES **************************

// ********************************************************************************

// Adding a user
describe('Test registering a user API', () => {
  it('positive : /register (post)', done => {
    chai
      .request(server)
      .post('/register')
      .send({username: 'test_name', email: 'random@email.com', password: 'random'})
      .end((err, res) => {
        expect(res).to.have.status(200);
        expect(res.body.message).to.equals('User successfully registered');
        done();
      });
  });
  it('Negative : /register. Checking invalid name', done => {
    chai
      .request(server)
      .post('/register')
      .send({username: 'test_name', email: 'random@email.com', password: 'random'})
      .end((err, res) => {
        expect(res).to.have.status(409);
        expect(res.body.message).to.equals('That username already exists');
        done();
      });
  });
});

// Logging in User
describe('Log In Route Tests', () => {
  const testUser = {
    username: 'testuser',
	  email: 'email@gmail.com',
    password: 'password',
  };

  before(async () => {
    // Clear users table and create test user
    await db.query('TRUNCATE TABLE users CASCADE');
    const hashedPassword = await bcrypt.hash(testUser.password, 10);
    await db.query('INSERT INTO users (username, email, password) VALUES ($1, $2, $3)', [testUser.username, testUser.email, hashedPassword]);
  });
	
  after(async () => {
    // Clean up database
    await db.query('TRUNCATE TABLE users CASCADE');
  });

	describe('Test log in API', () => {	
	  it('positive : /login (post)', done => {
		chai
		  .request(server)
		  .post('/login')
		  .send({username: 'testuser', password: 'password'})
		  .end((err, res) => {
			expect(res).to.have.status(200);
			expect(res.body.message).to.equals('Logged in successfully.');
			done();
		  });
	  });
	  it('Negative : /login. Checking invalid name or password', done => {
		chai
		  .request(server)
		  .post('/login')
		  .send({username: 'testuser', password: 'password123'})
		  .end((err, res) => {
			expect(res).to.have.status(400);
			expect(res.body.message).to.equals('Incorrect password.');
			done();
		  });
	  });
    it('Negative : /login. Checking non-existent username', done => {
      chai  
        .request(server)
        .post('/login')
        .send({ username: 'nonexistent_user', password: 'randompassword'})
        .end((err, res) => {
          expect(res).to.have.status(500);
          expect(res.body.message).to.equal('Username does not exist.');
          done();
        });
    });

	});
});
