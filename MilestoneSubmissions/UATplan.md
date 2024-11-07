# USER ACCEPTANCE TESTING PLAN 
> 1. Successful Login
- A user cannot receive access to data until they fill out all mandatory fields and is authenticated.
    - **Test Data**:
        - username
        - password
    - **Test Description**:
        - **Results**: When user submits form, the query should check if the values inputted are the same as the data values saved in the database. After user should be redirected to 'their' calendar page with personal assignments.
        - **Test Environment**: is on Localhost server running on 'localhost:3000'.

### 2. Successful Register
- Verify that a user can successfully register for an account with valid data.
    - **Test Data**:
        - username: 'random_test'
        - password: 'random_pass'
        - email: 'random@email.com'
    
    - **Test Description**:
        - This is supposed to guide the user to the Registration page to enter unique values of an email, password, and username. Once the registration button is clicked, it sends a form of the data to the backend database to insert new values. 
        - **Result**: The user should now be redirected to the login page (if data is unique) with a confirmation message: "success".
        - **Test Environment**: is on Localhost server running on 'localhost:3000'.

### 3. Registration with Invalid Data Value
- Verify that the system does not allow a data value that is already taken!
    - **Test Data**
        - username: 'random_test'
        - password: 'something_else'
        - email: 'other_email@email.com'
    - **Test Description**
        - **Test Environment**: On Localhost server running on 'localhost:3000'.
        - **Result**: An error message appears: "Invalid username or password". No redirection is needed.