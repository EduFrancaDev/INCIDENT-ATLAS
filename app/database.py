"""
Gerenciamento de conexão com o banco de dados DuckDB
"""
from flask import g
import duckdb
from scripts.subir_csv_para_db import subir_csv_para_db


def obter_bd(app):
    """Obtém a conexão com o banco de dados"""
    if 'bd' not in g:
        g.bd = duckdb.connect(app.config['DATABASE'])
    return g.bd


def fechar_bd(erro=None):
    """Fecha a conexão com o banco de dados"""
    bd = g.pop('bd', None)
    if bd is not None:
        bd.close()


def inicializar_bd(app):
    """Inicializa o banco de dados e cria as tabelas"""
    bd = duckdb.connect(app.config['DATABASE'])
    
    bd.execute("""
    CREATE TABLE IF NOT EXISTS acidentes (
        id INTEGER PRIMARY KEY,
        Data TIMESTAMP,
        Pais VARCHAR(100),
        Estado VARCHAR(200),
        Setor_Industrial VARCHAR(100),
        Nivel_Acidente VARCHAR(50),
        Nivel_Acidente_Potencial VARCHAR(50),
        Genero VARCHAR(20),
        Tipo_Trabalhador VARCHAR(50),
        Risco_Critico VARCHAR(200),
        Descricao TEXT,
        Parte_Corpo VARCHAR(50)
    )
    """)
    
    resultado = bd.execute("SELECT COUNT(*) FROM acidentes").fetchall()
    if resultado[0][0] == 0:
        subir_csv_para_db(bd)
    
    bd.close()


def configurar_banco_dados(app):
    """Configura o banco de dados na aplicação Flask"""
    inicializar_bd(app)
    app.teardown_appcontext(fechar_bd)
