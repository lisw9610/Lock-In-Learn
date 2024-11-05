CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    username varChar(50) PRIMARY KEY,
    password varChar(250) NOT NULL
);

CREATE TABLE assignments (
    id SERIAL NOT NULL,
    username varChar(50),
    task varChar(250),
    date DATE,
    PRIMARY KEY (id)
);

CREATE TABLE user_courses (
    user_course_id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(user_id) ON DELETE CASCADE,
    course_id INT REFERENCES courses(course_id) ON DELETE CASCADE,
    start_date DATE
);

SET DATEFORMAT dmy;