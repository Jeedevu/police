from app.analytics.repeat_offenders import repeat_offenders
from app.analytics.crime_trends import crime_trends
from app.analytics.criminal_network import criminal_network


def investigate(question: str, db):

    q = question.lower()

    if "repeat offender" in q:
        return repeat_offenders(db)

    elif "trend" in q or "crime trend" in q:
        return crime_trends(db)

    elif "network" in q or "associate" in q:
        return criminal_network(db)

    return None