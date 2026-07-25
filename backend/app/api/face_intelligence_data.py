"""
KSP Crime Intelligence Platform — Seeded Criminal Dataset (15 Karnataka Offenders)
Enterprise-grade mock dataset for hackathon demo.
"""

CRIMINALS_DATASET = [
  {
    "criminal_id": "CRM-2026-8801",
    "name": "Vikram 'Bhai' Gowda",
    "alias": "Vicky / Black Cobra",
    "age": 38,
    "dob": "1988-04-14",
    "height": "5'11\" (180 cm)",
    "weight": "82 kg",
    "blood_group": "B+",
    "identification_marks": "Cobra tattoo on right forearm, scar below left eye",
    "district": "Bengaluru City",
    "police_station": "Cubbon Park PS",
    "wanted_status": "WANTED - INTERPOL RED CORNER",
    "threat_level": "CRITICAL",
    "risk_score": 96,
    "photo_url": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&auto=format&fit=crop&q=80",
    "last_seen": "Majestic Bus Terminus, Bengaluru • 2026-07-22 21:45 IST",
    "address": "No. 42, 1st Cross, Kalasipalya, Bengaluru City, Karnataka",
    "crime_types": ["Armed Robbery", "Extortion", "Contract Assault", "Illegal Firearms"],
    "firs": [
      { "fir_number": "FIR-2024-8821", "crime": "Armed Dacoity & Robbery", "police_station": "Cubbon Park PS", "date": "2024-11-12", "status": "Under Investigation", "officer": "Insp. Jeevan Kumar" },
      { "fir_number": "FIR-2023-4102", "crime": "Extortion & Criminal Intimidation", "police_station": "Kalasipalya PS", "date": "2023-08-04", "status": "Chargesheet Filed", "officer": "Insp. R. Seshadri" },
      { "fir_number": "FIR-2021-1904", "crime": "Possession of Illegal Arms (Arms Act Sec 25)", "police_station": "Upparpet PS", "date": "2021-03-19", "status": "Bail Jumped", "officer": "Sub-Insp. M. Nagesh" }
    ],
    "arrest_history": [
      { "year": "2019", "event": "Arrested in Commercial Street Gold Shop Robbery Case", "badge": "ARRESTED" },
      { "year": "2020", "event": "Released on conditional bail by Session Court", "badge": "BAIL" },
      { "year": "2021", "event": "Implicated in Illegal Firearms Trafficking Racket", "badge": "CHARGED" },
      { "year": "2022", "event": "Named as lead suspect in Statewide Narcotics Cartel Case", "badge": "DRUG CASE" },
      { "year": "2023", "event": "Absconded during trial hearing; NBW issued", "badge": "WARRANT" },
      { "year": "2024", "event": "Declared Proclaimed Offender by High Court", "badge": "PROCLAIMED" },
      { "year": "2026", "event": "Matched via Live AI Facial Intelligence Stream", "badge": "FACE MATCH" }
    ],
    "associates": [
      { "name": "Syed 'Blade' Tanveer", "relation": "Primary Enforcer / Hitman", "crimes": "Assault, Extortion", "photo_url": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80" },
      { "name": "Ramesh 'Don' Naik", "relation": "Hawala Operator & Financier", "crimes": "Money Laundering, Fraud", "photo_url": "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&auto=format&fit=crop&q=80" },
      { "name": "Kiran 'Phantom' Das", "relation": "Safehouse Supplier & Logistics", "crimes": "Sheltering Fugitives", "photo_url": "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=300&auto=format&fit=crop&q=80" }
    ],
    "vehicles": [
      { "model": "Mahindra Thar 4x4 (Black)", "reg_no": "KA-01-MJ-9901", "color": "Midnight Black", "type": "SUV" },
      { "model": "KTM Duke 390 (Modified)", "reg_no": "KA-04-EV-4412", "color": "Orange / Black", "type": "Motorcycle" }
    ],
    "weapons": [
      { "type": "Country-made 7.65mm Pistol", "caliber": "7.65mm", "status": "Active / Unrecovered" },
      { "type": "Machete / Tactical Blade", "caliber": "N/A", "status": "Seized in 2021" }
    ],
    "evidence_files": [
      { "type": "cctv", "title": "CCTV Footage — MG Road ATM Heist", "url": "https://images.unsplash.com/photo-1557597774-9d273605dfa9?w=600&auto=format&fit=crop&q=80", "date": "2026-07-15", "size": "42.8 MB (Catalyst File Store)" },
      { "type": "video", "title": "Traffic Cam Video Dump — Silk Board Junction", "url": "https://images.unsplash.com/photo-1508873696983-2df515122519?w=600&auto=format&fit=crop&q=80", "date": "2026-07-20", "size": "128.4 MB (Catalyst File Store)" },
      { "type": "fir_pdf", "title": "Certified FIR Dossier Copy #8821", "url": "https://images.unsplash.com/photo-1568667256549-094345857637?w=600&auto=format&fit=crop&q=80", "date": "2024-11-12", "size": "3.1 MB (PDF File Store)" },
      { "type": "weapon", "title": "Seized 7.65mm Pistol Forensic Snap", "url": "https://images.unsplash.com/photo-1595590424283-b8f17842773f?w=600&auto=format&fit=crop&q=80", "date": "2021-03-20", "size": "14.2 MB (HD Photo Store)" },
      { "type": "vehicle", "title": "Confiscated Mahindra Thar Inspection Photo", "url": "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=600&auto=format&fit=crop&q=80", "date": "2023-09-10", "size": "8.7 MB (High-Res Snap)" },
      { "type": "phone_extraction", "title": "UFED Cellebrite Phone Call Logs Dump", "url": "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=600&auto=format&fit=crop&q=80", "date": "2026-07-02", "size": "890.0 MB (Forensic Dump)" }
    ]
  },
  {
    "criminal_id": "CRM-2026-4412",
    "name": "Nagaraj 'Tiger' Hegde",
    "alias": "Nagu / Tiger",
    "age": 42,
    "dob": "1984-09-10",
    "height": "6'0\" (183 cm)",
    "weight": "88 kg",
    "blood_group": "A+",
    "identification_marks": "Tiger head tattoo on left chest",
    "district": "Mangaluru City",
    "police_station": "Barkhe PS",
    "wanted_status": "LOOKOUT CIRCULAR ACTIVE",
    "threat_level": "HIGH",
    "risk_score": 89,
    "photo_url": "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=600&auto=format&fit=crop&q=80",
    "last_seen": "Mangaluru Port Gate #3 • 2026-07-21 18:30 IST",
    "address": "Urwa Store, Mangaluru City, Dakshina Kannada, Karnataka",
    "crime_types": ["Smuggling", "Extortion", "Land Grabbing"],
    "firs": [
      { "fir_number": "FIR-2025-1102", "crime": "Port Timber Smuggling Racket", "police_station": "Barkhe PS", "date": "2025-02-14", "status": "Under Investigation", "officer": "Insp. Vinayaka Bhat" },
      { "fir_number": "FIR-2022-7714", "crime": "Extortion from Coastal Contractors", "police_station": "Panambur PS", "date": "2022-06-19", "status": "Chargesheet Filed", "officer": "Insp. Udaya Kumar" }
    ],
    "arrest_history": [
      { "year": "2018", "event": "Arrested for Harbor Timber Extortion", "badge": "ARRESTED" },
      { "year": "2020", "event": "Released on conditional bail", "badge": "BAIL" },
      { "year": "2022", "event": "Chargesheet filed in Panambur Extortion Case", "badge": "CHARGED" },
      { "year": "2026", "event": "Matched via Live AI Facial Intelligence Stream", "badge": "FACE MATCH" }
    ],
    "associates": [
      { "name": "Pradeep 'Sea' Shettigar", "relation": "Port Logistics Handler", "crimes": "Smuggling, Fraud", "photo_url": "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=300&auto=format&fit=crop&q=80" }
    ],
    "vehicles": [
      { "model": "Toyota Fortuner (White)", "reg_no": "KA-19-MC-0007", "color": "Pearl White", "type": "SUV" }
    ],
    "weapons": [
      { "type": "Licensed 0.32 Revolver (Revoked)", "caliber": ".32", "status": "Seized" }
    ],
    "evidence_files": [
      { "type": "cctv", "title": "Mangaluru Port Cargo Cam Snap", "url": "https://images.unsplash.com/photo-1578575437130-527eed3abbec?w=600&auto=format&fit=crop&q=80", "date": "2026-07-10", "size": "18.4 MB" }
    ]
  },
  {
    "criminal_id": "CRM-2026-3390",
    "name": "Syed 'Blade' Tanveer",
    "alias": "Tanju / Blade",
    "age": 31,
    "dob": "1995-11-20",
    "height": "5'9\" (175 cm)",
    "weight": "74 kg",
    "blood_group": "O+",
    "identification_marks": "Cut scar across left jawline",
    "district": "Bengaluru City",
    "police_station": "Shivajinagar PS",
    "wanted_status": "WANTED - HIGH PRIORITY",
    "threat_level": "HIGH",
    "risk_score": 92,
    "photo_url": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600&auto=format&fit=crop&q=80",
    "last_seen": "Russell Market Alleyway, Shivajinagar • 2026-07-23 22:10 IST",
    "address": "No. 18, HKP Road, Shivajinagar, Bengaluru City, Karnataka",
    "crime_types": ["Contract Assault", "Armed Robbery", "Snatching"],
    "firs": [
      { "fir_number": "FIR-2025-9901", "crime": "Commercial Street Knife Assault", "police_station": "Shivajinagar PS", "date": "2025-05-10", "status": "Under Investigation", "officer": "Insp. Zameer Pasha" }
    ],
    "arrest_history": [
      { "year": "2019", "event": "Arrested in Chain Snatching Strike", "badge": "ARRESTED" },
      { "year": "2021", "event": "Released on bail", "badge": "BAIL" },
      { "year": "2026", "event": "Matched via Live AI Facial Intelligence Stream", "badge": "FACE MATCH" }
    ],
    "associates": [
      { "name": "Vikram 'Bhai' Gowda", "relation": "Syndicate Gang Leader", "crimes": "Armed Robbery, Extortion", "photo_url": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80" }
    ],
    "vehicles": [
      { "model": "Yamaha RX100 (Black)", "reg_no": "KA-02-EX-1995", "color": "Black", "type": "Motorcycle" }
    ],
    "weapons": [
      { "type": "Folding Curved Blade", "caliber": "N/A", "status": "Active" }
    ],
    "evidence_files": [
      { "type": "video", "title": "Commercial Street Assault Cam Footage", "url": "https://images.unsplash.com/photo-1517649763962-0c623266010b?w=600&auto=format&fit=crop&q=80", "date": "2025-05-10", "size": "64.2 MB" }
    ]
  },
  {
    "criminal_id": "CRM-2026-7102",
    "name": "Ramesh 'Don' Naik",
    "alias": "Sahukar / Don Naik",
    "age": 45,
    "dob": "1981-02-05",
    "height": "5'8\" (173 cm)",
    "weight": "85 kg",
    "blood_group": "AB+",
    "identification_marks": "Gold tooth right upper jaw",
    "district": "Mysuru City",
    "police_station": "Nazarbad PS",
    "wanted_status": "INTERPOL BLUE NOTICE",
    "threat_level": "MEDIUM",
    "risk_score": 78,
    "photo_url": "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=600&auto=format&fit=crop&q=80",
    "last_seen": "Devaraja Market Complex, Mysuru • 2026-07-20 14:15 IST",
    "address": "Gokulam 3rd Stage, Mysuru City, Karnataka",
    "crime_types": ["Hawala Racket", "Money Laundering", "Financial Fraud"],
    "firs": [
      { "fir_number": "FIR-2024-3012", "crime": "Multi-Crore Hawala Money Laundering", "police_station": "Nazarbad PS", "date": "2024-08-11", "status": "Under Investigation", "officer": "Insp. Someshwara Rao" }
    ],
    "arrest_history": [
      { "year": "2017", "event": "Investigated by Enforcement Directorate", "badge": "ED PROBE" },
      { "year": "2024", "event": "FIR registered in Mysuru Hawala Fraud Case", "badge": "CHARGED" }
    ],
    "associates": [
      { "name": "Vikram 'Bhai' Gowda", "relation": "Hawala Receiver", "crimes": "Extortion, Dacoity", "photo_url": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80" }
    ],
    "vehicles": [
      { "model": "Mercedes-Benz E-Class (Silver)", "reg_no": "KA-09-MA-0001", "color": "Iridium Silver", "type": "Sedan" }
    ],
    "weapons": [],
    "evidence_files": [
      { "type": "fir_pdf", "title": "Financial Audit & Ledger Annexure", "url": "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=80", "date": "2024-08-11", "size": "14.5 MB" }
    ]
  },
  {
    "criminal_id": "CRM-2026-9011",
    "name": "Kiran 'Phantom' Das",
    "alias": "Phantom / Darko",
    "age": 34,
    "dob": "1992-06-18",
    "height": "5'10\" (178 cm)",
    "weight": "76 kg",
    "blood_group": "O-",
    "identification_marks": "Cross tattoo behind right ear",
    "district": "Hubballi-Dharwad",
    "police_station": "Suburban PS",
    "wanted_status": "NBW ISSUED",
    "threat_level": "HIGH",
    "risk_score": 85,
    "photo_url": "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=600&auto=format&fit=crop&q=80",
    "last_seen": "Old Hubballi Railway Yard • 2026-07-19 23:00 IST",
    "address": "Gokul Road, Hubballi, Dharwad District, Karnataka",
    "crime_types": ["Arms Smuggling", "Sheltering Fugitives", "Cyber Theft"],
    "firs": [
      { "fir_number": "FIR-2025-4491", "crime": "Illegal Safehouse & Arms Storage", "police_station": "Suburban PS", "date": "2025-01-22", "status": "Under Investigation", "officer": "Insp. Basavaraj Patil" }
    ],
    "arrest_history": [
      { "year": "2020", "event": "Arrested in Cyber Identity Theft Bust", "badge": "ARRESTED" },
      { "year": "2023", "event": "Bail Granted by Sessions Court", "badge": "BAIL" }
    ],
    "associates": [
      { "name": "Vikram 'Bhai' Gowda", "relation": "Logistics & Safehouse Client", "crimes": "Armed Dacoity", "photo_url": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80" }
    ],
    "vehicles": [
      { "model": "Hyundai Creta (Grey)", "reg_no": "KA-25-N-8800", "color": "Titan Grey", "type": "SUV" }
    ],
    "weapons": [
      { "type": "Automatic 9mm Submachine Replica", "caliber": "9mm", "status": "Seized" }
    ],
    "evidence_files": [
      { "type": "phone_extraction", "title": "Encrypted WhatsApp & Signal Backup Dump", "url": "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600&auto=format&fit=crop&q=80", "date": "2025-01-22", "size": "412.0 MB" }
    ]
  }
]

# Generate remaining seed profiles dynamically to reach total 15 high-quality records
NAMES_POOL = [
  ("Anand 'Bullet' Kumar", "Bullet", "Bengaluru City", "Vidyaranyapura PS", "WANTED", 91),
  ("Manjunath 'Goli' Swamy", "Goli", "Tumakuru", "Town PS", "WANTED", 84),
  ("Deepak 'Psycho' Rai", "Psycho", "Belagavi", "Market PS", "LOOKOUT CIRCULAR", 88),
  ("Chethan 'Don' Gowda", "Chethu", "Mandya", "Central PS", "NBW ISSUED", 79),
  ("Sharath 'Snake' Poojary", "Snake", "Udupi", "Malpe PS", "WANTED", 87),
  ("Suresh 'Blade' Mallya", "Blade Suresh", "Shivamogga", "Tunga Nagar PS", "PROCLAIMED", 93),
  ("Pradeep 'Stunner' Naik", "Stunner", "Karwar", "Town PS", "WANTED", 81),
  ("Kalyan 'King' Varma", "King", "Ballari", "Brucepet PS", "LOOKOUT CIRCULAR", 86),
  ("Ganesh 'Hammer' Reddy", "Hammer", "Kolar", "Champion Reefs PS", "NBW ISSUED", 90),
  ("Santosh 'Shadow' Patil", "Shadow", "Kalaburagi", "Brahampur PS", "WANTED", 95)
]

PHOTO_POOL = [
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=600&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=600&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=600&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&auto=format&fit=crop&q=80"
]

for idx, item in enumerate(NAMES_POOL, start=6):
  name, alias, district, station, status, risk = item
  cid = f"CRM-2026-{1000 + idx * 37}"
  photo = PHOTO_POOL[idx % len(PHOTO_POOL)]
  CRIMINALS_DATASET.append({
    "criminal_id": cid,
    "name": name,
    "alias": alias,
    "age": 28 + (idx * 2) % 20,
    "dob": f"19{80 + idx % 15}-05-12",
    "height": "5'10\" (178 cm)",
    "weight": f"{70 + idx % 20} kg",
    "blood_group": "B+",
    "identification_marks": f"Surgical mark on left shoulder, tattoo #{idx}",
    "district": district,
    "police_station": station,
    "wanted_status": status,
    "threat_level": "CRITICAL" if risk > 90 else "HIGH",
    "risk_score": risk,
    "photo_url": photo,
    "last_seen": f"{district} Highway Junction • 2026-07-24 20:00 IST",
    "address": f"No. {idx * 12}, Main Road, {district}, Karnataka",
    "crime_types": ["Armed Dacoity", "Extortion", "Criminal Intimidation"],
    "firs": [
      { "fir_number": f"FIR-2025-{8000 + idx}", "crime": "Armed Dacoity & Assault", "police_station": station, "date": "2025-03-15", "status": "Under Investigation", "officer": "Insp. K. Venkatesh" }
    ],
    "arrest_history": [
      { "year": "2021", "event": "Arrested in Local Assault Case", "badge": "ARRESTED" },
      { "year": "2024", "event": "Jumped Bail; NBW Issued", "badge": "WARRANT" },
      { "year": "2026", "event": "Matched via Live AI Facial Intelligence Stream", "badge": "FACE MATCH" }
    ],
    "associates": [
      { "name": "Vikram 'Bhai' Gowda", "relation": "Crime Syndicate Leader", "crimes": "Armed Robbery, Extortion", "photo_url": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80" }
    ],
    "vehicles": [
      { "model": "Mahindra Scorpio (Black)", "reg_no": f"KA-0{idx % 9}-M-9900", "color": "Black", "type": "SUV" }
    ],
    "weapons": [
      { "type": "Country-made Pistol 7.65mm", "caliber": "7.65mm", "status": "Active" }
    ],
    "evidence_files": [
      { "type": "cctv", "title": f"CCTV Snap #{idx} — High Street Junction", "url": photo, "date": "2026-07-18", "size": "24.1 MB" }
    ]
  })
