CREATE TABLE State (
    state_id SERIAL PRIMARY KEY,
    state_name VARCHAR(100) NOT NULL,
    nationality_id INT,
    active BOOLEAN DEFAULT TRUE
);
