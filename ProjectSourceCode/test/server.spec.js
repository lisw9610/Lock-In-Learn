// ********************** Initialize server **********************************

const server = require('../src/index'); //TODO: Make sure the path to your index.js is correctly added

// ********************** Import Libraries ***********************************

const chai = require('chai'); // Chai HTTP provides an interface for live integration testing of the API's.
const chaiHttp = require('chai-http');
chai.should();
chai.use(chaiHttp);
const {assert, expect} = chai;

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
        expect(res.body.message).to.equals('successfully registered a new user');
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
        expect(res.body.message).to.equals('Username is already in use. Please try another.');
        done();
      });
  });
});


