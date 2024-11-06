DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS assignments;
DROP TABLE IF EXISTS friends;

CREATE TABLE users (
    user_id SERIAL PRIMARY KEY NOT NULL,
    username varChar(50) UNIQUE NOT NULL,
    password varChar(250) NOT NULL
);

CREATE TABLE assignments (
    task_id SERIAL PRIMARY KEY NOT NULL,
    user_id INT NOT NULL,
    task varChar(250),
    date DATE,
    FOREIGN KEY (user_id) references users(user_id) ON DELETE CASCADE
);

CREATE TABLE friends (
    user_id INT NOT NULL,
    friend_id INT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (friend_id) REFERENCES users(user_id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, friend_id),
    CHECK (user_id != friend_id)  -- Prevent self-referencing friendship
);