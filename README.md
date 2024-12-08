# Lock-In-Learn

## Application Description
Lock-In-Learn is an academic calendar app designed to help students effectively manage their assignments, deadlines, and academic tasks. It provides a streamlined platform for organizing coursework, ensuring students stay on top of their responsibilities and achieve their academic goals. The website provides two key features: a calendar and a message board. The calendar allows students to organize and schedule their goals, deadlines, and events, helping them stay on top of their academic responsibilities. The message board acts as a community hub, where students can post questions, share insights, and engage in discussions related to their coursework. The platform is focused on simplicity and functionality, offering essential features that contribute to student success and course load management.

## Contributors
- Sophie Tu
- Lilian Sobernheim
- Cadence Fong
- Liam Sweeney
- Erubiel Huerta

## Technology Stacks
- PostgreSQL: database management system
- HTML and Handlebars: markup language and template compiler
- Node.js: open-source Javascript runtime environment
- Express: Node.js application framework
- Nodemailer: used for sending emails and scheduling tasks
- FullCalendar: provided documentation and features for the calendar

## Prerequisites to run the application
- Install Docker Desktop and VScode
- In VScode, create a (.env) file inside the ProjectSourceCode folder with this inside the (.env):

    POSTGRES_USER="postgres"
    POSTGRES_PASSWORD="pwd"
    POSTGRES_DB="users_db"
    SESSION_SECRET="super duper secret!"
    API_KEY="<Your_API_key>

## Steps to run the application locally
1. Open the project in VScode and run "cd ProjectSourceCode" into the terminal to make sure you are in that folder
2. Ensure Docker is running locally
3. In the terminal, run "docker compose up"
4. This allows you to view the website on localhost:3000 on your local machine
5. When finished running the application, run "docker compose down -v"

## How to run the tests
The tests run automatically when you run "docker compose up" in the terminal after completing all the prerequisites.
When run, the tests display in the terminal whether they passed or not.

## Link to the deployed application
https://lock-in-learn.onrender.com