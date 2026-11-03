import random
import sqlite3
from pathlib import Path

DB_PATH = Path(__file__).parent / "pulmoscan.db"

first_names = [
    "Aarav", "Aditi", "Akash", "Ananya", "Arjun",
    "Diya", "Ishaan", "Kavya", "Kiran", "Meera",
    "Neha", "Rahul", "Riya", "Rohan", "Sneha",
    "Vikram", "Priya", "Varun", "Pooja", "Nikhil",
    "Sanjay", "Divya", "Manoj", "Anil", "Swati"
]

last_names = [
    "Sharma", "Patel", "Rao", "Kumar", "Reddy",
    "Naik", "Shah", "Verma", "Joshi", "Gupta",
    "Das", "Shetty", "Nair", "Iyer", "Singh",
    "Kulkarni", "Pillai", "Mehta", "Desai", "Mishra"
]

sex_options = ["Female", "Male", "Other"]

random.seed(42)

conn = sqlite3.connect(DB_PATH)

conn.execute("""
    CREATE TABLE IF NOT EXISTS patients (
        patient_id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        age INTEGER NOT NULL,
        sex TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
""")

added = 0
skipped = 0

for number in range(1, 1000):
    patient_id = f"PUM{number:03d}"

    existing = conn.execute(
        "SELECT 1 FROM patients WHERE patient_id = ?",
        (patient_id,)
    ).fetchone()

    if existing:
        skipped += 1
        continue

    name = (
        random.choice(first_names)
        + " "
        + random.choice(last_names)
    )
    age = random.randint(18, 85)
    sex = random.choice(sex_options)

    conn.execute(
        """
        INSERT INTO patients (patient_id, name, age, sex)
        VALUES (?, ?, ?, ?)
        """,
        (patient_id, name, age, sex)
    )

    added += 1

conn.commit()

total = conn.execute(
    "SELECT COUNT(*) FROM patients"
).fetchone()[0]

conn.close()

print("SAMPLE PATIENT SETUP COMPLETE")
print("New sample patients added:", added)
print("Existing IDs skipped:", skipped)
print("Total patient records in database:", total)
print("Patient ID range: PUM001 to PUM999")
print("All generated records are fictional test data.")