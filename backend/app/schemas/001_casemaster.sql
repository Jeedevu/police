CREATE TABLE CaseMaster (
    CaseMasterID SERIAL PRIMARY KEY,
    FIRNumber VARCHAR(50) UNIQUE NOT NULL,
    CrimeType VARCHAR(100) NOT NULL,
    CrimeDate DATE NOT NULL,
    PoliceStation VARCHAR(150),
    District VARCHAR(100),
    State VARCHAR(100) DEFAULT 'Karnataka',
    Latitude DECIMAL(10,7),
    Longitude DECIMAL(10,7),
    InvestigationStatus VARCHAR(50),
    BriefFacts TEXT,
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
