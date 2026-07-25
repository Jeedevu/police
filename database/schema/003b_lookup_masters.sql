CREATE TABLE Rank (
    rank_id SERIAL PRIMARY KEY,
    rank_name VARCHAR(100) NOT NULL,
    hierarchy INT,
    active BOOLEAN DEFAULT TRUE
);

CREATE TABLE Designation (
    designation_id SERIAL PRIMARY KEY,
    designation_name VARCHAR(100) NOT NULL,
    active BOOLEAN DEFAULT TRUE,
    sort_order INT
);

CREATE TABLE Employee (
    employee_id SERIAL PRIMARY KEY,
    district_id INT REFERENCES District(district_id) ON DELETE SET NULL,
    unit_id INT REFERENCES Unit(unit_id) ON DELETE SET NULL,
    rank_id INT REFERENCES Rank(rank_id) ON DELETE SET NULL,
    designation_id INT REFERENCES Designation(designation_id) ON DELETE SET NULL,
    kgid VARCHAR(50) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    employee_dob DATE,
    gender_id INT,
    blood_group_id INT,
    physically_challenged BOOLEAN DEFAULT FALSE,
    appointment_date DATE
);

CREATE TABLE CaseCategory (
    case_category_id SERIAL PRIMARY KEY,
    lookup_value VARCHAR(50) NOT NULL
);

CREATE TABLE GravityOffence (
    gravity_offence_id SERIAL PRIMARY KEY,
    lookup_value VARCHAR(50) NOT NULL
);

CREATE TABLE CrimeHead (
    crime_head_id SERIAL PRIMARY KEY,
    crime_group_name VARCHAR(100) NOT NULL,
    active BOOLEAN DEFAULT TRUE
);

CREATE TABLE CrimeSubHead (
    crime_sub_head_id SERIAL PRIMARY KEY,
    crime_head_id INT NOT NULL REFERENCES CrimeHead(crime_head_id) ON DELETE CASCADE,
    crime_head_name VARCHAR(100) NOT NULL,
    seq_id INT
);

CREATE TABLE CaseStatusMaster (
    case_status_id SERIAL PRIMARY KEY,
    case_status_name VARCHAR(50) NOT NULL
);

CREATE TABLE Court (
    court_id SERIAL PRIMARY KEY,
    court_name VARCHAR(150) NOT NULL,
    district_id INT REFERENCES District(district_id) ON DELETE SET NULL,
    state_id INT REFERENCES State(state_id) ON DELETE SET NULL,
    active BOOLEAN DEFAULT TRUE
);

CREATE TABLE CasteMaster (
    caste_master_id SERIAL PRIMARY KEY,
    caste_master_name VARCHAR(100) NOT NULL
);

CREATE TABLE ReligionMaster (
    religion_id SERIAL PRIMARY KEY,
    religion_name VARCHAR(100) NOT NULL
);

CREATE TABLE OccupationMaster (
    occupation_id SERIAL PRIMARY KEY,
    occupation_name VARCHAR(100) NOT NULL
);

CREATE TABLE Act (
    act_code VARCHAR(50) PRIMARY KEY,
    act_description VARCHAR(200) NOT NULL,
    short_name VARCHAR(50),
    active BOOLEAN DEFAULT TRUE
);

CREATE TABLE Section (
    act_code VARCHAR(50) REFERENCES Act(act_code) ON DELETE CASCADE,
    section_code VARCHAR(50),
    section_description VARCHAR(500),
    active BOOLEAN DEFAULT TRUE,
    PRIMARY KEY (act_code, section_code)
);

CREATE TABLE CrimeHeadActSection (
    crime_head_id INT REFERENCES CrimeHead(crime_head_id) ON DELETE CASCADE,
    act_code VARCHAR(50),
    section_code VARCHAR(50),
    PRIMARY KEY (crime_head_id, act_code, section_code),
    FOREIGN KEY (act_code, section_code) REFERENCES Section(act_code, section_code) ON DELETE CASCADE
);
