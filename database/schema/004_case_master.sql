CREATE TABLE CaseMaster (
    case_id SERIAL PRIMARY KEY,
    fir_number VARCHAR(50) UNIQUE NOT NULL,
    crime_type VARCHAR(100) NOT NULL,
    district VARCHAR(100),
    police_station VARCHAR(100),
    case_status VARCHAR(50),
    crime_date DATE,
    
    -- KSP ER Diagram Fields
    police_person_id INT REFERENCES Employee(employee_id) ON DELETE SET NULL,
    police_station_id INT REFERENCES Unit(unit_id) ON DELETE SET NULL,
    case_category_id INT REFERENCES CaseCategory(case_category_id) ON DELETE SET NULL,
    gravity_offence_id INT REFERENCES GravityOffence(gravity_offence_id) ON DELETE SET NULL,
    crime_major_head_id INT REFERENCES CrimeHead(crime_head_id) ON DELETE SET NULL,
    crime_minor_head_id INT REFERENCES CrimeSubHead(crime_sub_head_id) ON DELETE SET NULL,
    case_status_id INT REFERENCES CaseStatusMaster(case_status_id) ON DELETE SET NULL,
    court_id INT REFERENCES Court(court_id) ON DELETE SET NULL,
    
    incident_from_date TIMESTAMP,
    incident_to_date TIMESTAMP,
    info_received_ps_date TIMESTAMP,
    
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    
    brief_facts TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE ComplainantDetails (
    complainant_id SERIAL PRIMARY KEY,
    case_id INT REFERENCES CaseMaster(case_id) ON DELETE CASCADE,
    name VARCHAR(150),
    gender VARCHAR(20),
    age INT,
    mobile VARCHAR(20),
    address VARCHAR(300),
    
    -- KSP master references
    occupation_id INT REFERENCES OccupationMaster(occupation_id) ON DELETE SET NULL,
    religion_id INT REFERENCES ReligionMaster(religion_id) ON DELETE SET NULL,
    caste_id INT REFERENCES CasteMaster(caste_master_id) ON DELETE SET NULL
);

CREATE TABLE Victim (
    victim_id SERIAL PRIMARY KEY,
    case_id INT REFERENCES CaseMaster(case_id) ON DELETE CASCADE,
    name VARCHAR(150),
    gender VARCHAR(20),
    age INT,
    address VARCHAR(300),
    
    -- KSP specific columns
    victim_police VARCHAR(10)
);

CREATE TABLE Accused (
    accused_id SERIAL PRIMARY KEY,
    case_id INT REFERENCES CaseMaster(case_id) ON DELETE CASCADE,
    name VARCHAR(150),
    gender VARCHAR(20),
    age INT,
    address VARCHAR(300),
    
    -- KSP specific columns
    person_id VARCHAR(50)
);

CREATE TABLE ChargesheetDetails (
    cs_id SERIAL PRIMARY KEY,
    case_master_id INT NOT NULL REFERENCES CaseMaster(case_id) ON DELETE CASCADE,
    cs_date TIMESTAMP,
    cs_type CHAR(1), -- A->Chargesheet, B->False Case, C->Undetected
    police_person_id INT REFERENCES Employee(employee_id) ON DELETE SET NULL
);

CREATE TABLE ArrestSurrender (
    arrest_surrender_id SERIAL PRIMARY KEY,
    case_master_id INT NOT NULL REFERENCES CaseMaster(case_id) ON DELETE CASCADE,
    arrest_surrender_type_id INT,
    arrest_surrender_date DATE,
    arrest_surrender_state_id INT REFERENCES State(state_id) ON DELETE SET NULL,
    arrest_surrender_district_id INT REFERENCES District(district_id) ON DELETE SET NULL,
    police_station_id INT REFERENCES Unit(unit_id) ON DELETE SET NULL,
    io_id INT REFERENCES Employee(employee_id) ON DELETE SET NULL,
    court_id INT REFERENCES Court(court_id) ON DELETE SET NULL,
    accused_master_id INT REFERENCES Accused(accused_id) ON DELETE CASCADE,
    is_accused BOOLEAN DEFAULT TRUE,
    is_complainant_accused BOOLEAN DEFAULT FALSE
);

CREATE TABLE ActSectionAssociation (
    case_master_id INT REFERENCES CaseMaster(case_id) ON DELETE CASCADE,
    act_id VARCHAR(50),
    section_id VARCHAR(50),
    act_order_id INT,
    section_order_id INT,
    PRIMARY KEY (case_master_id, act_id, section_id),
    FOREIGN KEY (act_id, section_id) REFERENCES Section(act_code, section_code) ON DELETE CASCADE
);