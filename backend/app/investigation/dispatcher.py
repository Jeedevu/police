from app.investigation.intent_classifier import classify

from app.analytics.repeat_offenders import repeat_offenders
from app.analytics.crime_trends import crime_trends
from app.analytics.criminal_network import criminal_network
from app.analytics.hotspots import crime_hotspots


def dispatch(question, db):

    intent = classify(question)

    if intent == "repeat_offenders":
        return repeat_offenders(db)

    if intent == "crime_trends":
        return crime_trends(db)

    if intent == "criminal_network":
        return criminal_network(db)

    if intent == "hotspots":
        return crime_hotspots(db)

    return None