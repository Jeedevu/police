CREATE TABLE District (
    district_id SERIAL PRIMARY KEY,
    district_name VARCHAR(100) NOT NULL,
    state_id INT NOT NULL,
    active BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (state_id) REFERENCES State(state_id) ON DELETE CASCADE
);
