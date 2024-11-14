DROP TABLE IF EXISTS friends;
DROP TABLE IF EXISTS assignments;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS private_info;

CREATE TABLE users (
   user_id SERIAL PRIMARY KEY NOT NULL,
   username VARCHAR(50) UNIQUE NOT NULL,
   password VARCHAR(255) NOT NULL,
   email VARCHAR(250) UNIQUE NOT NULL,
   profile_picture TEXT
);

CREATE TABLE private_info (
    user_id INT NOT NULL PRIMARY KEY,
    grade INT,
    age INT,
    dob DATE,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE TABLE assignments (
    task_id SERIAL PRIMARY KEY NOT NULL,
    user_id INT NOT NULL,
    task VARCHAR(250),
    date DATE,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE TABLE friends (
    user_id INT NOT NULL,
    friend_id INT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (friend_id) REFERENCES users(user_id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, friend_id),
    CHECK (user_id != friend_id)  -- Prevent self-referencing friendship
);