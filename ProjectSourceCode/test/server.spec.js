// ********************** Initialize server **********************************

const server = require('../src/index'); // Adjust the path to your index.js as needed

// ********************** Import Libraries ***********************************

const chai = require('chai');
const chaiHttp = require('chai-http');
chai.should();
chai.use(chaiHttp);
const { assert, expect } = chai;

const pgp = require('pg-promise')();
const bcrypt = require('bcryptjs'); // To hash passwords

// database configuration
const dbConfig = {
  host: 'db',
  port: 5432,
  database: process.env.POSTGRES_DB,
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  profile_picture: "https://pbs.twimg.com/profile_images/1455169155733377027/Eczv5-Jb_400x400.jpg"
};

const db = pgp(dbConfig);

// ********************** DEFAULT WELCOME TESTCASE ****************************

describe('Server!', () => {
  it('Returns the default welcome message', done => {
    chai
      .request(server)
      .get('/welcome')
      .end((err, res) => {
        expect(res).to.have.status(200);
        assert.strictEqual(res.body.message, 'Welcome!');
        done();
      });
  });
});

// *********************** UPDATED UNIT TEST CASES ****************************

// Adding a user
describe('Test registering a user API', () => {
  it('positive : /register (post)', done => {
    chai
      .request(server)
      .post('/register')
      .send({ username: 'test_name', email: 'random@email.com', password: 'random' })
      .end((err, res) => {
        expect(res).to.have.status(200);
        res.text.should.include('User successfully registered');
        done();
      });
  });
  it('Negative : /register. Checking invalid name', done => {
    chai
      .request(server)
      .post('/register')
      .send({ username: 'test_name', email: 'random@email.com', password: 'random' })
      .end((err, res) => {
        expect(res).to.have.status(409);
        res.text.should.include('That username already exists');
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
    await db.query(
      'INSERT INTO users (username, email, password) VALUES ($1, $2, $3)',
      [testUser.username, testUser.email, hashedPassword]
    );
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
        .send({ username: 'testuser', password: 'password' })
        .end((err, res) => {
          expect(res).to.have.status(200);
          res.text.should.include('Logged in successfully');
          done();
        });
    });
    it('Negative : /login. Checking invalid password', done => {
      chai
        .request(server)
        .post('/login')
        .send({ username: 'testuser', password: 'password123' })
        .end((err, res) => {
          expect(res).to.have.status(400);
          res.text.should.include('Incorrect password.');
          done();
        });
    });
    it('Negative : /login. Checking non-existent username', done => {
      chai
        .request(server)
        .post('/login')
        .send({ username: 'nonexistent_user', password: 'randompassword' })
        .end((err, res) => {
          expect(res).to.have.status(500);
          res.text.should.include('Username does not exist.');
          done();
        });
    });
  });
});
