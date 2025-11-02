def subir_csv_para_db(db):

    result = db.execute("""
        COPY acidentes FROM 'data/IHMStefanini_industrial_safety_and_health_database_with_accidents_description.csv' 
            (DELIMITER ',', HEADER, NULL 'NA');
                """)
    print(db.execute("SELECT COUNT(*) FROM acidentes").fetchall())