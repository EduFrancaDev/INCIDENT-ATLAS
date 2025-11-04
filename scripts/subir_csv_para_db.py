"""
Script para importar dados do CSV para o banco DuckDB
Utiliza o comando COPY nativo do DuckDB para importação eficiente
"""

def subir_csv_para_db(db):
    """
    Importa dados do CSV para a tabela acidentes no banco DuckDB
    
    Args:
        db: Conexão ativa com o banco de dados DuckDB
    
    Returns:
        None (imprime contagem de registros importados)
    """
    # Executar importação do CSV usando COPY do DuckDB
    # DELIMITER: especifica vírgula como separador
    # HEADER: indica que primeira linha contém nomes das colunas
    # NULL 'NA': trata string 'NA' como valor NULL
    result = db.execute("""
        COPY acidentes FROM 'data/IHMStefanini_industrial_safety_and_health_database_with_accidents_description.csv' 
            (DELIMITER ',', HEADER, NULL 'NA');
                """)
    
    # Imprimir contagem total de registros importados
    print(db.execute("SELECT COUNT(*) FROM acidentes").fetchall())