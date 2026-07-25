"""
KSP AI Criminal Face Intelligence & Simulated Facial Recognition Router.
Provides 15 rich seeded criminal dossiers, AI face-search simulation with Gemini summary,
and Catalyst File Store evidence metadata.
"""
import logging
import random
import time
from typing import Optional, List, Dict, Any

from fastapi import APIRouter, File, UploadFile, Form, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_officer
from app.auth.models import Officer
from app.database.connection import get_db
from app.core.settings import settings

logger = logging.getLogger(__name__)

router = APIRouter(tags=["AI Face Search"])

# ── 15 RICH SEEDED CRIMINALS DATASET ─────────────────────────────────────────

SEEDED_CRIMINALS: List[Dict[str, Any]] = [
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
            {
                "fir_number": "FIR-2024-8821",
                "crime": "Armed Dacoity & Robbery",
                "police_station": "Cubbon Park PS",
                "date": "2024-11-12",
                "status": "Under Investigation",
                "officer": "Insp. Jeevan Kumar"
            },
            {
                "fir_number": "FIR-2023-4102",
                "crime": "Extortion & Criminal Intimidation",
                "police_station": "Kalasipalya PS",
                "date": "2023-08-04",
                "status": "Chargesheet Filed",
                "officer": "Insp. R. Seshadri"
            },
            {
                "fir_number": "FIR-2021-1904",
                "crime": "Possession of Illegal Arms (Arms Act Sec 25)",
                "police_station": "Upparpet PS",
                "date": "2021-03-19",
                "status": "Bail Jumped",
                "officer": "Sub-Insp. M. Nagesh"
            }
        ],
        "arrest_history": [
            {"year": "2019", "event": "Arrested in Commercial Street Gold Shop Robbery Case", "badge": "ARRESTED"},
            {"year": "2020", "event": "Released on conditional bail by Session Court", "badge": "BAIL"},
            {"year": "2021", "event": "Implicated in Illegal Firearms Trafficking Racket", "badge": "CHARGED"},
            {"year": "2023", "event": "Absconded during trial hearing; NBW issued", "badge": "WARRANT"},
            {"year": "2024", "event": "Declared Proclaimed Offender by High Court", "badge": "PROCLAIMED"},
            {"year": "2026", "event": "Matched via Live AI Facial Intelligence Stream", "badge": "MATCHED"}
        ],
        "associates": [
            {
                "name": "Syed 'Blade' Tanveer",
                "relation": "Primary Enforcer / Hitman",
                "crimes": "Assault, Extortion",
                "photo_url": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80"
            },
            {
                "name": "Ramesh 'Don' Naik",
                "relation": "Hawala Operator & Financier",
                "crimes": "Money Laundering, Fraud",
                "photo_url": "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&auto=format&fit=crop&q=80"
            },
            {
                "name": "Kiran 'Phantom' Das",
                "relation": "Safehouse Supplier & Logistics",
                "crimes": "Sheltering Fugitives",
                "photo_url": "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=300&auto=format&fit=crop&q=80"
            }
        ],
        "vehicles": [
            {"model": "Mahindra Thar 4x4 (Black)", "reg_no": "KA-01-MJ-9901", "color": "Midnight Black", "type": "SUV"},
            {"model": "KTM Duke 390 (Modified)", "reg_no": "KA-04-EV-4412", "color": "Orange / Black", "type": "Motorcycle"}
        ],
        "weapons": [
            {"type": "Country-made 7.65mm Pistol", "caliber": "7.65mm", "status": "Active / Unrecovered"},
            {"type": "Machete / Tactical Blade", "caliber": "N/A", "status": "Seized in 2021"}
        ],
        "evidence_files": [
            {
                "type": "cctv",
                "title": "CCTV Footage — MG Road ATM Heist",
                "url": "https://images.unsplash.com/photo-1557597774-9d273605dfa9?w=600&auto=format&fit=crop&q=80",
                "date": "2026-07-15",
                "size": "42.8 MB (Catalyst File Store)"
            },
            {
                "type": "video",
                "title": "Traffic Cam Video Dump — Silk Board Junction",
                "url": "https://images.unsplash.com/photo-1508873696983-2df515122519?w=600&auto=format&fit=crop&q=80",
                "date": "2026-07-20",
                "size": "128.4 MB (Catalyst File Store)"
            },
            {
                "type": "fir_pdf",
                "title": "Certified FIR Dossier Copy #8821",
                "url": "https://images.unsplash.com/photo-1568667256549-094345857637?w=600&auto=format&fit=crop&q=80",
                "date": "2024-11-12",
                "size": "3.1 MB (PDF File Store)"
            },
            {
                "type": "weapon",
                "title": "Seized 7.65mm Pistol Forensic Snap",
                "url": "https://images.unsplash.com/photo-1595590424283-b8f17842773f?w=600&auto=format&fit=crop&q=80",
                "date": "2021-03-20",
                "size": "14.2 MB (HD Photo Store)"
            },
            {
                "type": "vehicle",
                "title": "Confiscated Mahindra Thar Inspection Photo",
                "url": "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=600&auto=format&fit=crop&q=80",
                "date": "2023-09-10",
                "size": "8.7 MB (High-Res Snap)"
            },
            {
                "type": "phone_extraction",
                "title": "UFED Cellebrite Phone Call Logs & WhatsApp Dump",
                "url": "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=600&auto=format&fit=crop&q=80",
                "date": "2026-07-02",
                "size": "890.0 MB (Forensic Dump)"
            }
        ]
    },
    {
        "criminal_id": "CRM-2026-8802",
        "name": "Syed 'Blade' Tanveer",
        "alias": "Blade Tanveer",
        "age": 34,
        "dob": "1992-09-21",
        "height": "5'9\" (175 cm)",
        "weight": "74 kg",
        "blood_group": "O+",
        "identification_marks": "Deep blade scar across right neck, cross tattoo on chest",
        "district": "Mysuru City",
        "police_station": "Udayagiri PS",
        "wanted_status": "PROCLAIMED OFFENDER",
        "threat_level": "HIGH",
        "risk_score": 92,
        "photo_url": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600&auto=format&fit=crop&q=80",
        "last_seen": "Devaraja Market, Mysuru • 2026-07-21 18:30 IST",
        "address": "House #104, Rajiv Nagar, Mysuru, Karnataka",
        "crime_types": ["Assault", "Extortion", "Homicide Attempt", "Weapon Offenses"],
        "firs": [
            {
                "fir_number": "FIR-2025-1029",
                "crime": "Attempted Murder (IPC 307)",
                "police_station": "Udayagiri PS",
                "date": "2025-02-14",
                "status": "Investigation",
                "officer": "Insp. M. Farooq"
            },
            {
                "fir_number": "FIR-2023-7741",
                "crime": "Extortion from Local Merchants",
                "police_station": "Nazarbad PS",
                "date": "2023-11-20",
                "status": "Chargesheet Filed",
                "officer": "Sub-Insp. S. Patil"
            },
            {
                "fir_number": "FIR-2020-0912",
                "crime": "Grievous Hurt with Deadly Weapon",
                "police_station": "Mandi PS",
                "date": "2020-06-01",
                "status": "Under Trial",
                "officer": "Insp. K. Gowda"
            }
        ],
        "arrest_history": [
            {"year": "2020", "event": "Arrested following street violence in Mandi Mohalla", "badge": "ARRESTED"},
            {"year": "2022", "event": "Granted conditional bail with weekly police check-in", "badge": "BAIL"},
            {"year": "2024", "event": "Involved in gang clash near Mysuru Ring Road", "badge": "CHARGED"},
            {"year": "2025", "event": "Fled Mysuru jurisdiction; declared absconding", "badge": "WARRANT"}
        ],
        "associates": [
            {
                "name": "Vikram 'Bhai' Gowda",
                "relation": "Gang Syndicate Leader",
                "crimes": "Armed Robbery",
                "photo_url": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80"
            },
            {
                "name": "Imran 'Chotta' Khan",
                "relation": "Street Weapons Dealer",
                "crimes": "Arms Trafficking",
                "photo_url": "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&auto=format&fit=crop&q=80"
            }
        ],
        "vehicles": [
            {"model": "Yamaha RX100 (Black)", "reg_no": "KA-09-EB-1209", "color": "Jet Black", "type": "Motorcycle"}
        ],
        "weapons": [
            {"type": "Double-edged Tactical Dagger", "caliber": "N/A", "status": "Active / Concealed"}
        ],
        "evidence_files": [
            {
                "type": "cctv",
                "title": "Shop Cam Frame — Udayagiri Extortion Incident",
                "url": "https://images.unsplash.com/photo-1557597774-9d273605dfa9?w=600&auto=format&fit=crop&q=80",
                "date": "2025-02-14",
                "size": "28.4 MB (Catalyst File Store)"
            },
            {
                "type": "fir_pdf",
                "title": "FIR Copy #1029 — Attempted Murder",
                "url": "https://images.unsplash.com/photo-1568667256549-094345857637?w=600&auto=format&fit=crop&q=80",
                "date": "2025-02-14",
                "size": "2.8 MB (PDF File Store)"
            }
        ]
    },
    {
        "criminal_id": "CRM-2026-8803",
        "name": "Ramesh 'Don' Naik",
        "alias": "Bangalore Don",
        "age": 46,
        "dob": "1980-01-10",
        "height": "5'10\" (178 cm)",
        "weight": "89 kg",
        "blood_group": "A+",
        "identification_marks": "Gold tooth top-right, surgical scar on left shoulder",
        "district": "Bengaluru City",
        "police_station": "Commercial Street PS",
        "wanted_status": "ACTIVE SURVEILLANCE",
        "threat_level": "HIGH",
        "risk_score": 94,
        "photo_url": "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=600&auto=format&fit=crop&q=80",
        "last_seen": "UB City Commercial Complex, Bengaluru • 2026-07-23 14:15 IST",
        "address": "Villa #12, Palm Meadows, Whitefield, Bengaluru, Karnataka",
        "crime_types": ["Money Laundering", "Financial Fraud", "Hawala Racket", "Extortion Syndicate"],
        "firs": [
            {
                "fir_number": "FIR-2025-9901",
                "crime": "Hawala Transaction & Tax Evasion (₹140 Crore)",
                "police_station": "Commercial Street PS",
                "date": "2025-05-19",
                "status": "Under Investigation",
                "officer": "ACP P. Srinivas"
            },
            {
                "fir_number": "FIR-2022-3310",
                "crime": "Cheating & Real Estate Land Grab",
                "police_station": "Frazer Town PS",
                "date": "2022-09-08",
                "status": "Chargesheet Filed",
                "officer": "Insp. B. Naidu"
            }
        ],
        "arrest_history": [
            {"year": "2021", "event": "Questioned by Enforcement Directorate in Hawala Case", "badge": "INVESTIGATED"},
            {"year": "2023", "event": "Obtained anticipatory bail from Sessions Court", "badge": "BAIL"},
            {"year": "2025", "event": "Lookout circular issued at HAL & Bengaluru Airports", "badge": "LOOKOUT"}
        ],
        "associates": [
            {
                "name": "Mohammed 'Hawala' Zakir",
                "relation": "Crypto & Foreign Exchange Operative",
                "crimes": "Cyber Money Laundering",
                "photo_url": "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&auto=format&fit=crop&q=80"
            }
        ],
        "vehicles": [
            {"model": "Mercedes-Benz S-Class (Black)", "reg_no": "KA-03-ND-0001", "color": "Obsidian Black", "type": "Luxury Sedan"}
        ],
        "weapons": [
            {"type": "Licensed Glock 17 9mm (License Cancelled)", "caliber": "9mm", "status": "Impounded"}
        ],
        "evidence_files": [
            {
                "type": "phone_extraction",
                "title": "Encrypted WhatsApp & Telegram Chat Logs Dump",
                "url": "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=600&auto=format&fit=crop&q=80",
                "date": "2025-05-20",
                "size": "1.2 GB (Catalyst File Store)"
            }
        ]
    },
    {
        "criminal_id": "CRM-2026-8804",
        "name": "Pradeep 'Jackal' Kumar",
        "alias": "Jackal / Cyber Phantom",
        "age": 31,
        "dob": "1995-11-04",
        "height": "5'8\" (173 cm)",
        "weight": "68 kg",
        "blood_group": "AB+",
        "identification_marks": "Glasses, birthmark on neck",
        "district": "Mangaluru City",
        "police_station": "Panambur PS",
        "wanted_status": "WANTED - INTERPOL RED CORNER",
        "threat_level": "EXTREME",
        "risk_score": 98,
        "photo_url": "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=600&auto=format&fit=crop&q=80",
        "last_seen": "Surathkal Beach Road, Mangaluru • 2026-07-24 02:10 IST",
        "address": "Flat 302, Sea View Apartments, Panambur, Mangaluru, Karnataka",
        "crime_types": ["Cyber Extortion", "Ransomware Attack", "Banking Heist", "Identity Theft"],
        "firs": [
            {
                "fir_number": "FIR-2026-0112",
                "crime": "State Cooperative Bank Ransomware Attack",
                "police_station": "Cyber Crime PS Mangaluru",
                "date": "2026-01-18",
                "status": "Active Investigation",
                "officer": "Insp. V. Prabhu"
            }
        ],
        "arrest_history": [
            {"year": "2022", "event": "Arrested in International Credit Card Cloning Case", "badge": "ARRESTED"},
            {"year": "2024", "event": "Bail Granted; fled India via illegal maritime route", "badge": "FUGITIVE"}
        ],
        "associates": [
            {"name": "Anand 'Ghost' Shetty", "relation": "Darkweb Hacker Partner", "crimes": "Ransomware", "photo_url": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80"}
        ],
        "vehicles": [
            {"model": "BMW M3 (White)", "reg_no": "KA-19-P-7007", "color": "Alpine White", "type": "Sedan"}
        ],
        "weapons": [
            {"type": "Cyber Toolkit / Custom Hardware Sniffer", "caliber": "N/A", "status": "Active"}
        ],
        "evidence_files": [
            {
                "type": "phone_extraction",
                "title": "Darkweb Crypto Wallet Ledger & IP Traces",
                "url": "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=600&auto=format&fit=crop&q=80",
                "date": "2026-01-19",
                "size": "450 MB (Darknet Dump)"
            }
        ]
    },
    {
        "criminal_id": "CRM-2026-8805",
        "name": "Devappa 'Tiger' Patil",
        "alias": "Tiger Dev",
        "age": 42,
        "dob": "1984-06-18",
        "height": "6'1\" (185 cm)",
        "weight": "95 kg",
        "blood_group": "O-",
        "identification_marks": "Tiger head tattoo on back, missing right pinky tip",
        "district": "Belagavi",
        "police_station": "Market PS",
        "wanted_status": "ABSCONDING",
        "threat_level": "CRITICAL",
        "risk_score": 95,
        "photo_url": "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=600&auto=format&fit=crop&q=80",
        "last_seen": "Belagavi Border Checkpost • 2026-07-23 23:10 IST",
        "address": "Patil Farmhouse, Khanapur Road, Belagavi, Karnataka",
        "crime_types": ["Interstate Smuggling", "Highway Dacoity", "Arms Trafficking"],
        "firs": [
            {
                "fir_number": "FIR-2025-4490",
                "crime": "Highway Truck Hijacking & Goods Loot",
                "police_station": "Market PS Belagavi",
                "date": "2025-08-30",
                "status": "Under Investigation",
                "officer": "Insp. S. Kulkarni"
            }
        ],
        "arrest_history": [
            {"year": "2018", "event": "Convicted in Highway Robbery case (5 Yrs Prison)", "badge": "CONVICTED"},
            {"year": "2023", "event": "Released after serving sentence; resumed syndicate ops", "badge": "RELEASED"}
        ],
        "associates": [
            {"name": "Ganesh 'Bullet' Hegde", "relation": "Highway Scout", "crimes": "Hijacking", "photo_url": "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&auto=format&fit=crop&q=80"}
        ],
        "vehicles": [
            {"model": "Tata Xenon Pickup Truck", "reg_no": "KA-22-T-4512", "color": "Dark Blue", "type": "Truck"}
        ],
        "weapons": [
            {"type": "Double-barrel Shotgun (12 gauge)", "caliber": "12 gauge", "status": "Active"}
        ],
        "evidence_files": [
            {
                "type": "cctv",
                "title": "Toll Plaza CCTV Recording — Belagavi Highway",
                "url": "https://images.unsplash.com/photo-1557597774-9d273605dfa9?w=600&auto=format&fit=crop&q=80",
                "date": "2025-08-30",
                "size": "65 MB (Video Capture)"
            }
        ]
    }
]

# Generate remaining 10 Seeded Criminals dynamically to guarantee 15 total complete dossiers
names_pool = [
    ("Shiva 'Cobra' Reddy", "Reddy Cobra", 39, "Kalaburagi", "Station Bazar PS", "Narcotics Smuggling"),
    ("Anand 'Ghost' Shetty", "Ghost Shetty", 35, "Shivamogga", "Tunga Nagar PS", "Contract Killing"),
    ("Mohammed 'Hawala' Zakir", "Zakir Hawala", 41, "Ballari", "Cowlet Bazar PS", "Crypto Money Laundering"),
    ("Kiran 'Phantom' Das", "Phantom", 33, "Davangere", "KTJ Nagar PS", "Illegal Arms & Ammunition"),
    ("Vijay 'Sharp' Mallya", "Sharp Vijay", 44, "Tumakuru", "Jayanagar PS", "Bank Syndicate Fraud"),
    ("Ragu 'Viper' Rai", "Viper", 37, "Hubballi-Dharwad", "Suburban PS", "Extortion & Kidnapping"),
    ("Ganesh 'Bullet' Hegde", "Bullet Hegde", 36, "Belagavi", "Khade Bazar PS", "Vehicle Theft Racket"),
    ("Suresh 'Shadow' Rao", "Shadow Rao", 40, "Mysuru City", "Vidyaranyapuram PS", "Land Grab Syndicate"),
    ("Dinesh 'Hammer' Kurup", "Hammer Dinesh", 45, "Bengaluru City", "Seshadripuram PS", "Cyber Blackmail & Fraud"),
    ("Santosh 'Dacoit' Poojary", "Dacoit Santosh", 38, "Mangaluru City", "Ullal PS", "Coastal Smuggling Racket")
]

for idx, (name, alias, age, dist, ps, crime) in enumerate(names_pool, start=6):
    SEEDED_CRIMINALS.append({
        "criminal_id": f"CRM-2026-88{idx:02d}",
        "name": name,
        "alias": alias,
        "age": age,
        "dob": f"{1985 + (idx % 10)}-0{1 + (idx % 8)}-1{idx % 9}",
        "height": f"5'{8 + (idx % 4)}\" ({170 + idx} cm)",
        "weight": f"{70 + idx * 2} kg",
        "blood_group": ["A+", "B+", "O+", "AB+"][idx % 4],
        "identification_marks": f"Identification mark #{idx}: Scar on hand, tattoo on forearm",
        "district": dist,
        "police_station": ps,
        "wanted_status": "WANTED - INTERPOL RED CORNER" if idx % 2 == 0 else "PROCLAIMED OFFENDER",
        "threat_level": "CRITICAL" if idx % 3 == 0 else "HIGH",
        "risk_score": 90 + (idx % 9),
        "photo_url": f"https://images.unsplash.com/photo-{1500000000000 + idx * 100000}?w=600&auto=format&fit=crop&q=80" if idx % 2 == 0 else "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&auto=format&fit=crop&q=80",
        "last_seen": f"{dist} Central Junction • 2026-07-24 10:00 IST",
        "address": f"Building #{idx * 12}, Main Road, {dist}, Karnataka",
        "crime_types": [crime, "Criminal Conspiracy", "Extortion"],
        "firs": [
            {
                "fir_number": f"FIR-2025-90{idx}",
                "crime": crime,
                "police_station": ps,
                "date": f"2025-0{1 + (idx % 8)}-15",
                "status": "Under Investigation",
                "officer": "Insp. K. R. Sharma"
            }
        ],
        "arrest_history": [
            {"year": "2021", "event": "Arrested and booked under KCOCA Act", "badge": "ARRESTED"},
            {"year": "2024", "event": "Fled jurisdiction during transport; warrant issued", "badge": "WARRANT"}
        ],
        "associates": [
            {"name": "Vikram 'Bhai' Gowda", "relation": "Syed Network Associate", "crimes": "Extortion", "photo_url": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80"}
        ],
        "vehicles": [
            {"model": "Toyota Fortuner 4x4", "reg_no": f"KA-0{idx}-EX-{1000+idx}", "color": "Pearl White", "type": "SUV"}
        ],
        "weapons": [
            {"type": "9mm Semi-Automatic Pistol", "caliber": "9mm", "status": "Active / Unrecovered"}
        ],
        "evidence_files": [
            {
                "type": "cctv",
                "title": f"Surveillance Clip — {dist} Incident",
                "url": "https://images.unsplash.com/photo-1557597774-9d273605dfa9?w=600&auto=format&fit=crop&q=80",
                "date": "2026-07-01",
                "size": "34.5 MB (Catalyst File Store)"
            },
            {
                "type": "fir_pdf",
                "title": f"Certified FIR Copy #{idx}",
                "url": "https://images.unsplash.com/photo-1568667256549-094345857637?w=600&auto=format&fit=crop&q=80",
                "date": "2025-04-10",
                "size": "2.5 MB (PDF File Store)"
            }
        ]
    })


# ── AI SUMMARY GENERATOR WITH GEMINI ─────────────────────────────────────────

def generate_ai_investigation_report(criminal: Dict[str, Any]) -> Dict[str, str]:
    """
    Calls Google Gemini to generate a professional police investigation report
    for the matched criminal profile.
    Fallback to detailed template if Gemini is offline/unconfigured.
    """
    try:
        if settings.effective_gemini_key:
            from app.ai.providers.gemini_provider import GeminiProvider
            provider = GeminiProvider(api_key=settings.effective_gemini_key, model=settings.GEMINI_MODEL)
            prompt = f"""
Generate a highly detailed, realistic police intelligence report for suspect:
Name: {criminal['name']} (Alias: {criminal['alias']})
ID: {criminal['criminal_id']}
District: {criminal['district']} (Station: {criminal['police_station']})
Status: {criminal['wanted_status']}
Threat Level: {criminal['threat_level']}
Risk Score: {criminal['risk_score']}%
Crime Types: {', '.join(criminal['crime_types'])}

Provide response formatted strictly in JSON format with keys:
"summary", "behavior_pattern", "crime_trends", "next_location", "recommended_actions", "officer_notes".
"""
            raw_res = provider.ask(prompt)
            # Simple clean up if json formatted
            import json
            clean_str = raw_res.strip()
            if "```json" in clean_str:
                clean_str = clean_str.split("```json")[1].split("```")[0].strip()
            elif "```" in clean_str:
                clean_str = clean_str.split("```")[1].split("```")[0].strip()
            
            parsed = json.loads(clean_str)
            return {
                "summary": parsed.get("summary", ""),
                "behavior_pattern": parsed.get("behavior_pattern", ""),
                "crime_trends": parsed.get("crime_trends", ""),
                "next_location": parsed.get("next_location", ""),
                "recommended_actions": parsed.get("recommended_actions", ""),
                "officer_notes": parsed.get("officer_notes", "")
            }
    except Exception as e:
        logger.warning(f"Gemini AI report generation failed (using intelligence fallback): {e}")

    # Fallback Intelligence Report
    c_name = criminal["name"]
    c_dist = criminal["district"]
    c_crimes = ", ".join(criminal["crime_types"])
    return {
        "summary": f"{c_name} is a high-priority syndicate operative operating across {c_dist}. Intelligence indicates active involvement in {c_crimes}. Multiple active warrants exist across Karnataka State.",
        "behavior_pattern": "Operates primarily during late evening hours utilizing stolen high-speed vehicles. Known to rotate safehouses every 48 hours to evade cell tower triangulation and live CCTV surveillance.",
        "crime_trends": f"Specializes in organized {c_crimes}. Uses encrypted messaging platforms and local hawala channels for funding syndicate operations.",
        "next_location": f"Highest probability hideouts: Border districts surrounding {c_dist}, highway motels near major transport corridors, and known associate safehouses.",
        "recommended_actions": "1. Issue immediate statewide Lookout Circular (LOC).\n2. Deploy Special Tactical Unit (STU) to last reported GPS coordinates.\n3. Execute live cell tower IMEI surveillance and intercept associate communications.",
        "officer_notes": f"CONFIDENTIAL — Suspect is considered armed & dangerous. Exercise extreme caution during tactical interception."
    }


# ── API ENDPOINTS ──────────────────────────────────────────────────────────────

@router.get("/api/ai/face-criminals")
def get_all_criminals():
    """Return all 15 seeded criminal profiles."""
    return {"status": "success", "criminals": SEEDED_CRIMINALS, "total": len(SEEDED_CRIMINALS)}


@router.post("/api/ai/face-search")
async def face_search(
    image: Optional[UploadFile] = File(None),
    criminal_id: Optional[str] = Form(None),
    officer: Optional[Officer] = Depends(get_current_officer)
):
    """
    Simulated AI Facial Recognition Search Endpoint:
    Inputs: uploaded image file or criminal_id override.
    Outputs: Matched criminal dossier, confidence score (94%-99%), Gemini AI report, risk rating.
    """
    # Select criminal profile based on input filename/id or random seed
    selected_criminal = None
    if criminal_id:
        selected_criminal = next((c for c in SEEDED_CRIMINALS if c["criminal_id"] == criminal_id), None)
    
    if not selected_criminal and image and image.filename:
        fn = image.filename.lower()
        # Hash filename to select deterministically or pick index
        idx = sum(ord(char) for char in fn) % len(SEEDED_CRIMINALS)
        selected_criminal = SEEDED_CRIMINALS[idx]
    
    if not selected_criminal:
        selected_criminal = SEEDED_CRIMINALS[0] # Default to Vikram 'Bhai' Gowda

    confidence = round(random.uniform(94.8, 98.9), 1)
    risk_level = selected_criminal["threat_level"]

    # Generate Gemini AI Report
    ai_report = generate_ai_investigation_report(selected_criminal)

    return {
        "match": True,
        "confidence": confidence,
        "risk": risk_level,
        "criminal": selected_criminal,
        "ai_report": ai_report,
        "summary": ai_report["summary"],
        "scanned_timestamp": time.strftime("%Y-%m-%d %H:%M:%S IST"),
        "search_engine": "KSP Biometric Neural Engine v4.2 (512-D Embedding Match)"
    }
