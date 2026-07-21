import re


CORRECTIONS = {
    "thrift": "theft",
    "theif": "theft",
    "steeling": "theft",
    "murdur": "murder",
    "murdr": "murder",
    "mudr": "murder",
    "robery": "robbery",
    "cyberattack": "cyber crime",
    "cyber-attack": "cyber crime",
    "frauds": "fraud",
    "complaint": "complainantdetails",
    "associates": "knownassociate",
    "associate": "knownassociate",
    "offenders": "accused",
    "offender": "accused",
}


def correct_spelling(question: str) -> str:
    question = question.strip()
    q_lower = question.lower()

    for wrong, right in CORRECTIONS.items():
        q_lower = re.sub(rf"\b{wrong}\b", right, q_lower)

    return q_lower
