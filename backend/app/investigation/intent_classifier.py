def classify(question: str):

    q = question.lower()

    if any(word in q for word in [
        "repeat offender",
        "habitual",
        "repeat criminal"
    ]):
        return "repeat_offenders"

    if any(word in q for word in [
        "trend",
        "statistics",
        "crime trend"
    ]):
        return "crime_trends"

    if any(word in q for word in [
        "network",
        "associate",
        "gang",
        "relationship"
    ]):
        return "criminal_network"

    if any(word in q for word in [
        "hotspot",
        "district",
        "location"
    ]):
        return "hotspots"

    return "sql"