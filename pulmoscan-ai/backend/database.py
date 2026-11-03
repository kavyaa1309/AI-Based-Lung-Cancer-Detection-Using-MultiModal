import sqlite3
import re
from pathlib import Path

DB_PATH = Path(__file__).parent / "pulmoscan.db"


def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_database():
    conn = get_connection()

    conn.execute("""
        CREATE TABLE IF NOT EXISTS patients (
            patient_id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            age INTEGER NOT NULL,
            sex TEXT NOT NULL,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
    """)

    conn.execute("""
        CREATE TABLE IF NOT EXISTS analyses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            patient_id TEXT NOT NULL,
            label TEXT NOT NULL,
            cancer_probability REAL,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (patient_id) REFERENCES patients(patient_id)
        )
    """)

    conn.commit()
    conn.close()


def validate_patient_id(patient_id):
    patient_id = patient_id.strip().upper()
    return bool(re.fullmatch(r"PUM\d{3}", patient_id))


def generate_patient_id():
    conn = get_connection()

    row = conn.execute("""
        SELECT patient_id
        FROM patients
        WHERE patient_id LIKE 'PUM%'
        ORDER BY patient_id DESC
        LIMIT 1
    """).fetchone()

    if row is None:
        next_number = 1
    else:
        next_number = int(row["patient_id"][3:]) + 1

    if next_number > 999:
        conn.close()
        raise ValueError("Maximum of 999 patients reached.")

    patient_id = f"PUM{next_number:03d}"

    conn.close()
    return patient_id
def verify_patient(patient_id, name, age, sex):
    patient_id = patient_id.strip().upper()
    name = name.strip()

    if not validate_patient_id(patient_id):
        return None

    conn = get_connection()

    patient = conn.execute(
        """
        SELECT patient_id, name, age, sex
        FROM patients
        WHERE patient_id = ?
        """,
        (patient_id,)
    ).fetchone()

    conn.close()

    if patient is None:
        return None

    if (
        patient["name"].strip().lower() != name.lower()
        or int(patient["age"]) != int(age)
        or patient["sex"].strip().lower() != sex.strip().lower()
    ):
        return None

    return dict(patient)