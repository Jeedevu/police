CREATE TABLE UnitType (
    unit_type_id SERIAL PRIMARY KEY,
    unit_type_name VARCHAR(100) NOT NULL,
    city_dist_state VARCHAR(100),
    hierarchy INT,
    active BOOLEAN DEFAULT TRUE
);

CREATE TABLE Unit (
    unit_id SERIAL PRIMARY KEY,
    unit_name VARCHAR(100) NOT NULL,
    type_id INT REFERENCES UnitType(unit_type_id) ON DELETE SET NULL,
    parent_unit INT REFERENCES Unit(unit_id) ON DELETE SET NULL,
    nationality_id INT,
    state_id INT REFERENCES State(state_id) ON DELETE SET NULL,
    district_id INT REFERENCES District(district_id) ON DELETE SET NULL,
    active BOOLEAN DEFAULT TRUE
);
