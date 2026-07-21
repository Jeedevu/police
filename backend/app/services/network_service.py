from sqlalchemy.orm import Session
from app.models.person_identity import PersonIdentity
from app.models.vehicle import Vehicle
from app.models.phone import Phone
from app.models.known_associate import KnownAssociate
from app.models.criminal_history import CriminalHistory
from app.models.case import Case
from app.models.accused import Accused
from app.models.victim import Victim
from app.models.evidence import Evidence


def get_person_network(db: Session, person_id: int):
    # Fetch core person identity
    person = db.query(PersonIdentity).filter(PersonIdentity.person_id == person_id).first()
    if not person:
        return {"nodes": [], "edges": []}

    nodes = []
    edges = []
    visited_nodes = set()

    def add_node(node_id, label, node_type, properties=None):
        if node_id in visited_nodes:
            return
        visited_nodes.add(node_id)
        nodes.append({
            "id": node_id,
            "label": label,
            "type": node_type,
            "properties": properties or {}
        })

    def add_edge(source, target, label):
        edge_id = f"edge-{source}-{target}-{label.replace(' ', '_').lower()}"
        edges.append({
            "id": edge_id,
            "source": source,
            "target": target,
            "label": label
        })

    # 1. Add center person node
    person_node_id = f"person-{person.person_id}"
    add_node(
        person_node_id,
        person.full_name,
        "person",
        {
            "full_name": person.full_name,
            "risk_score": person.risk_score,
            "mobile": person.mobile,
            "address": person.address
        }
    )

    # 2. Get vehicles owned by this person
    vehicles = db.query(Vehicle).filter(Vehicle.person_id == person_id).all()
    for v in vehicles:
        v_node_id = f"vehicle-{v.vehicle_id}"
        add_node(
            v_node_id,
            v.registration_number,
            "vehicle",
            {
                "registration_number": v.registration_number,
                "vehicle_type": v.vehicle_type,
                "model": v.model,
                "manufacturer": v.manufacturer,
                "color": v.color
            }
        )
        add_edge(person_node_id, v_node_id, "Owns")

    # 3. Get phones owned by this person
    phones = db.query(Phone).filter(Phone.person_id == person_id).all()
    for ph in phones:
        ph_node_id = f"phone-{ph.phone_id}"
        add_node(
            ph_node_id,
            ph.mobile,
            "phone",
            {
                "mobile": ph.mobile,
                "imei": ph.imei,
                "provider": ph.provider
            }
        )
        add_edge(person_node_id, ph_node_id, "Owns")

    # 4. Get known associates
    associates = db.query(KnownAssociate).filter(
        (KnownAssociate.person_id == person_id) | (KnownAssociate.associate_person_id == person_id)
    ).all()
    for assoc in associates:
        # Find the other person
        other_id = assoc.associate_person_id if assoc.person_id == person_id else assoc.person_id
        other_person = db.query(PersonIdentity).filter(PersonIdentity.person_id == other_id).first()
        if other_person:
            other_node_id = f"person-{other_person.person_id}"
            add_node(
                other_node_id,
                other_person.full_name,
                "person",
                {
                    "full_name": other_person.full_name,
                    "risk_score": other_person.risk_score,
                    "mobile": other_person.mobile,
                    "address": other_person.address
                }
            )
            add_edge(person_node_id, other_node_id, assoc.relationship_type or "Associated With")

    # 5. Get cases linked to the person (through criminal history or direct accused/victim names)
    cases_set = set()

    # Query criminal history
    histories = db.query(CriminalHistory).filter(CriminalHistory.person_id == person_id).all()
    for h in histories:
        if h.case_id:
            cases_set.add(h.case_id)

    # Query accused matching name
    accused_records = db.query(Accused).filter(Accused.name == person.full_name).all()
    for acc in accused_records:
        if acc.case_id:
            cases_set.add(acc.case_id)

    # Query victim matching name
    victim_records = db.query(Victim).filter(Victim.name == person.full_name).all()
    for vic in victim_records:
        if vic.case_id:
            cases_set.add(vic.case_id)

    # Fetch details for cases
    for case_id in cases_set:
        case = db.query(Case).filter(Case.case_id == case_id).first()
        if case:
            case_node_id = f"case-{case.case_id}"
            add_node(
                case_node_id,
                case.fir_number,
                "case",
                {
                    "fir_number": case.fir_number,
                    "crime_type": case.crime_type,
                    "district": case.district,
                    "case_status": case.case_status,
                    "crime_date": case.crime_date.isoformat() if case.crime_date else None
                }
            )

            # Determine relationship type
            is_accused = any(acc.case_id == case_id for acc in accused_records) or any(h.case_id == case_id for h in histories)
            is_victim = any(vic.case_id == case_id for vic in victim_records)

            if is_accused:
                add_edge(person_node_id, case_node_id, "Accused In")
            elif is_victim:
                add_edge(person_node_id, case_node_id, "Victim Of")
            else:
                add_edge(person_node_id, case_node_id, "Associated With")

            # Get evidence linked to this case
            evidences = db.query(Evidence).filter(Evidence.case_id == case_id).all()
            for ev in evidences:
                ev_node_id = f"evidence-{ev.evidence_id}"
                add_node(
                    ev_node_id,
                    ev.evidence_type,
                    "evidence",
                    {
                        "evidence_type": ev.evidence_type,
                        "description": ev.description,
                        "file_url": ev.file_url
                    }
                )
                add_edge(case_node_id, ev_node_id, "Evidence In")

    return {"nodes": nodes, "edges": edges}
