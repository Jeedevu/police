"""
Seed Heatmap Script — Inserts ~300 realistic demo cases covering Karnataka cities into casemaster table.
"""
import random
from datetime import datetime, timedelta, date
from sqlalchemy import text
from app.database.connection import SessionLocal, engine
from app.models.case import Case

CITIES = {
    "Bengaluru": {
        "center": (12.9716, 77.5946),
        "stations": ["Majestic PS", "Cubbon Park PS", "Indiranagar PS", "Koramangala PS", "Whitefield PS", "Yeshwanthpur PS", "Jayanagar PS", "Electronic City PS"],
        "hotspots": ["Majestic", "Cubbon Park", "Indiranagar", "Koramangala", "Whitefield", "Yeshwanthpur", "Jayanagar", "Electronic City"]
    },
    "Mysuru": {
        "center": (12.2958, 76.6394),
        "stations": ["Devaraja PS", "Lashkar PS", "Saraswathipuram PS", "Gokulam PS", "Kuvempunagar PS"],
        "hotspots": ["Devaraja Market", "Lashkar Mohalla", "Saraswathipuram", "Gokulam", "Kuvempunagar"]
    },
    "Mangaluru": {
        "center": (12.9141, 74.8560),
        "stations": ["Hampankatta PS", "Panambur PS", "Urwa PS", "Kadri PS", "Surathkal PS"],
        "hotspots": ["Hampankatta", "Panambur Port", "Urwa Market", "Kadri Hills", "Surathkal"]
    },
    "Hubballi": {
        "center": (15.3647, 75.1240),
        "stations": ["Vidyanagar PS", "Subhash Nagar PS", "Old Hubli PS", "Ashok Nagar PS"],
        "hotspots": ["Vidyanagar", "Subhash Nagar", "Old Hubli Circle", "Ashok Nagar"]
    },
    "Belagavi": {
        "center": (15.8497, 74.4977),
        "stations": ["Tilakwadi PS", "Shahapur PS", "Camp PS", "Khade Bazar PS"],
        "hotspots": ["Tilakwadi", "Shahapur", "Belagavi Camp", "Khade Bazar"]
    },
    "Shivamogga": {
        "center": (13.9299, 75.5681),
        "stations": ["Jayanagar PS", "Tunga Nagar PS", "Doddapete PS"],
        "hotspots": ["Jayanagar", "Tunga Nagar", "Doddapete Market"]
    },
    "Davangere": {
        "center": (14.4644, 75.9218),
        "stations": ["Vidyanagar PS", "Gandhi Nagar PS", "KTJ Nagar PS"],
        "hotspots": ["Vidyanagar", "Gandhi Nagar", "KTJ Nagar"]
    },
    "Kalaburagi": {
        "center": (17.3297, 76.8343),
        "stations": ["Station Bazar PS", "University PS", "Ashok Nagar PS"],
        "hotspots": ["Station Bazar", "Gulbarga University", "Ashok Nagar"]
    },
    "Ballari": {
        "center": (15.1394, 76.9214),
        "stations": ["Brucepet PS", "Cowled Bazar PS", "Gandhinagar PS"],
        "hotspots": ["Brucepet", "Cowled Bazar", "Gandhinagar Ballari"]
    },
    "Tumakuru": {
        "center": (13.3379, 77.1173),
        "stations": ["Kyathsandra PS", "Town PS", "Tilak Park PS"],
        "hotspots": ["Kyathsandra", "Tumakuru Town", "Tilak Park"]
    }
}

CRIME_TYPES = [
    "Theft", "Robbery", "Cyber Crime", "Murder", "Kidnapping",
    "Missing Person", "Drug Case", "Financial Fraud", "Vehicle Theft", "Assault"
]

STATUSES = ["Open", "Under Investigation", "Chargesheet Filed", "Closed"]

OFFICERS = [
    "Insp. Rajesh Kumar", "Insp. Anil Gowda", "Sub-Insp. Suresh Patil",
    "Insp. Vikram R.", "Sub-Insp. Maheshappa", "Insp. Priya Sharma",
    "Sub-Insp. Venkatesh H.", "Insp. Jagadeesh M.", "Insp. Santosh Nayak"
]


def seed_heatmap_data():
    db = SessionLocal()
    try:
        print("Seeding ~300 crime cases for Karnataka Heat Map...")
        current_year = 2026
        
        # Get max ID or existing count
        existing_count = db.query(Case).count()
        start_idx = existing_count + 500
        
        total = 0
        while total < 320:
            for city_name, data in CITIES.items():
                lat_c, lng_c = data["center"]
                stations = data["stations"]
                hotspots = data["hotspots"]

                num_cases_for_city = random.randint(35, 55) if city_name == "Bengaluru" else random.randint(20, 30)

                for _ in range(num_cases_for_city):
                    if total >= 320:
                        break

                    st_idx = random.randint(0, len(stations) - 1)
                    station = stations[st_idx]
                    hotspot = hotspots[st_idx]

                    offset_lat = (random.random() - 0.5) * 0.08
                    offset_lng = (random.random() - 0.5) * 0.08
                    lat = round(lat_c + offset_lat, 6)
                    lng = round(lng_c + offset_lng, 6)

                    crime = random.choice(CRIME_TYPES)
                    status = random.choice(STATUSES)
                    officer = random.choice(OFFICERS)

                    days_ago = random.randint(0, 365)
                    c_date = date.today() - timedelta(days=days_ago)
                    fir_no = f"FIR/HM/{current_year}/{start_idx + total:05d}"

                    brief = f"{crime} incident logged at {hotspot}, {city_name}. Investigating officer {officer}. Status: {status}."

                    case_obj = Case(
                        fir_number=fir_no,
                        crime_type=crime,
                        district=f"{city_name} District",
                        police_station=station,
                        case_status=status,
                        crime_date=c_date,
                        latitude=lat,
                        longitude=lng,
                        brief_facts=brief,
                    )
                    db.add(case_obj)
                    total += 1

        db.commit()
        print(f"=== SUCCESSFULLY SEEDED {total} CASMASTER HEATMAP RECORDS ===")
    except Exception as e:
        db.rollback()
        print("Error seeding heatmap data:", e)
    finally:
        db.close()


if __name__ == "__main__":
    seed_heatmap_data()
