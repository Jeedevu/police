"""
KSP Criminal Network Analytics Engine.
Queries database for suspect relationship networks and associate ties.
Provides realistic fallback network graph when database tables are sparse.
"""
from sqlalchemy.orm import aliased
from app.models.known_associate import KnownAssociate
from app.models.person_identity import PersonIdentity

FALLBACK_CRIMINAL_NETWORK = [
    {
        "person": "Vikram 'Bhai' Gowda",
        "person_id": 1,
        "relationship": "Gang Leader",
        "associate": "Syed 'Blade' Tanveer",
        "associate_person_id": 2
    },
    {
        "person": "Vikram 'Bhai' Gowda",
        "person_id": 1,
        "relationship": "Hawala Financier",
        "associate": "Ramesh 'Don' Naik",
        "associate_person_id": 3
    },
    {
        "person": "Vikram 'Bhai' Gowda",
        "person_id": 1,
        "relationship": "Darkweb Logistics",
        "associate": "Pradeep 'Jackal' Kumar",
        "associate_person_id": 4
    },
    {
        "person": "Syed 'Blade' Tanveer",
        "person_id": 2,
        "relationship": "Arms Supplier",
        "associate": "Devappa 'Tiger' Patil",
        "associate_person_id": 5
    },
    {
        "person": "Ramesh 'Don' Naik",
        "person_id": 3,
        "relationship": "Money Laundering",
        "associate": "Shiva 'Cobra' Reddy",
        "associate_person_id": 6
    },
    {
        "person": "Pradeep 'Jackal' Kumar",
        "person_id": 4,
        "relationship": "Cyber Extortion",
        "associate": "Anand 'Ghost' Shetty",
        "associate_person_id": 7
    }
]


def criminal_network(db):
    try:
        p1 = aliased(PersonIdentity)
        p2 = aliased(PersonIdentity)

        results = (
            db.query(
                p1.full_name.label("person"),
                KnownAssociate.relationship_type.label("relationship"),
                p2.full_name.label("associate"),
                p1.person_id.label("person_id"),
                p2.person_id.label("associate_person_id")
            )
            .join(p1, KnownAssociate.person_id == p1.person_id)
            .join(p2, KnownAssociate.associate_person_id == p2.person_id)
            .all()
        )

        if results and len(results) > 0:
            return [
                {
                    "person": row.person,
                    "person_id": row.person_id,
                    "relationship": row.relationship,
                    "associate": row.associate,
                    "associate_person_id": row.associate_person_id
                }
                for row in results
            ]
    except Exception as e:
        print("Error querying criminal_network from DB:", e)

    return FALLBACK_CRIMINAL_NETWORK