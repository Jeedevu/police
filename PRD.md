# KSP Crime AI

Version: 1.0

Owner:
Jeevan

---

# Product Vision

KSP Crime AI is an AI-powered Crime Investigation Assistant designed to help police officers investigate criminal cases using natural language.

The system combines PostgreSQL, FastAPI, React, AI, and investigative analytics into one intelligent platform.

The AI should behave like an experienced investigation officer instead of a chatbot.

---

# Goals

Reduce investigation time.

Provide instant answers from crime databases.

Generate intelligent SQL automatically.

Find hidden relationships between suspects.

Visualize criminal networks.

Recommend next investigation steps.

---

# Existing Tech Stack

Backend
- FastAPI
- SQLAlchemy
- PostgreSQL
- Gemini/OpenAI
- Python

Frontend
- React
- Vite
- Axios

Database
- PostgreSQL

Existing project must be extended.
Never rebuild from scratch.

---

# Existing Database

Tables

casemaster
accused
victim
complainantdetails
criminalhistory
personidentity
vehicle
phone
knownassociate
evidence
investigationofficer
district
policestation
state
crimehead
crimesubhead
casecategory
casestatusmaster
gravityoffence

No duplicate tables.

No schema recreation.

---

# Users

Police Officers

Investigation Officers

Crime Analysts

Administrators

---

# Core Modules

Case Management

AI Investigation

Natural Language Query

Evidence Management

Criminal Profiles

Relationship Analysis

Case Timeline

Analytics Dashboard

Search Engine

Administration

---

# AI Capabilities

Understand natural language.

Correct spelling mistakes.

Example

theif → theft

thrift → theft

muder → murder

cyberattack → Cyber Crime

Generate PostgreSQL SELECT queries.

Explain results.

Suggest next investigation steps.

Recommend related cases.

Find suspect relationships.

Generate investigation summaries.

---

# Functional Modules

## Dashboard

Statistics

Recent Cases

Crime Trends

Case Status

Officer Activity

AI Search

---

## Investigation

Search cases

View FIR

View complainants

View victims

View accused

View evidence

View officer

View timeline

---

## AI Investigation Assistant

Officer asks

Show all theft cases

Find repeat offenders

Show murder cases in Mysore

Find accused using same phone

Show evidence for FIR001

Find vehicles owned by accused

Return

Generated SQL

Rows

Explanation

Recommendations

---

## Criminal Profile

Identity

Photo

Address

Phones

Vehicles

Criminal History

Known Associates

Risk Score

Timeline

Evidence

---

## Network Graph

Person

↓

Vehicle

↓

Phone

↓

Associate

↓

Case

↓

Evidence

Interactive graph visualization.

---

## Similar Cases

Recommend similar crimes.

Recommend similar suspects.

Recommend similar evidence.

Recommend similar locations.

Recommend same vehicle.

Recommend same phone.

---

## Search

Name

Phone

Vehicle

Address

Crime

FIR

District

Officer

Passport

PAN

Aadhaar

---

# AI Rules

Never execute

DELETE

DROP

UPDATE

INSERT

ALTER

Only generate SELECT queries.

Validate every query.

Reject unsafe SQL.

---

# Security

Read-only database access.

SQL Injection prevention.

Prompt Injection prevention.

Input validation.

Logging.

Authentication ready.

---

# Success Metrics

Query accuracy >95%

Average response <3 seconds

Zero unsafe SQL

Fully modular architecture

Production-ready APIs