from sqlalchemy.orm import aliased
from app.models.known_associate import KnownAssociate
from app.models.person_identity import PersonIdentity


def criminal_network(db):
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