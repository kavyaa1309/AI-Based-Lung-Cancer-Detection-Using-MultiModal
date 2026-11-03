import database


def register_patient(name, age, sex):
    database.init_database()

    patient_id = database.generate_patient_id()

    conn = database.get_connection()

    conn.execute(
        """
        INSERT INTO patients (patient_id, name, age, sex)
        VALUES (?, ?, ?, ?)
        """,
        (patient_id, name.strip(), age, sex.strip())
    )

    conn.commit()
    conn.close()

    return patient_id


if __name__ == "__main__":
    name = input("Enter patient name: ").strip()
    age = int(input("Enter patient age: ").strip())
    sex = input("Enter patient sex: ").strip()

    patient_id = register_patient(name, age, sex)

    print()
    print("PATIENT REGISTERED SUCCESSFULLY")
    print("Patient ID:", patient_id)
    print("Name:", name)
    print("Age:", age)
    print("Sex:", sex)