DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS assignments;

CREATE TABLE users (
    username varChar(50) PRIMARY KEY,
    password varChar(250) NOT NULL,
);

CREATE TABLE assignments (
    id SERIAL NOT NULL,
    username varChar(50),
    task varChar(250),
    date DATE,
    PRIMARY KEY (id)
)
SET DATEFORMAT dmy;