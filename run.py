from flask import Flask, render_template, g
import duckdb
from scripts.subir_csv_para_db import subir_csv_para_db

app = Flask(__name__, template_folder='template', static_folder='static')

app.config['DATABASE'] = 'acidentes.duckdb'

def get_db():
    """Obtém a conexão com o banco de dados"""
    if 'db' not in g:
        g.db = duckdb.connect(app.config['DATABASE'])
    return g.db

def init_db():
    """Inicializa o banco de dados"""
    db = duckdb.connect(app.config['DATABASE'])
    db.execute("""
    CREATE TABLE IF NOT EXISTS acidentes (
        id INTEGER PRIMARY KEY,
        Data DATE,
        Countries VARCHAR(100),
        Local VARCHAR(200),
        Industry_Sector VARCHAR(100),
        Accident_Level VARCHAR(50),
        Potential_Accident_Level VARCHAR(50),
        Genre VARCHAR(20),
        Employee_or_Third_Party VARCHAR(50),
        Critical_Risk VARCHAR(200),
        Description TEXT
    )
    """)
    result = db.execute("SELECT COUNT(*) FROM acidentes").fetchall()
    if result[0][0] == 0:
        subir_csv_para_db(db)
    db.close()

@app.teardown_appcontext
def close_db(error):
    """Fechar a conexão com o banco de dados quando terminar a requisição"""
    db = g.pop('db', None)
    if db is not None:
        db.close()

@app.route('/')
def index():
    db = get_db()
    result = db.execute("SELECT * FROM acidentes").fetchall()
    return render_template('index.html', acidentes=result)

if __name__ == '__main__':
    init_db()
    app.run(debug=True, host='0.0.0.0', port=5000)